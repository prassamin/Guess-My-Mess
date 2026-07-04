"use client";

import { useRouter } from "@bprogress/next";
import { motion } from "framer-motion";
import { User, ChevronLeft } from "lucide-react";
import SkyBackground from "@/components/SkyBackground";

const textStroke = {
  WebkitTextStroke: "1.5px #1f2937",
  color: "white",
};

export default function LeaderboardView({ players }: { players: any[] }) {
  const router = useRouter();

  const top3 = players.slice(0, 3);
  const rest = players.slice(3);

  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-[#87CEEB] font-sans selection:bg-[#fbbf24] selection:text-[#78350f]">
      <SkyBackground />

      {/* Navigation Header */}
      <div className="absolute top-6 left-6 z-20">
        <button
          onClick={() => router.push("/")}
          className="h-10 sm:h-14 px-4 sm:px-6 bg-white border-2 sm:border-[5px] border-[#94a3b8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-[#1f2937] font-black uppercase tracking-widest relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-white/40 pointer-events-none" />
          <ChevronLeft className="w-6 h-6 mr-1 -ml-2 group-hover:-translate-x-1 transition-transform stroke-3" />
          Back
        </button>
      </div>

      <div className="absolute inset-0 z-10 flex flex-col pt-24 pb-8 items-center h-full overflow-y-auto custom-scrollbar px-4 sm:px-8">
        {/* Title */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="mb-12 text-center"
        >
          <h1
            className="text-6xl sm:text-7xl font-black text-[#fbbf24] tracking-tighter uppercase mb-2 drop-shadow-[0_4px_0_#b45309] sm:drop-shadow-[0_8px_0_#b45309] -rotate-2"
            style={{
              WebkitTextStroke: "3px #b45309",
            }}
          >
            GLOBAL RANKING
          </h1>
          <p
            className="text-white text-xl sm:text-2xl font-black uppercase tracking-widest"
            style={textStroke}
          >
            The Hall of Legends
          </p>
        </motion.div>

        {/* Podium */}
        <div className="flex flex-row items-end justify-center gap-2 sm:gap-8 w-full max-w-4xl mb-16 h-52 sm:h-80 px-2 sm:px-4">
          {/* 2nd Place */}
          {top3[1] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring", bounce: 0.4 }}
              className="w-1/3 flex flex-col items-center group cursor-pointer"
              onClick={() =>
                top3[1].username && router.push(`/profile/${top3[1].username}`)
              }
            >
              <div className="relative -mb-4 sm:-mb-6 z-10 group-hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-2 sm:border-[6px] border-[#94a3b8] bg-white shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] overflow-hidden flex items-center justify-center">
                  {top3[1].avatar ? (
                    <img
                      src={top3[1].avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <User
                      className="w-6 h-6 sm:w-10 sm:h-10 text-[#94a3b8]"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-6 h-6 sm:w-12 sm:h-12 bg-[#cbd5e1] border-2 sm:border-4 border-[#94a3b8] rounded-full flex items-center justify-center shadow-[0_3px_0_#94a3b8] sm:shadow-[0_4px_0_#94a3b8] z-20">
                  <span
                    className="font-black text-white text-sm sm:text-xl"
                    style={{ WebkitTextStroke: "1px #94a3b8" }}
                  >
                    2
                  </span>
                </div>
              </div>
              <div className="w-full h-24 sm:h-40 bg-[#e2e8f0] border-2 sm:border-[6px] border-[#94a3b8] rounded-t-2xl sm:rounded-t-3xl shadow-[0_8px_0_#94a3b8] sm:shadow-[0_12px_0_#94a3b8] relative overflow-hidden flex flex-col items-center pt-6 sm:pt-10 justify-between">
                <div className="absolute top-0 inset-x-0 h-4 bg-white/40 pointer-events-none" />
                <span
                  className="font-black text-white text-xs sm:text-2xl uppercase text-center px-1 sm:px-4 truncate w-full"
                  style={{ WebkitTextStroke: "1px #94a3b8" }}
                >
                  {top3[1].name || "Unknown"}
                </span>

                <span className="font-black text-[#94a3b8] text-[10px] sm:text-sm tracking-widest mb-1.5 px-1">
                  {top3[1].total_score}
                </span>
              </div>
            </motion.div>
          )}

          {/* 1st Place */}
          {top3[0] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", bounce: 0.4 }}
              className="w-1/3 flex flex-col items-center z-20 group cursor-pointer"
              onClick={() =>
                top3[0].username && router.push(`/profile/${top3[0].username}`)
              }
            >
              <div className="relative -mb-5 sm:-mb-8 z-10 group-hover:-translate-y-3 transition-transform">
                <div className="w-16 h-16 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl border-2 sm:border-[6px] border-[#b45309] bg-white shadow-[0_4px_0_#b45309] sm:shadow-[0_8px_0_#b45309] overflow-hidden flex items-center justify-center">
                  {top3[0].avatar ? (
                    <img
                      src={top3[0].avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <User
                      className="w-8 h-8 sm:w-14 sm:h-14 text-[#94a3b8]"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-4 sm:-right-4 w-8 h-8 sm:w-14 sm:h-14 bg-[#fbbf24] border-2 sm:border-[5px] border-[#b45309] rounded-full flex items-center justify-center shadow-[0_3px_0_#b45309] sm:shadow-[0_4px_0_#b45309] z-20">
                  <span
                    className="font-black text-white text-base sm:text-2xl"
                    style={{ WebkitTextStroke: "1.5px #b45309" }}
                  >
                    1
                  </span>
                </div>
              </div>
              <div className="w-full h-32 sm:h-52 bg-[#fbbf24] border-2 sm:border-[6px] border-[#b45309] rounded-t-2xl sm:rounded-t-3xl shadow-[0_8px_0_#b45309] sm:shadow-[0_12px_0_#b45309] relative overflow-hidden flex flex-col items-center pt-8 sm:pt-14 justify-between">
                <div className="absolute top-0 inset-x-0 h-5 bg-white/40 pointer-events-none" />
                <span
                  className="font-black text-white text-sm sm:text-3xl uppercase text-center px-1 sm:px-4 truncate w-full"
                  style={{ WebkitTextStroke: "1px #b45309" }}
                >
                  {top3[0].name || "Unknown"}
                </span>
                <span className="font-black text-[#b45309] text-[10px] sm:text-lg tracking-widest mb-1.5">
                  {top3[0].total_score}
                </span>
              </div>
            </motion.div>
          )}

          {/* 3rd Place */}
          {top3[2] && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", bounce: 0.4 }}
              className="w-1/3 flex flex-col items-center group cursor-pointer"
              onClick={() =>
                top3[2].username && router.push(`/profile/${top3[2].username}`)
              }
            >
              <div className="relative -mb-4 sm:-mb-6 z-10 group-hover:-translate-y-2 transition-transform">
                <div className="w-14 h-14 sm:w-28 sm:h-28 rounded-2xl sm:rounded-3xl border-2 sm:border-[6px] border-[#c2410c] bg-white shadow-[0_4px_0_#c2410c] sm:shadow-[0_6px_0_#c2410c] overflow-hidden flex items-center justify-center">
                  {top3[2].avatar ? (
                    <img
                      src={top3[2].avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <User
                      className="w-6 h-6 sm:w-10 sm:h-10 text-[#94a3b8]"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 w-6 h-6 sm:w-12 sm:h-12 bg-[#fdba74] border-2 sm:border-4 border-[#c2410c] rounded-full flex items-center justify-center shadow-[0_3px_0_#c2410c] sm:shadow-[0_4px_0_#c2410c] z-20">
                  <span
                    className="font-black text-white text-sm sm:text-xl"
                    style={{ WebkitTextStroke: "1px #c2410c" }}
                  >
                    3
                  </span>
                </div>
              </div>
              <div className="w-full h-20 sm:h-36 bg-[#ffedd5] border-2 sm:border-[6px] border-[#c2410c] rounded-t-2xl sm:rounded-t-3xl shadow-[0_8px_0_#c2410c] sm:shadow-[0_12px_0_#c2410c] relative overflow-hidden flex flex-col items-center pt-6 sm:pt-10 justify-between">
                <div className="absolute top-0 inset-x-0 h-4 bg-white/40 pointer-events-none" />
                <span
                  className="font-black text-white text-[10px] sm:text-xl uppercase text-center px-1 sm:px-4 truncate w-full"
                  style={{ WebkitTextStroke: "1px #c2410c" }}
                >
                  {top3[2].name || "Unknown"}
                </span>
                <span className="font-black text-[#c2410c] text-[9px] sm:text-sm tracking-widest leading-tight mb-1.5">
                  {top3[2].total_score}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* The Rest of the List */}
        <div className="w-full max-w-4xl flex flex-col gap-4 pb-20">
          {rest.map((player, index) => (
            <motion.div
              key={player.username}
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 * Math.min(index, 10) }}
              onClick={() =>
                player.username && router.push(`/profile/${player.username}`)
              }
              className="bg-white rounded-2xl sm:rounded-4xl border-2 sm:border-[6px] border-[#94a3b8] shadow-[0_4px_0_#94a3b8] sm:shadow-[0_8px_0_#94a3b8] p-3 sm:p-5 flex items-center gap-3 sm:gap-4 hover:-translate-y-1 hover:shadow-[0_6px_0_#94a3b8] sm:hover:shadow-[0_12px_0_#94a3b8] transition-all cursor-pointer relative overflow-hidden group"
            >
              {/* Avatar & Rank */}
              <div className="relative shrink-0 mr-1 sm:mr-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] bg-[#f8fafc] overflow-hidden shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                  {player.avatar ? (
                    <img
                      src={player.avatar}
                      className="w-full h-full object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <User
                      className="w-6 h-6 sm:w-8 sm:h-8 text-[#94a3b8]"
                      strokeWidth={3}
                    />
                  )}
                </div>
                <div className="absolute -top-2 -left-2 sm:-top-3 sm:-left-3 w-6 h-6 sm:w-8 sm:h-8 bg-[#e2e8f0] border-2 sm:border-[3px] border-[#94a3b8] rounded-full flex items-center justify-center shadow-sm z-10">
                  <span className="font-black text-[#1f2937] text-[10px] sm:text-sm">
                    #{index + 4}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-black text-[#1f2937] text-base sm:text-2xl uppercase truncate leading-tight">
                  {player.name}
                </h3>
                <p className="font-bold text-[#64748b] text-[10px] sm:text-sm tracking-wider truncate">
                  @{player.username}
                </p>
              </div>

              {/* Score */}
              <div className="shrink-0 flex items-end">
                <span className="font-black text-[#94a3b8] text-xl sm:text-3xl leading-none">
                  {player.total_score}
                </span>
                <span className="font-black text-[#cbd5e1] text-[10px] sm:text-sm uppercase tracking-widest ml-1 mb-0.5 sm:mb-1">
                  PTS
                </span>
              </div>
            </motion.div>
          ))}

          {players.length === 0 && (
            <div className="text-center p-8 sm:p-12 bg-white/50 backdrop-blur-md rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-dashed border-[#94a3b8] mt-8 mx-4">
              <h2 className="text-xl sm:text-2xl font-black text-[#1f2937] uppercase">
                No one has played yet!
              </h2>
              <p className="text-[#334155] font-bold mt-2 text-sm sm:text-base">
                Be the first to claim the top spot!
              </p>
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
