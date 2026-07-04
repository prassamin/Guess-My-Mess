import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { redis, supabase } from "./db";
import {
  activeSockets,
  gameTimers,
  clearGameTimer,
  setAppServer,
  appServer,
} from "./state";
import { RoomState } from "./types";
import { advanceGame } from "./gameLogic";
import { calculateTTL } from "./utils/room";
import { levenshtein, getRandomWords } from "./utils/words";
import { startBackgroundTasks } from "./backgroundTasks";

const app = new Elysia()
  .use(cors())
  .ws("/ws", {
    idleTimeout: 30,
    query: t.Object({
      roomId: t.String(),
      userId: t.String(),
      name: t.String(),
      avatar: t.String(),
    }),
    open(ws) {
      (ws.data as any).connId = Math.random().toString();

      const { roomId, userId, name, avatar } = ws.data.query;
      let roomSockets = activeSockets.get(roomId);
      if (!roomSockets) {
        roomSockets = new Map();
        activeSockets.set(roomId, roomSockets);
      }

      let userSockets = roomSockets.get(userId);
      if (!userSockets) {
        userSockets = new Set();
        roomSockets.set(userId, userSockets);
      }
      userSockets.add((ws.data as any).connId);

      ws.subscribe(roomId);
      ws.subscribe(`user:${userId}`);

      console.log(`Player ${name} (${userId}) joining room ${roomId}`);

      (async () => {
        try {
          const room: RoomState | null = await redis.get(`room:${roomId}`);
          if (!room) {
            ws.close();
            return;
          }

          let isNewJoin = false;
          if (!room.players) room.players = [];
          if (!room.players.find((p) => p.id === userId)) {
            isNewJoin = true;

            // Check if they are returning from abandonedPlayers to recover their score
            let recoveredScore = 0;
            if (room.abandonedPlayers) {
              const abandonedIndex = room.abandonedPlayers.findIndex(
                (p) => p.id === userId,
              );
              if (abandonedIndex !== -1) {
                recoveredScore = room.abandonedPlayers[abandonedIndex].score;
                // Remove them from abandoned list since they are back
                room.abandonedPlayers.splice(abandonedIndex, 1);
              }
            }

            room.players.push({
              id: userId,
              name,
              avatar,
              score: recoveredScore,
            });
          }
          if (room.players.length === 1) room.hostId = userId;

          await redis.set(`room:${roomId}`, room, { ex: calculateTTL(room) });

          if (isNewJoin) {
            const joinMsg = JSON.stringify({
              type: "chat",
              userId: "system",
              name: "System",
              text: `${name} joined the room!`,
              timestamp: Date.now(),
            });
            ws.send(joinMsg);
            ws.publish(roomId, joinMsg);
          }

          const clientRoom = JSON.parse(JSON.stringify(room));
          if (clientRoom.gameState) {
            delete clientRoom.gameState.serverOnlyCurrentWord;
            delete clientRoom.gameState.serverOnlyWordChoices;
            delete clientRoom.gameState.serverOnlyGuessedTimes;
            delete clientRoom.gameState.serverOnlyHintIndices;
          }
          const stateMsg = JSON.stringify({
            type: "room_state",
            room: clientRoom,
          });
          ws.send(stateMsg);
          ws.publish(roomId, stateMsg);

          if (room.status === "playing" && room.gameState) {
            if (!gameTimers.has(roomId)) {
              const timeLeft = Math.max(
                0,
                room.gameState.turnEndTime - Date.now(),
              );
              gameTimers.set(
                roomId,
                setTimeout(() => advanceGame(roomId), timeLeft),
              );
            }

            const drawer = room.players[room.gameState.currentTurnIndex];
            if (drawer.id === userId) {
              if (room.gameState.phase === "choosing") {
                ws.send(
                  JSON.stringify({
                    type: "choose_word",
                    choices: room.gameState.serverOnlyWordChoices,
                  }),
                );
              } else if (room.gameState.phase === "drawing") {
                ws.send(
                  JSON.stringify({
                    type: "you_are_drawing",
                    word: room.gameState.serverOnlyCurrentWord,
                  }),
                );
              }
            } else if (isNewJoin && room.gameState.phase === "drawing") {
              appServer?.publish(
                `user:${drawer.id}`,
                JSON.stringify({
                  type: "request_canvas_sync",
                  requesterId: userId,
                }),
              );
            }
          }
        } catch (e) {
          console.error(e);
        }
      })();
    },
    message(ws, message: any) {
      const { roomId, userId } = ws.data.query;

      (async () => {
        try {
          if (message.type === "chat") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (
              room &&
              room.status === "playing" &&
              room.gameState?.phase === "drawing"
            ) {
              const gs = room.gameState;
              const drawer = room.players[gs.currentTurnIndex];

              if (
                userId !== drawer.id &&
                gs.serverOnlyCurrentWord &&
                message.text.trim().toLowerCase() ===
                  gs.serverOnlyCurrentWord.toLowerCase()
              ) {
                if (!gs.guessedCorrectly.includes(userId)) {
                  gs.guessedCorrectly.push(userId);

                  if (!gs.serverOnlyGuessedTimes)
                    gs.serverOnlyGuessedTimes = {};
                  gs.serverOnlyGuessedTimes[userId] = Date.now();

                  await redis.set(`room:${roomId}`, room, {
                    ex: calculateTTL(room),
                  });

                  const correctMsg = JSON.stringify({
                    type: "chat",
                    userId: "system",
                    name: "System",
                    text: `${ws.data.query.name} guessed the word!`,
                    timestamp: Date.now(),
                    isCorrectGuess: true,
                  });
                  ws.send(correctMsg);
                  ws.publish(roomId, correctMsg);

                  const clientRoom = JSON.parse(JSON.stringify(room));
                  if (clientRoom.gameState) {
                    delete clientRoom.gameState.serverOnlyCurrentWord;
                    delete clientRoom.gameState.serverOnlyWordChoices;
                    delete clientRoom.gameState.serverOnlyGuessedTimes;
                    delete clientRoom.gameState.serverOnlyHintIndices;
                  }
                  appServer?.publish(
                    roomId,
                    JSON.stringify({ type: "room_state", room: clientRoom }),
                  );

                  if (gs.guessedCorrectly.length >= room.players.length - 1) {
                    clearGameTimer(roomId);
                    advanceGame(roomId);
                  }
                }
                return; // Stop normal chat broadcast
              } else if (
                userId !== drawer.id &&
                gs.serverOnlyCurrentWord &&
                !gs.guessedCorrectly.includes(userId)
              ) {
                const guess = message.text.trim().toLowerCase();
                const word = gs.serverOnlyCurrentWord.toLowerCase();

                // Only check close guesses for words 3 letters or longer
                if (word.length >= 3) {
                  const dist = levenshtein(guess, word);
                  const maxDistance = word.length > 5 ? 2 : 1;

                  if (dist > 0 && dist <= maxDistance) {
                    const closeMsg = JSON.stringify({
                      type: "chat",
                      userId: "system",
                      name: "System",
                      text: `'${message.text}' is very close!`,
                      timestamp: Date.now(),
                      isCloseGuess: true,
                    });
                    // Send only to the user who guessed it
                    ws.send(closeMsg);

                    // We do NOT return here, so the actual guess still goes into the normal chat
                  }
                }
              }
            }

            const chatMsg = JSON.stringify({
              type: "chat",
              userId,
              name: ws.data.query.name,
              text: message.text,
              timestamp: Date.now(),
            });
            ws.send(chatMsg);
            if (!room?.serverMutedUsers?.includes(userId)) {
              ws.publish(roomId, chatMsg);
            }
          }

          if (message.type === "close_room") {
            const room = await redis.get(`room:${roomId}`);
            if (room && (room as any)?.hostId === userId) {
              const closeMsg = JSON.stringify({ type: "room_closed" });
              ws.send(closeMsg);
              ws.publish(roomId, closeMsg);
              await redis.del(`room:${roomId}`);
              clearGameTimer(roomId);
            }
          }

          if (message.type === "close_room") {
            const room = await redis.get(`room:${roomId}`);
            if (room && (room as any)?.hostId === userId) {
              await redis.del(`room:${roomId}`);
              clearGameTimer(roomId);
              const closeMsg = JSON.stringify({ type: "room_closed" });
              ws.send(closeMsg);
              ws.publish(roomId, closeMsg);
            }
          }

          if (message.type === "start_game") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && room.hostId === userId && room.status !== "playing") {
              room.status = "playing";

              // Generate IDs and push to DB
              const { data: game, error: gameError } = await supabase
                .from("games")
                .insert({
                  room_code: roomId,
                  total_rounds: room.settings?.rounds || 3,
                  status: "in_progress",
                })
                .select()
                .single();

              if (gameError) {
                console.error("Failed to insert game:", gameError);
              }

              if (game && !gameError) {
                room.db_game_id = game.id;

                const playersToInsert = room.players.map((p) => {
                  const isGuest = p.id.startsWith("guest-") || p.id.length < 30;
                  return {
                    game_id: game.id,
                    profile_id: isGuest ? null : p.id,
                    guest_name: isGuest ? p.name : null,
                    guest_avatar: isGuest ? p.avatar : null,
                    score: 0,
                    placement: null,
                  };
                });

                const { data: insertedPlayers, error: insertError } =
                  await supabase
                    .from("game_players")
                    .insert(playersToInsert)
                    .select();
                if (insertError) {
                  console.error("Failed to insert players:", insertError);
                } else if (insertedPlayers) {
                  // Map the generated IDs back to the players in the room
                  room.players.forEach((p) => {
                    const inserted = insertedPlayers.find(
                      (ip) =>
                        ip.profile_id === p.id || ip.guest_name === p.name,
                    );
                    if (inserted) {
                      p.db_player_id = inserted.id;
                    }
                  });
                }
              }

              room.players.forEach((p) => (p.score = 0));

              room.gameState = {
                currentRound: 1,
                currentTurnIndex: 0,
                phase: "choosing",
                turnEndTime: Date.now() + 15000,
                guessedCorrectly: [],
                wordLength: 0,
                serverOnlyWordChoices: getRandomWords(
                  room.settings?.wordCount || 3,
                  room.settings?.customWords,
                  room.settings?.customWordsOnly,
                ),
                serverOnlyCurrentWord: "",
              };
              await redis.set(`room:${roomId}`, room, {
                ex: calculateTTL(room),
              });

              const clientRoom = JSON.parse(JSON.stringify(room));
              delete clientRoom.gameState.serverOnlyCurrentWord;
              delete clientRoom.gameState.serverOnlyWordChoices;
              const stateMsg = JSON.stringify({
                type: "room_state",
                room: clientRoom,
              });
              ws.send(stateMsg);
              ws.publish(roomId, stateMsg);

              const drawer = room.players[0];
              const choiceMsg = JSON.stringify({
                type: "choose_word",
                choices: room.gameState.serverOnlyWordChoices,
              });
              if (drawer.id === userId) ws.send(choiceMsg);
              else appServer?.publish(`user:${drawer.id}`, choiceMsg);

              clearGameTimer(roomId);
              gameTimers.set(
                roomId,
                setTimeout(() => advanceGame(roomId), 15000),
              );
            }
          }

          if (message.type === "kick") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && room.hostId === userId && message.targetId) {
              appServer?.publish(
                `user:${message.targetId}`,
                JSON.stringify({ type: "kicked" }),
              );
              appServer?.publish(
                roomId,
                JSON.stringify({
                  type: "chat",
                  userId: "system",
                  name: "System",
                  text: `${room.players.find((p) => p.id === message.targetId)?.name || "A player"} was kicked by the host.`,
                  timestamp: Date.now(),
                }),
              );
            }
          }

          if (message.type === "server_toggle_mute") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && room.hostId === userId && message.targetId) {
              if (!room.serverMutedUsers) room.serverMutedUsers = [];

              if (room.serverMutedUsers.includes(message.targetId)) {
                room.serverMutedUsers = room.serverMutedUsers.filter(
                  (id) => id !== message.targetId,
                );
              } else {
                room.serverMutedUsers.push(message.targetId);
              }

              await redis.set(`room:${roomId}`, room, {
                ex: calculateTTL(room),
              });

              const clientRoom = JSON.parse(JSON.stringify(room));
              if (clientRoom.gameState) {
                delete clientRoom.gameState.serverOnlyCurrentWord;
                delete clientRoom.gameState.serverOnlyWordChoices;
                delete clientRoom.gameState.serverOnlyGuessedTimes;
                delete clientRoom.gameState.serverOnlyHintIndices;
              }
              appServer?.publish(
                roomId,
                JSON.stringify({ type: "room_state", room: clientRoom }),
              );
            }
          }

          if (message.type === "vote_kick") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && message.targetId) {
              if (!room.kickVotes) room.kickVotes = {};
              if (!room.kickVotesNo) room.kickVotesNo = {};

              const isNewPoll =
                !room.kickVotes[message.targetId] ||
                room.kickVotes[message.targetId].length === 0;
              if (!room.kickVotes[message.targetId])
                room.kickVotes[message.targetId] = [];
              if (!room.kickVotesNo[message.targetId])
                room.kickVotesNo[message.targetId] = [];

              if (
                !room.kickVotes[message.targetId].includes(userId) &&
                !room.kickVotesNo[message.targetId].includes(userId)
              ) {
                room.kickVotes[message.targetId].push(userId);

                const votesNeeded = Math.ceil(room.players.length / 2);
                const currentVotes = room.kickVotes[message.targetId].length;

                if (currentVotes >= votesNeeded && room.players.length > 2) {
                  appServer?.publish(
                    `user:${message.targetId}`,
                    JSON.stringify({ type: "kicked" }),
                  );
                  appServer?.publish(
                    roomId,
                    JSON.stringify({
                      type: "chat",
                      userId: "system",
                      name: "System",
                      text: `${room.players.find((p) => p.id === message.targetId)?.name || "A player"} was kicked by vote.`,
                      timestamp: Date.now(),
                    }),
                  );
                  delete room.kickVotes[message.targetId];
                  delete room.kickVotesNo[message.targetId];
                  const timerId = `${roomId}-kick-${message.targetId}`;
                  if (gameTimers.has(timerId)) {
                    clearTimeout(gameTimers.get(timerId)!);
                    gameTimers.delete(timerId);
                  }
                } else if (isNewPoll) {
                  const targetName =
                    room.players.find((p) => p.id === message.targetId)?.name ||
                    "a player";
                  appServer?.publish(
                    roomId,
                    JSON.stringify({
                      type: "chat",
                      userId: "system",
                      name: "System",
                      text: `A vote to kick ${targetName} has started!`,
                      timestamp: Date.now(),
                    }),
                  );

                  const timerId = `${roomId}-kick-${message.targetId}`;
                  gameTimers.set(
                    timerId,
                    setTimeout(async () => {
                      const currentRoom: RoomState | null = await redis.get(
                        `room:${roomId}`,
                      );
                      if (
                        currentRoom &&
                        currentRoom.kickVotes &&
                        currentRoom.kickVotes[message.targetId]
                      ) {
                        delete currentRoom.kickVotes[message.targetId];
                        if (currentRoom.kickVotesNo)
                          delete currentRoom.kickVotesNo[message.targetId];
                        await redis.set(`room:${roomId}`, currentRoom, {
                          ex: calculateTTL(currentRoom),
                        });

                        const cRoom = JSON.parse(JSON.stringify(currentRoom));
                        if (cRoom.gameState) {
                          delete cRoom.gameState.serverOnlyCurrentWord;
                          delete cRoom.gameState.serverOnlyWordChoices;
                          delete cRoom.gameState.serverOnlyGuessedTimes;
                          delete cRoom.gameState.serverOnlyHintIndices;
                        }
                        appServer?.publish(
                          roomId,
                          JSON.stringify({ type: "room_state", room: cRoom }),
                        );
                        appServer?.publish(
                          roomId,
                          JSON.stringify({
                            type: "chat",
                            userId: "system",
                            name: "System",
                            text: `Vote to kick ${targetName} failed.`,
                            timestamp: Date.now(),
                          }),
                        );
                      }
                      gameTimers.delete(timerId);
                    }, 30000),
                  );
                }

                await redis.set(`room:${roomId}`, room, {
                  ex: calculateTTL(room),
                });
                const clientRoom = JSON.parse(JSON.stringify(room));
                if (clientRoom.gameState) {
                  delete clientRoom.gameState.serverOnlyCurrentWord;
                  delete clientRoom.gameState.serverOnlyWordChoices;
                  delete clientRoom.gameState.serverOnlyGuessedTimes;
                  delete clientRoom.gameState.serverOnlyHintIndices;
                }
                appServer?.publish(
                  roomId,
                  JSON.stringify({ type: "room_state", room: clientRoom }),
                );
              }
            }
          }

          if (message.type === "vote_kick_no") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && message.targetId) {
              if (!room.kickVotes) room.kickVotes = {};
              if (!room.kickVotesNo) room.kickVotesNo = {};

              if (!room.kickVotes[message.targetId])
                room.kickVotes[message.targetId] = [];
              if (!room.kickVotesNo[message.targetId])
                room.kickVotesNo[message.targetId] = [];

              // Only allow if there's an active poll and they haven't voted yet
              if (
                room.kickVotes[message.targetId].length > 0 &&
                !room.kickVotes[message.targetId].includes(userId) &&
                !room.kickVotesNo[message.targetId].includes(userId)
              ) {
                room.kickVotesNo[message.targetId].push(userId);

                const votesNeeded = Math.ceil(room.players.length / 2);
                const currentNoVotes =
                  room.kickVotesNo[message.targetId].length;

                // If no votes reach majority, poll fails instantly!
                if (currentNoVotes >= votesNeeded) {
                  const targetName =
                    room.players.find((p) => p.id === message.targetId)?.name ||
                    "a player";

                  delete room.kickVotes[message.targetId];
                  delete room.kickVotesNo[message.targetId];

                  const timerId = `${roomId}-kick-${message.targetId}`;
                  if (gameTimers.has(timerId)) {
                    clearTimeout(gameTimers.get(timerId)!);
                    gameTimers.delete(timerId);
                  }

                  appServer?.publish(
                    roomId,
                    JSON.stringify({
                      type: "chat",
                      userId: "system",
                      name: "System",
                      text: `Vote to kick ${targetName} failed by majority 'No' votes.`,
                      timestamp: Date.now(),
                    }),
                  );
                }

                await redis.set(`room:${roomId}`, room, {
                  ex: calculateTTL(room),
                });
                const clientRoom = JSON.parse(JSON.stringify(room));
                if (clientRoom.gameState) {
                  delete clientRoom.gameState.serverOnlyCurrentWord;
                  delete clientRoom.gameState.serverOnlyWordChoices;
                  delete clientRoom.gameState.serverOnlyGuessedTimes;
                  delete clientRoom.gameState.serverOnlyHintIndices;
                }
                appServer?.publish(
                  roomId,
                  JSON.stringify({ type: "room_state", room: clientRoom }),
                );
              }
            }
          }

          if (
            message.type === "draw" ||
            message.type === "clear_canvas" ||
            message.type === "fill" ||
            message.type === "sync_canvas"
          ) {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (
              room &&
              room.status === "playing" &&
              room.gameState?.phase === "drawing"
            ) {
              const gs = room.gameState;
              const drawer = room.players[gs.currentTurnIndex];
              if (userId === drawer.id) {
                if (message.type === "sync_canvas" && message.targetId) {
                  appServer?.publish(
                    `user:${message.targetId}`,
                    JSON.stringify(message),
                  );
                } else {
                  ws.publish(roomId, JSON.stringify(message));
                }
              }
            }
          }

          if (message.type === "request_canvas_sync") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (
              room &&
              room.status === "playing" &&
              room.gameState?.phase === "drawing"
            ) {
              const gs = room.gameState;
              const drawer = room.players[gs.currentTurnIndex];
              if (userId !== drawer.id) {
                appServer?.publish(
                  `user:${drawer.id}`,
                  JSON.stringify({
                    type: "request_canvas_sync",
                    requesterId: userId,
                  }),
                );
              }
            }
          }

          if (message.type === "word_chosen") {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (
              room &&
              room.status === "playing" &&
              room.gameState?.phase === "choosing"
            ) {
              const gs = room.gameState;
              const drawer = room.players[gs.currentTurnIndex];

              if (userId === drawer.id) {
                gs.phase = "drawing";
                gs.serverOnlyCurrentWord = message.word;

                // Generate random hint indices
                const len = message.word.length;
                const maxHints = Math.max(1, Math.floor(len / 2.5));
                const indices = Array.from({ length: len }, (_, i) => i)
                  .filter((i) => message.word[i] !== " ")
                  .sort(() => Math.random() - 0.5)
                  .slice(0, maxHints);
                gs.serverOnlyHintIndices = indices;

                let initialHint = "";
                for (let i = 0; i < len; i++) {
                  if (message.word[i] === " ") initialHint += "  ";
                  else initialHint += "_ ";
                }
                gs.lastSentHint = initialHint.trimEnd();

                gs.wordLength = message.word.length;
                gs.turnEndTime =
                  Date.now() + (room.settings?.drawTime || 80) * 1000;

                await redis.set(`room:${roomId}`, room, {
                  ex: calculateTTL(room),
                });

                const clientRoom = JSON.parse(JSON.stringify(room));
                if (clientRoom.gameState) {
                  delete clientRoom.gameState.serverOnlyCurrentWord;
                  delete clientRoom.gameState.serverOnlyWordChoices;
                  delete clientRoom.gameState.serverOnlyGuessedTimes;
                  delete clientRoom.gameState.serverOnlyHintIndices;
                }
                const stateMsg = JSON.stringify({
                  type: "room_state",
                  room: clientRoom,
                });
                ws.send(stateMsg);
                ws.publish(roomId, stateMsg);

                ws.send(
                  JSON.stringify({
                    type: "you_are_drawing",
                    word: message.word,
                  }),
                );

                clearGameTimer(roomId);
                gameTimers.set(
                  roomId,
                  setTimeout(
                    () => advanceGame(roomId),
                    gs.turnEndTime - Date.now(),
                  ),
                );
              }
            }
          }
        } catch (e) {
          console.error(e);
        }
      })();
    },
    close(ws) {
      const { roomId, userId, name } = ws.data.query;

      const roomSockets = activeSockets.get(roomId);
      if (roomSockets) {
        const userSockets = roomSockets.get(userId);
        if (userSockets) {
          userSockets.delete((ws.data as any).connId);
          if (userSockets.size === 0) {
            roomSockets.delete(userId);
          }
        }
      }

      setTimeout(async () => {
        try {
          // Check if they reconnected in the last 1.5 seconds
          const currentRoomSockets = activeSockets.get(roomId);
          if (
            currentRoomSockets &&
            currentRoomSockets.has(userId) &&
            currentRoomSockets.get(userId)!.size > 0
          ) {
            return; // They are still connected!
          }

          const room: RoomState | null = await redis.get(`room:${roomId}`);
          if (room) {
            let oldDrawerIndex = -1;
            if (room.status === "playing" && room.gameState) {
              oldDrawerIndex = room.gameState.currentTurnIndex;
            }

            const removedIndex = room.players.findIndex((p) => p.id === userId);
            if (removedIndex === -1) return;
            const removedPlayer = room.players[removedIndex];
            room.players = room.players.filter((p) => p.id !== userId);

            if (removedPlayer) {
              if (!room.abandonedPlayers) room.abandonedPlayers = [];
              // Update or push the abandoned player
              const existingIndex = room.abandonedPlayers.findIndex(
                (p) => p.id === removedPlayer.id,
              );
              if (existingIndex !== -1)
                room.abandonedPlayers[existingIndex] = removedPlayer;
              else room.abandonedPlayers.push(removedPlayer);
            }

            if (room.players.length > 0 && room.hostId === userId) {
              room.hostId = room.players[0].id;
            }

            if (room.status === "playing" && room.gameState) {
              if (room.players.length <= 1) {
                room.status = "waiting";
                // Don't delete gameState yet so the DB sync knows how many rounds were finished
                clearGameTimer(roomId);
                if (room.db_game_id) {
                  await redis.sadd("sync_queue", roomId);
                }
                appServer?.publish(
                  roomId,
                  JSON.stringify({
                    type: "chat",
                    userId: "system",
                    name: "System",
                    text: `Not enough players to continue the game.`,
                    timestamp: Date.now(),
                  }),
                );
              } else if (removedIndex === oldDrawerIndex) {
                room.gameState.phase = "round_end";
                room.gameState.turnEndTime = Date.now() + 5000;
                room.gameState.currentTurnIndex = Math.max(
                  0,
                  oldDrawerIndex - 1,
                );
                (room.gameState as any).drawerLeft = true;

                // Reset last round points so players don't visually "re-receive" points from previous turn
                room.players.forEach((p) => (p.lastRoundPoints = 0));
                if (room.abandonedPlayers) {
                  room.abandonedPlayers.forEach((p) => (p.lastRoundPoints = 0));
                }

                appServer?.publish(
                  roomId,
                  JSON.stringify({
                    type: "chat",
                    userId: "system",
                    name: "System",
                    text: `The drawer left!`,
                    timestamp: Date.now(),
                  }),
                );

                appServer?.publish(
                  roomId,
                  JSON.stringify({
                    type: "round_end",
                    word: room.gameState.serverOnlyCurrentWord,
                  }),
                );

                clearGameTimer(roomId);
                gameTimers.set(
                  roomId,
                  setTimeout(() => advanceGame(roomId), 5000),
                );
              } else if (removedIndex < oldDrawerIndex) {
                room.gameState.currentTurnIndex--;
              }
            }

            if (room.players.length === 0) {
              room.status = "finished";
              clearGameTimer(roomId);
              if (room.db_game_id) {
                await redis.sadd("sync_queue", roomId);
              }
              await redis.set(`room:${roomId}`, room, { ex: 120 });
            } else {
              await redis.set(`room:${roomId}`, room, {
                ex: calculateTTL(room),
              });

              const clientRoom = JSON.parse(JSON.stringify(room));
              if (clientRoom.gameState) {
                delete clientRoom.gameState.serverOnlyCurrentWord;
                delete clientRoom.gameState.serverOnlyWordChoices;
                delete clientRoom.gameState.serverOnlyGuessedTimes;
                delete clientRoom.gameState.serverOnlyHintIndices;
              }
              appServer?.publish(
                roomId,
                JSON.stringify({ type: "room_state", room: clientRoom }),
              );

              appServer?.publish(
                roomId,
                JSON.stringify({
                  type: "chat",
                  userId: "system",
                  name: "System",
                  text: `${name} left the room!`,
                  timestamp: Date.now(),
                }),
              );
            }
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    },
  })
  .get("/", () => "Guess My Mess Server is running!")
  .listen({ port: 3001, hostname: "0.0.0.0" });

setAppServer(app.server);
console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

startBackgroundTasks();
