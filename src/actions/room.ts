"use server";

import { redis, CACHE_KEYS } from "@/lib/redis";

export async function createRoomInRedis(roomCode: string, hostId: string, settings: any) {
  try {
    const roomKey = CACHE_KEYS.room(roomCode);
    
    const roomData = {
      code: roomCode,
      hostId,
      settings,
      status: "waiting", // "waiting", "playing", "finished"
      createdAt: Date.now(),
    };

    // Calculate dynamic TTL based on game settings
    // Formula: (maxPlayers * rounds * drawTime) + 30 mins buffer
    const maxPlayers = settings?.maxPlayers || 8;
    const rounds = settings?.rounds || 3;
    const drawTime = settings?.drawTime || 80;
    
    const gameDurationSeconds = maxPlayers * rounds * drawTime;
    const bufferSeconds = 30 * 60; // 30 minutes
    const ttl = gameDurationSeconds + bufferSeconds;

    await redis.set(roomKey, roomData, { ex: ttl });
    
    return { success: true };
  } catch (error) {
    console.error("Redis Error:", error);
    return { success: false, error: "Failed to create room" };
  }
}

export async function checkRoomExists(roomCode: string) {
  try {
    const exists = await redis.exists(CACHE_KEYS.room(roomCode));
    return exists === 1;
  } catch (error) {
    console.error("Redis Error:", error);
    return false;
  }
}

export async function getPublicRooms() {
  try {
    const keys = await redis.keys("room:*");
    // Filter out canvas and players keys if any leaked, we just want room:XXXXXX
    const roomKeys = keys.filter(k => /^room:[A-Z0-9]+$/.test(k));
    
    if (!roomKeys || roomKeys.length === 0) return { rooms: [] };

    // Fetch all room objects
    const roomsData = await redis.mget(...roomKeys);
    
    const publicRooms = roomsData
      .filter((r: any) => {
         if (!r || r.settings?.isPublic !== true) return false;
         
         const playersCount = r.players?.length || 0;
         
         // Only show waiting rooms, or playing rooms that have at least 2 active players
         if (r.status === 'waiting') return true;
         if (r.status === 'playing' && playersCount >= 2) return true;
         
         return false;
      })
      .map((r: any) => ({
         id: r.code || r.roomId,
         hostId: r.hostId,
         status: r.status,
         playersCount: r.players?.length || 0,
         maxPlayers: r.settings?.maxPlayers || 8,
         settings: r.settings,
         players: r.players?.map((p: any) => ({ name: p.name, avatar: p.avatar })) || []
      }));

    return { rooms: publicRooms };
  } catch (error) {
    console.error("Redis Error fetching rooms:", error);
    return { rooms: [] };
  }
}
