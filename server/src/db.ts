import { Redis } from "@upstash/redis";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "WARNING: Supabase URL or Key not found in environment variables. Database history will not be saved.",
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Ensure UPSTASH environment variables are loaded
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
