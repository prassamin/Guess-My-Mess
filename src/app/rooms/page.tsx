import { getPublicRooms } from "@/actions/room";
import RoomsView from "./view";

export const dynamic = "force-dynamic"; 

export const metadata = {
  title: "Public Lobbies",
  description: "Browse and join public lobbies to play Guess My Mess with players around the world!",
};

export default async function RoomsPage() {
  const { rooms } = await getPublicRooms();

  return <RoomsView initialRooms={rooms || []} />;
}
