import { UPSTASH_REDIS_REST_TOKEN, UPSTASH_REDIS_REST_URL } from "@/config/env";
import { Redis } from "@upstash/redis";

// Note: You need to set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in your .env.local
export const redis = new Redis({
  url: UPSTASH_REDIS_REST_URL || "",
  token: UPSTASH_REDIS_REST_TOKEN || "",
});

export const CACHE_KEYS = {
  room: (id: string) => `room:${id}`,
  players: (id: string) => `room:${id}:players`,
  canvas: (id: string) => `room:${id}:canvas`,
};
