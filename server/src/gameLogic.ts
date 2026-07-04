import { redis } from "./db";
import { appServer, gameTimers, clearGameTimer } from "./state";
import { RoomState } from "./types";
import { getRandomWords } from "./utils/words";

export async function advanceGame(roomId: string) {
  const room: RoomState | null = await redis.get(`room:${roomId}`);
  if (!room || room.status !== "playing" || !room.gameState) return;

  const gs = room.gameState;
  const drawer = room.players[gs.currentTurnIndex];

  if (gs.phase === "choosing") {
    gs.phase = "drawing";
    gs.serverOnlyCurrentWord = gs.serverOnlyWordChoices?.[0] || "apple";
    gs.wordLength = gs.serverOnlyCurrentWord.length;
    gs.turnEndTime = Date.now() + (room.settings?.drawTime || 80) * 1000;

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

    await redis.set(`room:${roomId}`, room, { ex: 7200 });

    const clientRoom = JSON.parse(JSON.stringify(room));
    delete clientRoom.gameState.serverOnlyCurrentWord;
    delete clientRoom.gameState.serverOnlyWordChoices;
    appServer?.publish(
      roomId,
      JSON.stringify({ type: "room_state", room: clientRoom }),
    );

    appServer?.publish(
      `user:${drawer.id}`,
      JSON.stringify({
        type: "you_are_drawing",
        word: gs.serverOnlyCurrentWord,
      }),
    );

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), gs.turnEndTime - Date.now()),
    );
  } else if (gs.phase === "drawing") {
    gs.phase = "round_end";
    const originalTurnEndTime = gs.turnEndTime;
    gs.turnEndTime = Date.now() + 5000;

    // Distribute Points
    room.players.forEach((p) => (p.lastRoundPoints = 0));

    if (gs.guessedCorrectly.length > 0) {
      const totalTime = (room.settings?.drawTime || 80) * 1000;
      const roundStartTime = originalTurnEndTime - totalTime; // exact start time

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

          // Calculate penalty based on how many hints were revealed at the time of the guess
          const fractionAtGuess = timeTaken / totalTime;
          let hintsRevealedAtGuess = 0;
          if (fractionAtGuess > 0.45) hintsRevealedAtGuess = 1;
          if (fractionAtGuess > 0.7) hintsRevealedAtGuess = 2;
          if (fractionAtGuess > 0.85) hintsRevealedAtGuess = 3;

          const hintPenaltyMultiplier = 1 - hintsRevealedAtGuess * 0.15; // -15% per hint

          const timeLeft = Math.max(0, totalTime - timeTaken);

          let points = Math.floor(
            (timeLeft / totalTime) * 300 * hintPenaltyMultiplier,
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

    await redis.set(`room:${roomId}`, room, { ex: 7200 });
    // Add to sync queue for bulk background DB sync
    await redis.sadd("sync_queue", roomId);

    appServer?.publish(
      roomId,
      JSON.stringify({
        type: "chat",
        userId: "system",
        name: "System",
        text: `The word was ${gs.serverOnlyCurrentWord}!`,
        timestamp: Date.now(),
      }),
    );

    appServer?.publish(
      roomId,
      JSON.stringify({
        type: "round_end",
        word: gs.serverOnlyCurrentWord,
      }),
    );

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

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), 5000),
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
      await redis.set(`room:${roomId}`, room, { ex: 7200 });
      appServer?.publish(roomId, JSON.stringify({ type: "room_state", room }));
      // Add to sync queue for final DB sync
      await redis.sadd("sync_queue", roomId);
      return;
    }

    // Add to sync queue after each full round to update DB incrementally
    await redis.sadd("sync_queue", roomId);

    gs.phase = "choosing";
    gs.serverOnlyWordChoices = getRandomWords(
      room.settings?.wordCount || 3,
      room.settings?.customWords,
      room.settings?.customWordsOnly,
    );
    gs.guessedCorrectly = [];
    gs.serverOnlyGuessedTimes = {};
    gs.wordLength = 0;
    gs.lastSentHint = "";
    gs.serverOnlyCurrentWord = "";
    gs.turnEndTime = Date.now() + 15000;

    await redis.set(`room:${roomId}`, room, { ex: 7200 });

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

    const newDrawer = room.players[gs.currentTurnIndex];
    appServer?.publish(
      `user:${newDrawer.id}`,
      JSON.stringify({
        type: "choose_word",
        choices: gs.serverOnlyWordChoices,
      }),
    );

    clearGameTimer(roomId);
    gameTimers.set(
      roomId,
      setTimeout(() => advanceGame(roomId), 15000),
    );
  }
}


