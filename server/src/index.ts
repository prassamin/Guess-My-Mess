import { createServer } from "http";
import { Server } from "socket.io";
import { redis, supabase } from "./db";
import {
  activeSockets,
  gameTimers,
  activeDrawers,
  roomCache,
  startingRooms,
  kickedUsers,
  clearGameTimer,
  setAppServer,
  appServer,
} from "./state";
import { RoomState } from "./types";
import { advanceGame } from "./gameLogic";
import { calculateTTL } from "./utils/room";
import { levenshtein, getRandomWords } from "./utils/words";
import { startBackgroundTasks } from "./backgroundTasks";

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      status: "ok",
      service: "Guess My Mess Server",
      uptime: Math.floor(process.uptime()),
      rooms: roomCache.size,
      timestamp: new Date().toISOString(),
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});
const io = new Server(httpServer, {
  path: "/v1/game/ws",
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

setAppServer(io);

io.on("connection", (socket) => {
  const { roomId, userId, name, avatar } = socket.handshake.query as {
    roomId: string;
    userId: string;
    name: string;
    avatar: string;
  };

  const connId = Math.random().toString();

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
  userSockets.add(connId);

  socket.join(roomId);
  socket.join(`user:${userId}`);

  console.log(`Player ${name} (${userId}) joining room ${roomId}`);

  (async () => {
    try {
      const room: RoomState | null = await redis.get(`room:${roomId}`);
      if (!room) {
        socket.disconnect();
        return;
      }

      let isNewJoin = false;
      if (!room.players) room.players = [];
      if (!room.players.find((p) => p.id === userId)) {
        isNewJoin = true;

        let recoveredScore = 0;
        if (room.abandonedPlayers) {
          const abandonedIndex = room.abandonedPlayers.findIndex(
            (p) => p.id === userId
          );
          if (abandonedIndex !== -1) {
            recoveredScore = room.abandonedPlayers[abandonedIndex].score;
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

      room.lastActivity = Date.now();
      await redis.set(`room:${roomId}`, room, { ex: calculateTTL(room) });

      if (isNewJoin) {
        const joinMsg = {
          type: "chat",
          userId: "system",
          name: "System",
          text: `${name} joined the room!`,
          timestamp: Date.now(),
        };
        io.to(roomId).emit("chat", joinMsg);
      }

      const clientRoom = JSON.parse(JSON.stringify(room));
      if (clientRoom.gameState) {
        delete clientRoom.gameState.serverOnlyCurrentWord;
        delete clientRoom.gameState.serverOnlyWordChoices;
        delete clientRoom.gameState.serverOnlyGuessedTimes;
        delete clientRoom.gameState.serverOnlyHintIndices;
      }
      const stateMsg = {
        type: "room_state",
        room: clientRoom,
      };
      io.to(roomId).emit("room_state", stateMsg);

      if (room.status === "playing" && room.gameState) {
        if (!gameTimers.has(roomId)) {
          const timeLeft = Math.max(0, room.gameState.turnEndTime - Date.now());
          gameTimers.set(
            roomId,
            setTimeout(() => advanceGame(roomId), timeLeft)
          );
        }

        const drawer = room.players[room.gameState.currentTurnIndex];
        if (drawer.id === userId) {
          if (room.gameState.phase === "choosing") {
            socket.emit("choose_word", {
              choices: room.gameState.serverOnlyWordChoices,
            });
          } else if (room.gameState.phase === "drawing") {
            socket.emit("you_are_drawing", {
              word: room.gameState.serverOnlyCurrentWord,
            });
          }
        } else if (isNewJoin && room.gameState.phase === "drawing") {
          io.to(`user:${drawer.id}`).emit("request_canvas_sync", {
            requesterId: userId,
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  })();

  socket.on("message", async (message: any) => {
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

              if (!gs.serverOnlyGuessedTimes) gs.serverOnlyGuessedTimes = {};
              gs.serverOnlyGuessedTimes[userId] = Date.now();

              await redis.set(`room:${roomId}`, room, {
                ex: calculateTTL(room),
              });
              roomCache.set(roomId, room); // keep cache in sync with guessedCorrectly + times

              const correctMsg = {
                type: "chat",
                userId: "system",
                name: "System",
                text: `${name} guessed the word!`,
                timestamp: Date.now(),
                isCorrectGuess: true,
              };
              io.to(roomId).emit("chat", correctMsg);

              const clientRoom = JSON.parse(JSON.stringify(room));
              if (clientRoom.gameState) {
                delete clientRoom.gameState.serverOnlyCurrentWord;
                delete clientRoom.gameState.serverOnlyWordChoices;
                delete clientRoom.gameState.serverOnlyGuessedTimes;
                delete clientRoom.gameState.serverOnlyHintIndices;
              }
              io.to(roomId).emit("room_state", {
                type: "room_state",
                room: clientRoom,
              });

              if (gs.guessedCorrectly.length >= room.players.length - 1) {
                clearGameTimer(roomId);
                advanceGame(roomId);
              }
            }
            return;
          } else if (
            userId !== drawer.id &&
            gs.serverOnlyCurrentWord &&
            !gs.guessedCorrectly.includes(userId)
          ) {
            const guess = message.text.trim().toLowerCase();
            const word = gs.serverOnlyCurrentWord.toLowerCase();

            if (word.length >= 3) {
              const dist = levenshtein(guess, word);
              const maxDistance = word.length > 5 ? 2 : 1;

              if (dist > 0 && dist <= maxDistance) {
                const closeMsg = {
                  type: "chat",
                  userId: "system",
                  name: "System",
                  text: `'${message.text}' is very close!`,
                  timestamp: Date.now(),
                  isCloseGuess: true,
                };
                socket.emit("chat", closeMsg);
              }
            }
          }
        }

        const chatMsg = {
          type: "chat",
          userId,
          name,
          text: message.text,
          timestamp: Date.now(),
        };
        if (!room?.serverMutedUsers?.includes(userId)) {
          io.to(roomId).emit("chat", chatMsg);
        } else {
          // sender is muted server-side — still show to themselves only
          socket.emit("chat", chatMsg);
        }
      }

      if (message.type === "close_room") {
        const room: RoomState | null = await redis.get(`room:${roomId}`);
        if (room && room.hostId === userId) {
          io.to(roomId).emit("room_closed", { type: "room_closed" });
          await redis.del(`room:${roomId}`);
          clearGameTimer(roomId);
        }
      }

      if (message.type === "start_game") {
        // Lock: prevent race condition if two sockets fire start_game simultaneously
        if (startingRooms.has(roomId)) {
          console.log("[start_game] ignored duplicate for room", roomId);
        } else {
          startingRooms.add(roomId);
          try {
            const room: RoomState | null = await redis.get(`room:${roomId}`);
            if (room && room.hostId === userId && room.status !== "playing") {
              room.status = "playing";
              activeDrawers.delete(roomId); // Will be set when drawer picks a word

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

            const { data: insertedPlayers, error: insertError } = await supabase
              .from("game_players")
              .insert(playersToInsert)
              .select();
            if (insertError) {
              console.error("Failed to insert players:", insertError);
            } else if (insertedPlayers) {
              room.players.forEach((p) => {
                const inserted = insertedPlayers.find(
                  (ip) => ip.profile_id === p.id || ip.guest_name === p.name
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
              room.settings?.customWordsOnly
            ),
            serverOnlyCurrentWord: "",
          };
          await redis.set(`room:${roomId}`, room, {
            ex: calculateTTL(room),
          });
          roomCache.set(roomId, room); // keep in-memory cache in sync

          const clientRoom = JSON.parse(JSON.stringify(room));
          delete clientRoom.gameState.serverOnlyCurrentWord;
          delete clientRoom.gameState.serverOnlyWordChoices;
          const stateMsg = {
            type: "room_state",
            room: clientRoom,
          };
          io.to(roomId).emit("room_state", stateMsg);

          const drawer = room.players[0];
          const choiceMsg = {
            type: "choose_word",
            choices: room.gameState.serverOnlyWordChoices,
          };
          if (drawer.id === userId) socket.emit("choose_word", choiceMsg);
          else io.to(`user:${drawer.id}`).emit("choose_word", choiceMsg);

          clearGameTimer(roomId);
          gameTimers.set(
            roomId,
            setTimeout(() => advanceGame(roomId), 15000)
          );
            }
          } finally {
            startingRooms.delete(roomId); // release lock
          }
        }
      }

      if (message.type === "kick") {
        const room: RoomState | null = await redis.get(`room:${roomId}`);
        if (room && room.hostId === userId && message.targetId) {
          kickedUsers.add(`${roomId}:${message.targetId}`); // mark before disconnect fires
          io.to(`user:${message.targetId}`).emit("kicked", { type: "kicked" });
          io.to(roomId).emit("chat", {
            type: "chat",
            userId: "system",
            name: "System",
            text: `${
              room.players.find((p) => p.id === message.targetId)?.name ||
              "A player"
            } was kicked by the host.`,
            timestamp: Date.now(),
          });
        }
      }

      if (message.type === "server_toggle_mute") {
        const room: RoomState | null = await redis.get(`room:${roomId}`);
        if (room && room.hostId === userId && message.targetId) {
          if (!room.serverMutedUsers) room.serverMutedUsers = [];

          if (room.serverMutedUsers.includes(message.targetId)) {
            room.serverMutedUsers = room.serverMutedUsers.filter(
              (id) => id !== message.targetId
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
          io.to(roomId).emit("room_state", {
            type: "room_state",
            room: clientRoom,
          });
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
              io.to(`user:${message.targetId}`).emit("kicked", {
                type: "kicked",
              });
              io.to(roomId).emit("chat", {
                type: "chat",
                userId: "system",
                name: "System",
                text: `${
                  room.players.find((p) => p.id === message.targetId)?.name ||
                  "A player"
                } was kicked by vote.`,
                timestamp: Date.now(),
              });
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
              io.to(roomId).emit("chat", {
                type: "chat",
                userId: "system",
                name: "System",
                text: `A vote to kick ${targetName} has started!`,
                timestamp: Date.now(),
              });

              const timerId = `${roomId}-kick-${message.targetId}`;
              gameTimers.set(
                timerId,
                setTimeout(async () => {
                  const currentRoom: RoomState | null = await redis.get(
                    `room:${roomId}`
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
                    io.to(roomId).emit("room_state", {
                      type: "room_state",
                      room: cRoom,
                    });
                    io.to(roomId).emit("chat", {
                      type: "chat",
                      userId: "system",
                      name: "System",
                      text: `Vote to kick ${targetName} failed.`,
                      timestamp: Date.now(),
                    });
                  }
                  gameTimers.delete(timerId);
                }, 30000)
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
            io.to(roomId).emit("room_state", {
              type: "room_state",
              room: clientRoom,
            });
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

          if (
            room.kickVotes[message.targetId].length > 0 &&
            !room.kickVotes[message.targetId].includes(userId) &&
            !room.kickVotesNo[message.targetId].includes(userId)
          ) {
            room.kickVotesNo[message.targetId].push(userId);

            const votesNeeded = Math.ceil(room.players.length / 2);
            const currentNoVotes = room.kickVotesNo[message.targetId].length;

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

              io.to(roomId).emit("chat", {
                type: "chat",
                userId: "system",
                name: "System",
                text: `Vote to kick ${targetName} failed by majority 'No' votes.`,
                timestamp: Date.now(),
              });
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
            io.to(roomId).emit("room_state", {
              type: "room_state",
              room: clientRoom,
            });
          }
        }
      }

      if (
        message.type === "draw_batch" ||
        message.type === "clear_canvas" ||
        message.type === "fill" ||
        message.type === "sync_canvas"
      ) {
        // Use in-memory activeDrawers to avoid hitting Redis on every draw event (every 30ms).
        // activeDrawers is set when the drawing phase begins and cleared when it ends.
        const currentDrawer = activeDrawers.get(roomId);
        if (currentDrawer && currentDrawer === userId) {
          if (message.type === "sync_canvas" && message.targetId) {
            io.to(`user:${message.targetId}`).emit("message", message);
          } else {
            io.to(roomId).emit("message", message);
          }
        } else {
          console.log("Dropping draw: not current drawer.", "expected:", currentDrawer, "got:", userId);
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
            io.to(`user:${drawer.id}`).emit("request_canvas_sync", {
              type: "request_canvas_sync",
              requesterId: userId,
            });
          }
        }
      }

      if (message.type === "word_chosen") {
        console.log("word_chosen", message);
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
            activeDrawers.set(roomId, userId); // Allow drawing events to pass without Redis reads
            gs.serverOnlyCurrentWord = message.word;

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
            roomCache.set(roomId, room); // keep in-memory cache in sync

            const clientRoom = JSON.parse(JSON.stringify(room));
            if (clientRoom.gameState) {
              delete clientRoom.gameState.serverOnlyCurrentWord;
              delete clientRoom.gameState.serverOnlyWordChoices;
              delete clientRoom.gameState.serverOnlyGuessedTimes;
              delete clientRoom.gameState.serverOnlyHintIndices;
            }
            const stateMsg = {
              type: "room_state",
              room: clientRoom,
            };
            io.to(roomId).emit("room_state", stateMsg);

            socket.emit("you_are_drawing", {
              type: "you_are_drawing",
              word: message.word,
            });

            clearGameTimer(roomId);
            gameTimers.set(
              roomId,
              setTimeout(() => advanceGame(roomId), gs.turnEndTime - Date.now())
            );
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  });

  socket.on("disconnect", async () => {
    const roomSockets = activeSockets.get(roomId);
    if (roomSockets) {
      const userSockets = roomSockets.get(userId);
      if (userSockets) {
        userSockets.delete(connId);
        if (userSockets.size === 0) {
          roomSockets.delete(userId);
        }
      }
    }

    setTimeout(async () => {
      try {
        const currentRoomSockets = activeSockets.get(roomId);
        if (
          currentRoomSockets &&
          currentRoomSockets.has(userId) &&
          currentRoomSockets.get(userId)!.size > 0
        ) {
          return;
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
            const existingIndex = room.abandonedPlayers.findIndex(
              (p) => p.id === removedPlayer.id
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
              activeDrawers.delete(roomId);
              clearGameTimer(roomId);
              if (room.db_game_id) {
                await redis.sadd("sync_queue", roomId);
              }
              io.to(roomId).emit("chat", {
                type: "chat",
                userId: "system",
                name: "System",
                text: `Not enough players to continue the game.`,
                timestamp: Date.now(),
              });
            } else if (removedIndex === oldDrawerIndex) {
              room.gameState.phase = "round_end";
              room.gameState.turnEndTime = Date.now() + 5000;
              room.gameState.currentTurnIndex = Math.max(0, oldDrawerIndex - 1);
              (room.gameState as any).drawerLeft = true;

              room.players.forEach((p) => (p.lastRoundPoints = 0));
              if (room.abandonedPlayers) {
                room.abandonedPlayers.forEach((p) => (p.lastRoundPoints = 0));
              }

              io.to(roomId).emit("chat", {
                type: "chat",
                userId: "system",
                name: "System",
                text: `The drawer left!`,
                timestamp: Date.now(),
              });

              io.to(roomId).emit("round_end", {
                type: "round_end",
                word: room.gameState.serverOnlyCurrentWord,
              });

              clearGameTimer(roomId);
              gameTimers.set(
                roomId,
                setTimeout(() => advanceGame(roomId), 5000)
              );
            } else if (removedIndex < oldDrawerIndex) {
              room.gameState.currentTurnIndex--;
            }
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
          io.to(roomId).emit("room_state", {
            type: "room_state",
            room: clientRoom,
          });

          // Skip leave message for kicked players — kick message was already shown
          if (!kickedUsers.has(`${roomId}:${userId}`)) {
            io.to(roomId).emit("chat", {
              type: "chat",
              userId: "system",
              name: "System",
              text: `${name} left the room`,
              timestamp: Date.now(),
            });
          } else {
            kickedUsers.delete(`${roomId}:${userId}`); // clean up
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, 1500);
  });
});

const PORT = parseInt(process.env.BACKEND_PORT || "8000", 10);
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

startBackgroundTasks();
