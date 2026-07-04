"use client";

import { useState } from "react";
import { useRouter } from "@bprogress/next";
import { ChevronLeft, Users, Clock, Hash, RefreshCcw } from "lucide-react";
import SkyBackground from "@/components/SkyBackground";
import { getPublicRooms } from "@/actions/room";


export default function RoomsView({ initialRooms }: { initialRooms: any[] }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<any[]>(initialRooms);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRooms = async () => {
    setRefreshing(true);
    const { rooms } = await getPublicRooms();
    setRooms(rooms || []);
    setRefreshing(false);
  };


  return (
    <div className="min-h-screen w-full relative overflow-hidden bg-[#87CEEB] font-sans selection:bg-[#fbbf24] selection:text-[#78350f]">
      <SkyBackground />

      {/* Navigation Header */}
      <div className="absolute top-6 inset-x-6 z-20 flex justify-between items-center">
        <button
          onClick={() => router.push("/")}
          className="h-10 sm:h-14 px-4 sm:px-6 bg-white border-2 sm:border-[5px] border-[#94a3b8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-[#1f2937] font-black uppercase tracking-widest relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-white/40 pointer-events-none" />
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-1 -ml-1 sm:-ml-2 group-hover:-translate-x-1 transition-transform stroke-3" />
          Back
        </button>

        <button
          onClick={fetchRooms}
          className="h-10 w-10 sm:h-14 sm:w-14 bg-[#4ade80] border-2 sm:border-[5px] border-[#166534] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#166534] sm:shadow-[0_6px_0_#166534] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-white relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-white/30 pointer-events-none" />
          <RefreshCcw
            className={`w-5 h-5 sm:w-6 sm:h-6 stroke-3 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col pt-32 pb-12 items-center h-full overflow-y-auto custom-scrollbar px-4 sm:px-8">
        <h1
          className="text-5xl sm:text-7xl font-black text-white tracking-tighter uppercase mb-12 drop-shadow-[0_8px_0_#1f2937] text-center"
          style={{ WebkitTextStroke: "3px #1f2937" }}
        >
          Public Lobbies
        </h1>

        <div className="w-full max-w-4xl flex flex-col gap-5 pb-20">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white rounded-2xl sm:rounded-3xl border-2 sm:border-[5px] border-[#0f172a] shadow-[0_6px_0_#0f172a] sm:shadow-[0_10px_0_#0f172a] p-3 sm:p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 hover:-translate-y-1.5 hover:shadow-[0_8px_0_#0f172a] sm:hover:shadow-[0_16px_0_#0f172a] transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 inset-x-0 h-4 bg-slate-50/80 pointer-events-none" />

              {/* Left: Code & Status */}
              <div className="flex flex-row sm:flex-col items-center sm:items-start justify-between w-full sm:w-auto sm:min-w-35 gap-2">
                <div className="flex items-center gap-1.5">
                  <Hash className="w-6 h-6 text-[#94a3b8] stroke-3" />
                  <span className="font-black text-3xl sm:text-4xl text-[#1f2937] uppercase tracking-widest leading-none">
                    {room.id}
                  </span>
                </div>
                {room.status === "playing" ? (
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#ef4444] border-2 sm:border-[3px] border-[#991b1b] rounded-lg shadow-[0_2px_0_#991b1b] sm:shadow-[0_4px_0_#991b1b]">
                    <span className="font-black text-white text-[10px] sm:text-xs uppercase tracking-wider">
                      Playing
                    </span>
                  </div>
                ) : (
                  <div className="px-2 sm:px-3 py-0.5 sm:py-1 bg-[#4ade80] border-2 sm:border-[3px] border-[#166534] rounded-lg shadow-[0_2px_0_#166534] sm:shadow-[0_4px_0_#166534]">
                    <span className="font-black text-white text-[10px] sm:text-xs uppercase tracking-wider">
                      Waiting
                    </span>
                  </div>
                )}
              </div>

              {/* Middle: Stats & Avatars */}
              <div className="flex flex-1 w-full items-center justify-between sm:justify-end gap-6 border-y-4 sm:border-y-0 sm:border-l-4 border-dashed border-gray-200 py-4 sm:py-0 sm:pl-6">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-[#64748b] mb-0.5">
                      <Users className="w-5 h-5 stroke-3" />
                      <span className="font-black text-sm uppercase">
                        Players
                      </span>
                    </div>
                    <span className="font-black text-2xl text-[#1f2937] leading-none">
                      {room.playersCount}
                      <span className="text-gray-400">/{room.maxPlayers}</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1.5 text-[#64748b] mb-0.5">
                      <Clock className="w-5 h-5 stroke-3" />
                      <span className="font-black text-sm uppercase">
                        Rounds
                      </span>
                    </div>
                    <span className="font-black text-2xl text-[#1f2937] leading-none">
                      {room.settings?.rounds || 3}
                    </span>
                  </div>
                </div>

                {room.players && room.players.length > 0 ? (
                  <div className="-space-x-3 hidden sm:flex">
                    {room.players.slice(0, 4).map((p: any, i: number) => (
                      <div
                        key={i}
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 sm:border-[3px] border-[#94a3b8] bg-white shadow-sm overflow-hidden z-10 relative transform rotate-1 hover:rotate-0 transition-transform hover:z-20"
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#e2e8f0]" />
                        )}
                      </div>
                    ))}
                    {room.players.length > 4 && (
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 sm:border-[3px] border-[#94a3b8] bg-[#f1f5f9] flex items-center justify-center shadow-sm z-10 relative transform -rotate-2">
                        <span className="font-black text-[#475569] text-xs sm:text-base">
                          +{room.players.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hidden sm:block text-gray-400 font-bold uppercase text-sm italic">
                    Empty Room
                  </div>
                )}
              </div>

              {/* Right: Action */}
              <button
                onClick={() => router.push(`/room/${room.id}`)}
                className="w-full sm:w-40 h-12 sm:h-full min-h-12 sm:min-h-16 shrink-0 bg-[#60a5fa] border-2 sm:border-4 border-[#1d4ed8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-white relative overflow-hidden group/btn"
              >
                <div className="absolute top-0 inset-x-0 h-3 bg-white/30 rounded-t-xl pointer-events-none" />
                <span
                  className="font-black text-xl sm:text-2xl uppercase tracking-widest group-hover/btn:scale-110 transition-transform"
                  style={{ WebkitTextStroke: "1px #1f2937" }}
                >
                  Join
                </span>
              </button>
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="w-full text-center p-8 sm:p-12 bg-white/50 backdrop-blur-md rounded-2xl sm:rounded-[3rem] border-2 sm:border-4 border-dashed border-[#94a3b8] mt-8 flex flex-col items-center">
              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-200 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#94a3b8] shadow-inner mb-4 sm:mb-6 flex items-center justify-center transform -rotate-6">
                <Hash className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 stroke-3" />
              </div>
              <h2 className="text-4xl font-black text-[#1f2937] uppercase tracking-wider">
                No Public Lobbies
              </h2>
              <p className="text-[#475569] font-bold mt-3 text-xl max-w-md leading-relaxed">
                It&apos;s quiet right now. Create a new room and invite your friends
                to start drawing!
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 sm:mt-8 h-12 sm:h-16 px-6 sm:px-10 bg-[#fbbf24] border-2 sm:border-[5px] border-[#b45309] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#b45309] sm:shadow-[0_8px_0_#b45309] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-white relative overflow-hidden group hover:bg-[#f59e0b]"
              >
                <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-xl pointer-events-none" />
                <span
                  className="font-black text-xl sm:text-2xl uppercase tracking-widest"
                  style={{ WebkitTextStroke: "1px #1f2937" }}
                >
                  Create Room
                </span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1f2937;
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.2);
        }
      `,
        }}
      />
    </div>
  );
}
