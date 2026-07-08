import { redis } from "./db";
import { appServer, gameTimers, activeDrawers, roomCache, clearGameTimer } from "./state";
import { RoomState } from "./types";
import { getRandomWords } from "./utils/words";

/** Save room to both Redis and in-memory cache */
async function saveRoom(roomId: string, room: RoomState, ttl = 7200) {
  roomCache.set(roomId, room); // always update cache first
  try {
    await redis.set(`room:${roomId}`, room, { ex: ttl });
  } catch (e) {
    console.error(`[saveRoom] Redis write failed for ${roomId}, cache updated:`, e);
  }
}

/** Read room: try Redis first, fall back to in-memory cache */
async function getRoom(roomId: string): Promise<RoomState | null> {
  try {
    const room: RoomState | null = await redis.get(`room:${roomId}`);
    if (room) {
      roomCache.set(roomId, room); // keep cache fresh
      return room;
    }
  } catch (e) {
    console.error(`[getRoom] Redis read failed for ${roomId}, trying cache:`, e);
  }
  // Fallback: in-memory cache
  const cached = roomCache.get(roomId);
  if (cached) {
    console.warn(`[getRoom] Using in-memory cache for room ${roomId}`);
    return cached;
  }
  return null;
}

export async function advanceGame(roomId: string) {
  const room = await getRoom(roomId);
  if (!room || room.status !== "playing" || !room.gameState) return;

  const gs = room.gameState;
  const drawer = room.players[gs.currentTurnIndex];

  if (gs.phase === "choosing") {
    gs.phase = "drawing";
    gs.serverOnlyCurrentWord = gs.serverOnlyWordChoices?.[0] || "apple";
    gs.wordLength = gs.serverOnlyCurrentWord.length;
    gs.turnEndTime = Date.now() + (room.settings?.drawTime || 80) * 1000;
    activeDrawers.set(roomId, drawer.id); // allow drawing events without Redis reads

    // Initialize hint indices
    const hintableIndices = [];
    for (let i = 0; i < gs.serverOnlyCurrentWord.length; i++) {
      if (gs.serverOnlyCurrentWord[i] !== " ") hintableIndices.push(i);
    }
    // Shuffle
    for (let i = hintableIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [hintableIndices[i], hintableIndices[j]] = [
        hintableIndices[j],
        hintableIndices[i],
      ];
    }
    gs.serverOnlyHintIndices = hintableIndices;

    await saveRoom(roomId, room);

    const clientRoom = JSON.parse(JSON.stringify(room));
    delete clientRoom.gameState.serverOnlyCurrentWord;
    delete clientRoom.gameState.serverOnlyWordChoices;
    appServer
      ?.to(roomId)
      .emit("room_state", { type: "room_state", room: clientRoom });

    appServer?.to(`user:${drawer.id}`).emit("you_are_drawing", {
      type: "you_are_drawing",
      word: gs.serverOnlyCurrentWord,
    });

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), gs.turnEndTime - Date.now())
    );
  } else if (gs.phase === "drawing") {
    gs.phase = "round_end";
    activeDrawers.delete(roomId); // drawing phase ended
    const originalTurnEndTime = gs.turnEndTime;
    gs.turnEndTime = Date.now() + 5000;

    // Distribute Points
    room.players.forEach((p) => (p.lastRoundPoints = 0));

    if (gs.guessedCorrectly.length > 0) {
      const totalTime = (room.settings?.drawTime || 80) * 1000;
      const roundStartTime = originalTurnEndTime - totalTime;

      const drawerPlayer = room.players.find((p) => p.id === drawer.id);
      if (drawerPlayer) {
        const pts = Math.min(400, 100 + gs.guessedCorrectly.length * 25);
        drawerPlayer.score += pts;
        drawerPlayer.lastRoundPoints = pts;
      }

      gs.guessedCorrectly.forEach((guesserId, index) => {
        const player = room.players.find((p) => p.id === guesserId);
        if (player) {
          const guessTime =
            gs.serverOnlyGuessedTimes?.[guesserId] || Date.now();
          const timeTaken = Math.max(0, guessTime - roundStartTime);

          const fractionAtGuess = timeTaken / totalTime;
          let hintsRevealedAtGuess = 0;
          if (fractionAtGuess > 0.45) hintsRevealedAtGuess = 1;
          if (fractionAtGuess > 0.7) hintsRevealedAtGuess = 2;
          if (fractionAtGuess > 0.85) hintsRevealedAtGuess = 3;

          const hintPenaltyMultiplier = 1 - hintsRevealedAtGuess * 0.15;

          const timeLeft = Math.max(0, totalTime - timeTaken);

          let points = Math.floor(
            (timeLeft / totalTime) * 300 * hintPenaltyMultiplier
          );
          if (index === 0) points += 100;
          else if (index === 1) points += 75;
          else if (index === 2) points += 50;
          else points += 25;

          player.score += points;
          player.lastRoundPoints = points;
        }
      });
    }

    await saveRoom(roomId, room);
    try { await redis.sadd("sync_queue", roomId); } catch {}

    appServer?.to(roomId).emit("chat", {
      type: "chat",
      userId: "system",
      name: "System",
      text: `The word was ${gs.serverOnlyCurrentWord}!`,
      timestamp: Date.now(),
    });

    appServer?.to(roomId).emit("round_end", {
      type: "round_end",
      word: gs.serverOnlyCurrentWord,
    });

    const clientRoom = JSON.parse(JSON.stringify(room));
    if (clientRoom.gameState) {
      delete clientRoom.gameState.serverOnlyCurrentWord;
      delete clientRoom.gameState.serverOnlyWordChoices;
      delete clientRoom.gameState.serverOnlyGuessedTimes;
      delete clientRoom.gameState.serverOnlyHintIndices;
    }
    appServer
      ?.to(roomId)
      .emit("room_state", { type: "room_state", room: clientRoom });

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), 5000)
    );
  } else if (gs.phase === "round_end") {
    if ((gs as any).drawerLeft) delete (gs as any).drawerLeft;
    gs.currentTurnIndex++;
    if (gs.currentTurnIndex >= room.players.length) {
      gs.currentTurnIndex = 0;
      gs.currentRound++;
    }

    if (gs.currentRound > (room.settings?.rounds || 3)) {
      room.status = "finished";
      roomCache.delete(roomId); // game over, remove from cache
      activeDrawers.delete(roomId);
      await saveRoom(roomId, room);
      appServer?.to(roomId).emit("room_state", { type: "room_state", room });
      try { await redis.sadd("sync_queue", roomId); } catch {}
      return;
    }

    try { await redis.sadd("sync_queue", roomId); } catch {}

    gs.phase = "choosing";
    gs.serverOnlyWordChoices = getRandomWords(
      room.settings?.wordCount || 3,
      room.settings?.customWords,
      room.settings?.customWordsOnly
    );
    gs.guessedCorrectly = [];
    gs.serverOnlyGuessedTimes = {};
    gs.wordLength = 0;
    gs.lastSentHint = "";
    gs.serverOnlyCurrentWord = "";
    gs.turnEndTime = Date.now() + 15000;

    await saveRoom(roomId, room);

    const clientRoom = JSON.parse(JSON.stringify(room));
    if (clientRoom.gameState) {
      delete clientRoom.gameState.serverOnlyCurrentWord;
      delete clientRoom.gameState.serverOnlyWordChoices;
      delete clientRoom.gameState.serverOnlyGuessedTimes;
      delete clientRoom.gameState.serverOnlyHintIndices;
    }
    appServer
      ?.to(roomId)
      .emit("room_state", { type: "room_state", room: clientRoom });

    const newDrawer = room.players[gs.currentTurnIndex];
    appServer?.to(`user:${newDrawer.id}`).emit("choose_word", {
      type: "choose_word",
      choices: gs.serverOnlyWordChoices,
    });

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), 15000)
    );
  }
}
