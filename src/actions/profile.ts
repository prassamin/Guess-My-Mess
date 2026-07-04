"use server";

import { unstable_cache, revalidatePath } from "next/cache";
import { createServiceClient } from "@/lib/supabase/server";

export async function getProfileData(username: string) {
  const getCachedProfileData = unstable_cache(
    async () => {
      // Use plain client for caching
      const supabase = createServiceClient()

      // Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError || !profileData) {
        return { success: false, error: "Profile not found" };
      }

      // Fetch Match History
      const { data: matchData } = await supabase
        .from("game_players")
        .select(
          `
          score,
          placement,
          joined_at,
          games!inner (
            id,
            room_code,
            total_rounds,
            status,
            created_at,
            finished_at,
            game_players (
              score,
              placement,
              guest_name,
              guest_avatar,
              profiles (
                name,
                avatar,
                username
              )
            )
          )
        `,
        )
        .eq("profile_id", profileData.id)
        .order("joined_at", { ascending: false })
        .limit(50);

      return {
        success: true,
        profile: profileData,
        matches: matchData || [],
      };
    },
    ["profile-data", username], 
    {
      revalidate: 30,
      tags: [`profile-${username}`],
    }
  );

  try {
    return await getCachedProfileData();
  } catch (error) {
    console.error("Error fetching profile:", error);
    return { success: false, error: "Internal server error" };
  }
}

export async function revalidateProfile(username: string) {
  // Call this after a user successfully edits their profile
  revalidatePath(`/profile/${username}`);
}
