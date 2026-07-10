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
    <div className="min-h-screen w-full relative overflow-hidden bg-[#87CEEB] font-sans selection:bg-sky-200 selection:text-sky-900">
      <SkyBackground />

      {/* Navigation Header */}
      <div className="absolute top-6 inset-x-4 sm:inset-x-8 z-20 flex justify-between items-center max-w-5xl mx-auto w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)]">
        <button
          onClick={() => router.push("/")}
          className="h-12 sm:h-14 px-5 sm:px-6 bg-white/90 backdrop-blur-md border-2 border-white rounded-2xl shadow-lg active:translate-y-1 active:shadow-sm transition-all flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest group hover:bg-white"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 mr-1 -ml-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <button
          onClick={fetchRooms}
          className="h-12 w-12 sm:h-14 sm:w-14 bg-white/90 backdrop-blur-md border-2 border-white rounded-2xl shadow-lg active:translate-y-1 active:shadow-sm transition-all flex items-center justify-center text-sky-500 hover:text-sky-600 hover:bg-white group"
        >
          <RefreshCcw
            className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:rotate-180 duration-500 ${refreshing ? "animate-spin" : ""}`}
          />
        </button>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col pt-32 pb-12 items-center h-full overflow-y-auto custom-scrollbar px-4 sm:px-8">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-widest uppercase mb-10 drop-shadow-md text-center">
          Public Lobbies
        </h1>

        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-white/80 backdrop-blur-md rounded-4xl border-2 border-white shadow-[0_8px_30px_rgba(0,0,0,0.05)] p-6 flex flex-col gap-6 hover:-translate-y-2 hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] transition-all group"
            >
              {/* Top: Code & Status */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 text-slate-700">
                  <Hash className="w-5 h-5 sm:w-6 sm:h-6 text-slate-400" />
                  <span className="font-black text-2xl sm:text-3xl uppercase tracking-widest leading-none">
                    {room.id}
                  </span>
                </div>
                {room.status === "playing" ? (
                  <div className="px-3 py-1 bg-rose-100 border border-rose-200 rounded-lg shadow-sm">
                    <span className="font-bold text-rose-600 text-xs uppercase tracking-wider">
                      Playing
                    </span>
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-emerald-100 border border-emerald-200 rounded-lg shadow-sm">
                    <span className="font-bold text-emerald-600 text-xs uppercase tracking-wider">
                      Waiting
                    </span>
                  </div>
                )}
              </div>

              {/* Middle: Stats */}
              <div className="flex w-full items-center justify-between bg-slate-50/50 rounded-2xl p-4 border border-slate-100">
                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Players
                    </span>
                  </div>
                  <span className="font-black text-xl text-slate-700 leading-none">
                    {room.playersCount}
                    <span className="text-slate-400">/{room.maxPlayers}</span>
                  </span>
                </div>

                <div className="w-px h-10 bg-slate-200 mx-2" />

                <div className="flex flex-col items-center flex-1">
                  <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold text-xs uppercase tracking-wider">
                      Rounds
                    </span>
                  </div>
                  <span className="font-black text-xl text-slate-700 leading-none">
                    {room.settings?.rounds || 3}
                  </span>
                </div>
              </div>

              {/* Avatars */}
              <div className="flex justify-center h-12 w-full">
                {room.players && room.players.length > 0 ? (
                  <div className="-space-x-3 flex">
                    {room.players.slice(0, 5).map((p: any, i: number) => (
                      <div
                        key={i}
                        className="w-12 h-12 rounded-xl border-2 border-white bg-slate-100 shadow-sm overflow-hidden z-10 relative hover:-translate-y-1 transition-transform hover:z-20"
                      >
                        {p.avatar ? (
                          <img
                            src={p.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200" />
                        )}
                      </div>
                    ))}
                    {room.players.length > 5 && (
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-white/50 backdrop-blur-sm flex items-center justify-center shadow-sm z-10 relative">
                        <span className="font-black text-slate-500 text-sm">
                          +{room.players.length - 5}
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-slate-400 font-bold uppercase text-sm tracking-widest italic w-full h-full border-2 border-dashed border-slate-200 rounded-xl">
                    Empty Room
                  </div>
                )}
              </div>

              {/* Bottom: Action */}
              <button
                onClick={() => router.push(`/room/${room.id}`)}
                className="w-full h-14 mt-2 shrink-0 bg-linear-to-b from-sky-400 to-sky-500 border border-sky-300 rounded-2xl shadow-sm hover:shadow-lg active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-white relative overflow-hidden group/btn"
              >
                <div className="absolute top-0 inset-x-0 h-3 bg-white/20 rounded-t-xl pointer-events-none" />
                <span className="font-black text-lg uppercase tracking-widest drop-shadow-sm group-hover/btn:scale-105 transition-transform">
                  Join
                </span>
              </button>
            </div>
          ))}

          {rooms.length === 0 && (
            <div className="w-full text-center p-8 sm:p-12 bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-white mt-8 flex flex-col items-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)]">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-2xl sm:rounded-3xl shadow-sm mb-4 sm:mb-6 flex items-center justify-center transform -rotate-6">
                <Hash className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-widest">
                No Public Lobbies
              </h2>
              <p className="text-slate-500 font-bold mt-3 text-base sm:text-lg max-w-md leading-relaxed">
                It&apos;s quiet right now. Create a new room and invite your friends
                to start drawing!
              </p>
              <button
                onClick={() => router.push("/")}
                className="mt-6 sm:mt-8 h-12 sm:h-14 px-6 sm:px-8 bg-linear-to-b from-amber-400 to-amber-500 border border-amber-300 rounded-2xl shadow-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-white relative overflow-hidden hover:shadow-md"
              >
                <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                <span className="font-black text-lg sm:text-xl uppercase tracking-widest drop-shadow-sm">
                  Create Room
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
