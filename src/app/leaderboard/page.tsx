import { getLeaderboard } from "@/actions/leaderboard";
import LeaderboardView from "./view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Check out the top players in Guess My Mess!",
};

export default async function LeaderboardPage() {
  const { data: players } = await getLeaderboard(100);

  return <LeaderboardView players={players} />;
}
