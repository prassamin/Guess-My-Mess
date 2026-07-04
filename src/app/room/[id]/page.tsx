import { checkRoomExists } from "@/actions/room";
import RoomView from "./view";
import Link from "next/link";
import SkyBackground from "@/components/SkyBackground";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return {
    title: `Room #${id}`,
    description: `Join room #${id} and play Guess My Mess with friends!`,
  };
}

export default async function RoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const exists = await checkRoomExists(id);

  if (!exists) {
    const textStroke = {
      textShadow:
        "-2px -2px 0 #1f2937, 2px -2px 0 #1f2937, -2px 2px 0 #1f2937, 2px 2px 0 #1f2937, 0 4px 0 #1f2937",
    };

    return (
      <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden p-4">
        <SkyBackground />
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 sm:border-[6px] border-[#0f172a] shadow-[0_6px_0_#0f172a] sm:shadow-[0_12px_0_#0f172a] relative z-10 text-center w-full max-w-md mx-4">
          <h1
            className="text-4xl sm:text-5xl font-black text-[#f87171] uppercase tracking-widest mb-4"
            style={textStroke}
          >
            <span className="text-white">Error 404</span>
          </h1>
          <p className="text-[#1f2937] font-bold text-lg sm:text-xl uppercase mb-8">
            Room not found or expired!
          </p>
          <Link
            href="/"
            className="w-full h-12 sm:h-16 bg-[#60a5fa] border-2 sm:border-4 border-[#1d4ed8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-2xl font-black text-white uppercase tracking-widest relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-xl pointer-events-none" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return <RoomView roomId={id} />;
}
