import { redis, supabase } from "./db";
import { appServer, activeSockets, clearGameTimer, gameTimers } from "./state";
import { RoomState } from "./types";

export function startBackgroundTasks() {
  // Background Process: Sync game history queue to Supabase
  async function processSyncQueue() {
    try {
      // Get all room IDs from sync queue
      const roomsToSync = await redis.smembers("sync_queue");
      if (!roomsToSync || roomsToSync.length === 0) return;

      // Remove them immediately so they aren't processed twice
      await redis.srem("sync_queue", ...roomsToSync);

      const gamesToUpsert: any[] = [];
      const playersToUpsert: any[] = [];

      for (const roomId of roomsToSync) {
        const room: RoomState | null = await redis.get(`room:${roomId}`);
        if (!room || !room.db_game_id) continue;

        gamesToUpsert.push({
          id: room.db_game_id,
          room_code: roomId,
          total_rounds: room.settings?.rounds || 3,
          finished_rounds: Math.max(0, (room.gameState?.currentRound || 1) - 1),
          status: room.status === "playing" ? "in_progress" : "finished",
          ...(room.status !== "playing"
            ? { finished_at: new Date().toISOString() }
            : {}),
        });

        const allPlayers = [...room.players, ...(room.abandonedPlayers || [])];
        const uniquePlayersMap = new Map();
        allPlayers.forEach((p) => uniquePlayersMap.set(p.id, p));
        const uniquePlayers = Array.from(uniquePlayersMap.values());

        const sortedPlayers = [...uniquePlayers].sort(
          (a, b) => (b.score || 0) - (a.score || 0),
        );
        sortedPlayers.forEach((p, index) => {
          if (!p.db_player_id) return;
          const isGuest = p.id.startsWith("guest-") || p.id.length < 30;
          playersToUpsert.push({
            id: p.db_player_id,
            game_id: room.db_game_id,
            profile_id: isGuest ? null : p.id,
            guest_name: isGuest ? p.name : null,
            guest_avatar: isGuest ? p.avatar : null,
            score: p.score || 0,
            placement: index + 1,
          });
        });
      }

      if (gamesToUpsert.length > 0) {
        const { error: gamesError } = await supabase
          .from("games")
          .upsert(gamesToUpsert);
        if (gamesError) console.error("Error batch upserting games:", gamesError);
      }
      if (playersToUpsert.length > 0) {
        const { error: playersError } = await supabase
          .from("game_players")
          .upsert(playersToUpsert);
        if (playersError)
          console.error("Error batch upserting players:", playersError);
      }

      if (gamesToUpsert.length > 0) {
        console.log(
          `Successfully synced ${gamesToUpsert.length} games to database in background.`,
        );
      }
    } catch (err) {
      console.error("Failed in background sync job:", err);
    }
  }

  // Run interval as fallback every 1 min
  setInterval(processSyncQueue, 1000 * 60);

  // Global tick for hints
  setInterval(async () => {
    for (const roomId of activeSockets.keys()) {
      try {
        const room = await redis.get(`room:${roomId}`);
        if (
          room &&
          (room as any)?.status === "playing" &&
          (room as any)?.gameState?.phase === "drawing"
        ) {
          const gs = (room as any)?.gameState;
          if (gs.serverOnlyCurrentWord && gs.serverOnlyHintIndices) {
            const totalTime = ((room as any)?.settings?.drawTime || 80) * 1000;
            const elapsed = Date.now() - (gs.turnEndTime - totalTime);
            const fractionElapsed = elapsed / totalTime;

            let numReveals = 0;
            if (fractionElapsed > 0.45) numReveals = 1;
            if (fractionElapsed > 0.7) numReveals = 2;
            if (fractionElapsed > 0.85) numReveals = 3;

            numReveals = Math.min(numReveals, gs.serverOnlyHintIndices.length);

            const hintArr = [];
            for (let i = 0; i < gs.wordLength; i++) {
              hintArr.push(gs.serverOnlyCurrentWord[i] === " " ? " " : "_");
            }
            for (let i = 0; i < numReveals; i++) {
              const idx = gs.serverOnlyHintIndices[i];
              hintArr[idx] = gs.serverOnlyCurrentWord[idx].toUpperCase();
            }

            const newHint = hintArr.join(" ");

            if (newHint !== gs.lastSentHint) {
              gs.lastSentHint = newHint;
              await redis.set(`room:${roomId}`, room, { ex: 7200 });

              if (appServer) {
                appServer.publish(
                  roomId,
                  JSON.stringify({ type: "hint_update", hint: newHint }),
                );
              }
            }
          }
        }
      } catch (e) {
        console.error("Hint tick error:", e);
      }
    }
  }, 2000);

  // 1. The Reaper: Clears abandoned rooms every 60 seconds
  setInterval(async () => {
    try {
      const keys = await redis.keys("room:*");
      const roomKeys = keys.filter((k) => /^room:[A-Z0-9]+$/.test(k));
      if (roomKeys.length === 0) return;

      const roomsData = await redis.mget(...roomKeys);
      for (const room of roomsData as RoomState[]) {
        if (!room) continue;

        const roomId = room.id || (room as any).code || (room as any).roomId;
        if (!roomId) continue;

        const currentSockets = activeSockets.get(roomId);
        const hasActiveSockets = currentSockets && currentSockets.size > 0;

        // If room claims to be playing but has ZERO active connections to this server
        if (!hasActiveSockets && room.status === "playing") {
          console.log(
            `[REAPER] Found zombie room ${roomId}, resetting to waiting...`,
          );
          room.status = "waiting";
          room.gameState = undefined;
          room.players = [];
          clearGameTimer(roomId);
          await redis.set(`room:${roomId}`, room, { ex: 15 });
        } else if (!hasActiveSockets && room.players.length === 0) {
          // Completely empty, delete it
          await redis.del(`room:${roomId}`);
          await redis.del(`room:${roomId}:canvas`);
        }
      }
    } catch (e) {
      console.error("Reaper interval error:", e);
    }
  }, 60000);

  // 2. Graceful Shutdown Hook: Prevent rooms from being stuck on restart
  const handleGracefulShutdown = async () => {
    console.log("\n[SERVER] Shutting down... cleaning up all active rooms...");
    try {
      for (const roomId of activeSockets.keys()) {
        const room: RoomState | null = await redis.get(`room:${roomId}`);
        if (room) {
          room.status = "waiting";
          room.gameState = undefined;
          room.players = []; // Wipe players since server died
          clearGameTimer(roomId);
          await redis.set(`room:${roomId}`, room, { ex: 15 });
        }
      }
      console.log("[SERVER] Cleanup complete. Goodbye!");
    } catch (e) {
      console.error("Error during graceful shutdown:", e);
    }
    process.exit(0);
  };

  process.on("SIGINT", handleGracefulShutdown);
  process.on("SIGTERM", handleGracefulShutdown);
}
