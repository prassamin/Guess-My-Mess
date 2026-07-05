import { Users, Copy, Play, XOctagon } from "lucide-react";
import { useState } from "react";
import { useRoomStore } from "@/store/room-store";
import { useRouter } from "@bprogress/next";

export default function WaitingLobby({
  roomCode,
  isHost,
  playerCount,
  minPlayers,
}: {
  roomCode: string;
  isHost: boolean;
  playerCount: number;
  minPlayers: number;
}) {
  const router = useRouter();
  const { ws } = useRoomStore();

  const onStartGame = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "start_game" }));
    }
  };

  const onCloseRoom = () => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "close_room" }));
    }
  };

  const onLeaveRoom = () => {
    router.push("/");
  };
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const smTextStroke = {
    textShadow:
      "-1.5px -1.5px 0 #1f2937, 1.5px -1.5px 0 #1f2937, -1.5px 1.5px 0 #1f2937, 1.5px 1.5px 0 #1f2937, 0 3px 0 #1f2937",
  };
  const textStroke = {
    textShadow:
      "-2px -2px 0 #1f2937, 2px -2px 0 #1f2937, -2px 2px 0 #1f2937, 2px 2px 0 #1f2937, 0 4px 0 #1f2937",
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyLink = () => {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/room/${roomCode}`
        : roomCode;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const canStart = playerCount >= minPlayers;

  return (
    <div className="bg-white rounded-none lg:rounded-4xl shadow-none lg:shadow-[0_12px_0_#94a3b8] flex flex-col items-center justify-center h-full min-h-0 border-y-2 lg:border-[6px] border-[#94a3b8] border-x-0 lg:border-x-[6px] relative overflow-y-auto overflow-x-hidden p-6 md:p-8 w-full">
      <div className="absolute top-0 inset-x-0 h-6 bg-slate-50/80 pointer-events-none z-20" />

      <h2
        className="font-black text-[#1f2937] text-4xl uppercase tracking-widest mb-2 text-center"
        style={smTextStroke}
      >
        <span className="text-white">Waiting Room</span>
      </h2>
      <p className="text-gray-500 font-bold text-xl uppercase tracking-wide mb-8 text-center">
        Invite friends with this code
      </p>

      {/* Room Code & Invite Box */}
      <div className="bg-[#e2e8f0] border-4 border-[#94a3b8] rounded-3xl p-6 flex flex-col items-center gap-4 shadow-inner w-full max-w-md relative mb-12">
        <div className="flex flex-col items-center mb-2 sm:mb-4">
          <span className="block text-gray-400 font-black text-xs sm:text-sm uppercase tracking-widest mb-1">
            Room Code
          </span>
          <span className="font-black text-4xl sm:text-6xl tracking-widest text-[#1f2937]">
            {roomCode}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full">
          <button
            onClick={handleCopyCode}
            className={`shrink-0 h-auto sm:h-14 py-2 sm:py-0 px-3 sm:px-4 rounded-xl sm:rounded-2xl border-[3px] sm:border-4 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center relative overflow-hidden flex-1 ${copiedCode ? "bg-[#4ade80] border-[#166534] shadow-[0_4px_0_#166534]" : "bg-[#60a5fa] border-[#1d4ed8] shadow-[0_4px_0_#1d4ed8]"}`}
          >
            <div className="absolute top-0 inset-x-0 h-2 sm:h-3 bg-white/30 rounded-t-lg sm:rounded-t-xl pointer-events-none" />
            <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-2 drop-shadow-sm" />
            <span
              className="font-black text-white text-xs sm:text-base uppercase tracking-wider"
              style={smTextStroke}
            >
              {copiedCode ? "Copied" : "Copy Code"}
            </span>
          </button>

          <button
            onClick={handleCopyLink}
            className={`shrink-0 h-auto sm:h-14 py-2 sm:py-0 px-3 sm:px-4 rounded-xl sm:rounded-2xl border-[3px] sm:border-4 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center relative overflow-hidden flex-1 ${copiedLink ? "bg-[#4ade80] border-[#166534] shadow-[0_4px_0_#166534]" : "bg-[#ffb74d] border-[#f57c00] shadow-[0_4px_0_#f57c00]"}`}
          >
            <div className="absolute top-0 inset-x-0 h-2 sm:h-3 bg-white/30 rounded-t-lg sm:rounded-t-xl pointer-events-none" />
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white mr-2 drop-shadow-sm" />
            <span
              className="font-black text-white text-xs sm:text-base uppercase tracking-wider"
              style={smTextStroke}
            >
              {copiedLink ? "Copied" : "Invite Link"}
            </span>
          </button>
        </div>
      </div>

      {/* Players Counter */}
      <div className="flex items-center space-x-3 mb-10 bg-white border-[3px] border-[#94a3b8] px-6 py-3 rounded-2xl shadow-[0_4px_0_#94a3b8]">
        <Users className="w-8 h-8 text-[#1f2937]" />
        <span className="font-black text-2xl text-[#1f2937] uppercase">
          {playerCount} / 8 Players
        </span>
      </div>

      {/* Start Button */}
      {isHost ? (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className="shrink-0 relative w-full h-16 sm:h-20 rounded-xl sm:rounded-2xl bg-[#4ade80] border-[3px] sm:border-4 border-[#166534] shadow-[0_6px_0_#166534] sm:shadow-[0_8px_0_#166534] active:shadow-[0_0px_0_#166534] active:translate-y-1.5 sm:active:translate-y-2 transition-all flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            <div className="absolute top-0 inset-x-0 h-4 sm:h-5 bg-white/30 rounded-t-lg sm:rounded-t-xl pointer-events-none" />
            <Play className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-white mr-2 sm:mr-3 drop-shadow-[0_2px_0_#1f2937] group-hover:scale-125 transition-transform" />
            <span
              className="font-black text-white text-xl sm:text-3xl uppercase tracking-widest relative z-10"
              style={textStroke}
            >
              START GAME
            </span>
          </button>

          <button
            onClick={onCloseRoom}
            className="shrink-0 relative w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#ef4444] border-[3px] sm:border-4 border-[#991b1b] shadow-[0_4px_0_#991b1b] sm:shadow-[0_6px_0_#991b1b] active:shadow-[0_0px_0_#991b1b] active:translate-y-1 sm:active:translate-y-1.5 transition-all flex items-center justify-center overflow-hidden group"
          >
            <div className="absolute top-0 inset-x-0 h-3 sm:h-4 bg-white/30 rounded-t-lg sm:rounded-t-xl pointer-events-none" />
            <XOctagon className="w-5 h-5 sm:w-6 sm:h-6 text-white mr-2 drop-shadow-[0_2px_0_#1f2937] group-hover:scale-110 transition-transform" />
            <span
              className="font-black text-white text-lg sm:text-xl uppercase tracking-widest relative z-10"
              style={smTextStroke}
            >
              CLOSE ROOM
            </span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full max-w-sm">
          <div className="bg-[#f87171] border-4 border-[#991b1b] rounded-2xl px-4 sm:px-8 py-3 sm:py-4 shadow-[0_4px_0_#991b1b] sm:shadow-[0_6px_0_#991b1b] relative overflow-hidden flex items-center justify-center">
            <div className="absolute top-0 inset-x-0 h-3 sm:h-4 bg-white/30 rounded-t-xl pointer-events-none" />
            <span
              className="font-black text-white text-base sm:text-xl uppercase tracking-widest relative z-10 text-center"
              style={smTextStroke}
            >
              Waiting for Host...
            </span>
          </div>

          <button
            onClick={onLeaveRoom}
            className="shrink-0 relative w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl bg-[#ef4444] border-[3px] sm:border-4 border-[#991b1b] shadow-[0_4px_0_#991b1b] sm:shadow-[0_6px_0_#991b1b] active:shadow-[0_0px_0_#991b1b] active:translate-y-1 sm:active:translate-y-1.5 transition-all flex items-center justify-center overflow-hidden group"
          >
            <div className="absolute top-0 inset-x-0 h-3 sm:h-4 bg-white/30 rounded-t-lg sm:rounded-t-xl pointer-events-none" />
            <XOctagon className="w-5 h-5 sm:w-6 sm:h-6 text-white mr-2 drop-shadow-[0_2px_0_#1f2937] group-hover:scale-110 transition-transform" />
            <span
              className="font-black text-white text-lg sm:text-xl uppercase tracking-widest relative z-10"
              style={smTextStroke}
            >
              LEAVE ROOM
            </span>
          </button>
        </div>
      )}

      {isHost && !canStart && (
        <p className="text-gray-400 font-bold mt-4 uppercase text-sm">
          Need at least {minPlayers} players to start
        </p>
      )}
    </div>
  );
}
