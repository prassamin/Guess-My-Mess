"use client";

import { useRouter } from "@bprogress/next";
import { motion } from "framer-motion";
import { User, ChevronLeft, Crown } from "lucide-react";
import SkyBackground from "@/components/SkyBackground";

function Av({ src, className }: { src?: string; className?: string }) {
  return (
    <div className={`bg-white overflow-hidden flex items-center justify-center shrink-0 ${className}`}>
      {src ? (
        <img src={src} className="w-full h-full object-cover" alt="" />
      ) : (
        <User className="w-2/5 h-2/5 text-slate-300" strokeWidth={2} />
      )}
    </div>
  );
}

const TOP3_CFG = [
  // Gold
  { rankColor: "text-amber-700",  ring: "ring-amber-400",  cardBg: "bg-gradient-to-r from-amber-300 to-yellow-200",  border: "border-amber-400",  nameTxt: "text-amber-900", scoreTxt: "text-amber-800", ptsTxt: "text-amber-600", delay: 0.2  },
  // Silver
  { rankColor: "text-slate-500",  ring: "ring-slate-300",  cardBg: "bg-gradient-to-r from-slate-300 to-slate-200",   border: "border-slate-300",  nameTxt: "text-slate-800", scoreTxt: "text-slate-700", ptsTxt: "text-slate-500", delay: 0.35 },
  // Bronze
  { rankColor: "text-orange-800", ring: "ring-orange-400", cardBg: "bg-gradient-to-r from-orange-400 to-amber-300",  border: "border-orange-400", nameTxt: "text-orange-950", scoreTxt: "text-orange-900", ptsTxt: "text-orange-700", delay: 0.5  },
];

export default function LeaderboardView({ players }: { players: any[] }) {
  const router = useRouter();
  const top3 = players.slice(0, 3);
  const rest = players.slice(3);
  const nav = (u: string) => router.push(`/profile/${u}`);

  return (
    <div className="fixed inset-0 w-full overflow-hidden bg-[#87CEEB] font-sans selection:bg-amber-300 selection:text-amber-900">
      <SkyBackground />

      {/* Back */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => router.push("/")}
          className="h-10 px-4 bg-white/80 backdrop-blur-sm border border-white rounded-xl shadow-sm active:scale-95 transition-all flex items-center gap-1.5 text-slate-700 font-black text-xs uppercase tracking-widest group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </div>

      <div
        className="absolute inset-0 z-10 flex flex-col items-center h-full overflow-y-auto pt-20 pb-12 px-4 sm:px-8"
        style={{ scrollbarWidth: "thin" }}
      >
        {/* ── Title ── */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
          className="text-center mb-10"
        >
          <Crown className="w-7 h-7 sm:w-9 sm:h-9 text-white/80 mx-auto mb-1 drop-shadow-sm" />
          <p className="text-white/70 font-black text-xs sm:text-sm uppercase tracking-[0.4em] mb-0.5">
            GLOBAL
          </p>
          <h1 className="text-5xl sm:text-7xl font-black text-white uppercase leading-none tracking-tight drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]">
            RANKING
          </h1>
          <div className="h-1 w-12 sm:w-16 bg-amber-400 rounded-full mx-auto mt-2" />
        </motion.div>

        {/* ── Top 3 — staggered horizontal cards ── */}
        {top3.length > 0 && (
          <div className="flex flex-col gap-2.5 w-full max-w-lg mb-8">
            {top3.map((p, pi) => {
              const c = TOP3_CFG[pi];
              return (
                <motion.div
                  key={p.username}
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: c.delay, type: "spring", bounce: 0.3 }}
                  onClick={() => p.username && nav(p.username)}
                  className={`w-full ${c.cardBg} border ${c.border} rounded-2xl flex items-center gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-3.5 cursor-pointer hover:-translate-y-0.5 hover:brightness-105 transition-all shadow-sm`}
                >
                  {/* Big rank number */}
                  <span className={`font-black ${c.rankColor} text-5xl sm:text-6xl leading-none w-10 sm:w-14 text-center shrink-0 tabular-nums`}>
                    {pi + 1}
                  </span>

                  {/* Avatar */}
                  <Av
                    src={p.avatar}
                    className={`${pi === 0 ? "w-14 h-14 sm:w-16 sm:h-16" : "w-11 h-11 sm:w-13 sm:h-13"} rounded-full ring-2 ${c.ring}`}
                  />

                  {/* Name & handle */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-black ${c.nameTxt} text-sm sm:text-base uppercase truncate leading-tight`}>
                      {p.name}
                    </p>
                    <p className={`${c.ptsTxt} text-[11px] sm:text-xs font-medium truncate opacity-70`}>
                      @{p.username}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`font-black ${c.scoreTxt} text-sm sm:text-lg tabular-nums leading-tight`}>
                      {p.total_score?.toLocaleString()}
                    </p>
                    <p className={`${c.ptsTxt} text-[10px] font-black uppercase tracking-widest`}>
                      pts
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Divider ── */}
        {rest.length > 0 && (
          <div className="flex items-center gap-3 w-full max-w-lg mb-4">
            <div className="flex-1 h-px bg-white/30" />
            <p className="text-white/60 font-black text-[10px] tracking-[0.35em] uppercase">
              The Rest
            </p>
            <div className="flex-1 h-px bg-white/30" />
          </div>
        )}

        {/* ── Rest of list ── */}
        <div className="w-full max-w-lg flex flex-col gap-2 pb-16">
          {rest.map((player, index) => (
            <motion.div
              key={player.username}
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.04 * Math.min(index, 10) }}
              onClick={() => player.username && nav(player.username)}
              className="bg-white/70 backdrop-blur-sm rounded-2xl p-3 sm:p-3.5 flex items-center gap-3 hover:-translate-y-0.5 hover:bg-white/90 transition-all cursor-pointer shadow-sm"
            >
              {/* Rank */}
              <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <span className="font-black text-slate-400 text-xs tabular-nums">
                  #{index + 4}
                </span>
              </div>

              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-white overflow-hidden flex items-center justify-center ring-2 ring-white/80 shrink-0">
                {player.avatar ? (
                  <img src={player.avatar} className="w-full h-full object-cover" alt="" />
                ) : (
                  <User className="w-5 h-5 text-slate-300" strokeWidth={2} />
                )}
              </div>

              {/* Name & handle */}
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-800 text-sm truncate leading-tight">
                  {player.name}
                </p>
                <p className="text-slate-400 text-[11px] font-medium truncate">
                  @{player.username}
                </p>
              </div>

              {/* Score */}
              <div className="text-right shrink-0">
                <p className="font-black text-slate-700 text-sm sm:text-base tabular-nums leading-tight">
                  {player.total_score?.toLocaleString()}
                </p>
                <p className="text-amber-400 text-[10px] font-black uppercase tracking-widest">
                  pts
                </p>
              </div>
            </motion.div>
          ))}

          {players.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center p-10 bg-white/50 backdrop-blur-sm rounded-3xl mt-4"
            >
              <Crown className="w-10 h-10 text-white/50 mx-auto mb-3" />
              <p className="font-black text-white text-lg uppercase tracking-widest">
                No players yet
              </p>
              <p className="text-white/60 font-medium text-sm mt-1">
                Be the first to claim the throne
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
