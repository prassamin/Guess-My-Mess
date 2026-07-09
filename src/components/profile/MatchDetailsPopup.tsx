import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useRef } from "react";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

function MatchDetailsPopup({
  match,
  currentUsername,
  onClose,
}: {
  match: any;
  currentUsername: string;
  onClose: () => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(modalRef as any, onClose);

  const date = new Date(match.games.created_at).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const isInProgress = match.games.status === "in_progress";
  const players =
    match.games.game_players?.sort(
      (a: any, b: any) => (b.score || 0) - (a.score || 0)
    ) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="bg-white/95 backdrop-blur-xl w-full max-w-md rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] p-6 sm:p-8 relative flex flex-col max-h-[90dvh]"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:scale-105 hover:text-red-500 hover:border-red-200 active:scale-95 text-slate-400 transition-all z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
        </button>

        <div className="text-center mb-6">
          <div className="inline-block bg-slate-100 px-4 py-1.5 rounded-full border border-slate-200 text-slate-500 font-bold text-sm uppercase tracking-widest mb-4">
            {date}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-2xl">🏠</span>{" "}
            {match.games.room_code}
          </h2>
          {isInProgress && (
            <div className="mt-3 inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-lg border border-amber-200 font-black uppercase text-sm tracking-wider animate-pulse">
              Match In Progress
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-4xl border border-slate-100 p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-slate-400 font-black text-xs sm:text-sm uppercase tracking-widest mb-4 text-center">
            Final Standings
          </h3>

          <div className="flex flex-col gap-3">
            {[...players, ...players, ...players, ...players, ...players].map(
              (p: any, i: number) => {
                const pName = p.profiles?.name || p.guest_name || "Unknown";
                const pAvatar = p.profiles?.avatar || p.guest_avatar || "";
                const isMe = p.profiles?.username === currentUsername;

                let medal = "";
                let bgClass = "bg-white border-slate-200 shadow-sm";

                if (i === 0) {
                  medal = "🥇";
                  bgClass =
                    "bg-linear-to-r from-amber-50 to-amber-100 border-amber-200 shadow-sm";
                } else if (i === 1) {
                  medal = "🥈";
                  bgClass =
                    "bg-linear-to-r from-slate-50 to-slate-100 border-slate-200 shadow-sm";
                } else if (i === 2) {
                  medal = "🥉";
                  bgClass =
                    "bg-linear-to-r from-orange-50 to-orange-100 border-orange-200 shadow-sm";
                } else if (isMe) {
                  bgClass = "bg-white border-sky-200 shadow-sm";
                }

                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-3 rounded-2xl border ${bgClass} relative`}
                  >
                    {isMe && (
                      <div
                        className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-sky-400 rounded-full shadow-sm z-10"
                        title="You"
                      ></div>
                    )}

                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-6 sm:w-8 flex justify-center font-black text-lg sm:text-xl">
                        {medal || (
                          <span className="text-slate-400 text-sm">
                            #{i + 1}
                          </span>
                        )}
                      </div>
                      {pAvatar && (
                        <img
                          src={pAvatar}
                          alt={pName}
                          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 bg-white object-cover"
                        />
                      )}
                      <span
                        className={`font-bold text-sm sm:text-base truncate max-w-[120px] sm:max-w-[160px] ${
                          isMe ? "text-sky-600" : "text-slate-700"
                        }`}
                      >
                        {pName}
                      </span>
                    </div>

                    <div className="bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-xl font-black text-base sm:text-lg shadow-sm">
                      {p.score}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MatchDetailsPopup;
