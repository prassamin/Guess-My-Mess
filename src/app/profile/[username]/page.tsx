import { getProfileData } from "@/actions/profile";
import ProfileView from "./view";
import { createServerClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const { profile } = await getProfileData(username);

  if (!profile) {
    return {
      title: "Player Not Found",
    };
  }

  return {
    title: `${profile.name}`,
    description: `Check out ${profile.name}'s profile on Guess My Mess!`,
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { profile, matches } = await getProfileData(username);

  let isOwnProfile = false;
  if (user && profile) {
    isOwnProfile = user.id === profile.id;
  }

  return (
    <ProfileView
      username={username}
      initialProfile={profile || null}
      initialMatches={matches || []}
      isOwnProfile={isOwnProfile}
    />
  );
}
