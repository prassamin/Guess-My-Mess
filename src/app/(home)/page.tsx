import HomeView from "./view";
import { createServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialUser = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar")
      .eq("id", user.id)
      .single();

    initialUser = {
      ...user,
      username: profile?.username,
      avatar: profile?.avatar,
    };
  }

  return <HomeView initialUser={initialUser} />;
}
