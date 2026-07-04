"use server";

import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/config/env";
import { unstable_cache } from "next/cache";

const getCachedLeaderboardData = unstable_cache(
  async (limit: number) => {
    // Create a vanilla client that doesn't read cookies. 
    // This allows Next.js to statically cache this fetch!
    const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });

    const { data, error } = await supabase
      .from("profiles")
      .select("username, name, avatar, total_score, games_played, total_wins")
      .order("total_score", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching leaderboard:", error);
      return [];
    }

    return data || [];
  },
  ["global-leaderboard"], // Cache key
  {
    revalidate: 60, // Cache for 60 seconds
  }
);

export async function getLeaderboard(limit = 100) {
  try {
    const data = await getCachedLeaderboardData(limit);
    return { success: true, data };
  } catch (err) {
    console.error("Exception fetching leaderboard:", err);
    return { success: false, data: [] };
  }
}
