import { motion } from "framer-motion";

const textStroke = {
  WebkitTextStroke: "1px #94a3b8",
  color: "white",
};

function MatchDetailsPopup({
  match,
  currentUsername,
  onClose,
}: {
  match: any;
  currentUsername: string;
  onClose: () => void;
}) {
  const date = new Date(match.games.created_at).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const isInProgress = match.games.status === "in_progress";
  const players =
    match.games.game_players?.sort(
      (a: any, b: any) => (b.score || 0) - (a.score || 0),
    ) || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-[#0f172a]/80 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className="bg-white w-full max-w-md rounded-3xl sm:rounded-[2.5rem] border-4 sm:border-[6px] border-[#94a3b8] shadow-[0_8px_0_#64748b] sm:shadow-[0_16px_0_#64748b] p-5 sm:p-8 relative flex flex-col max-h-[90vh]"
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-10 h-10 sm:w-12 sm:h-12 bg-[#f87171] border-2 sm:border-4 border-[#b91c1c] rounded-full flex items-center justify-center shadow-[0_4px_0_#991b1b] hover:-translate-y-1 hover:shadow-[0_6px_0_#991b1b] active:translate-y-1 active:shadow-none text-white transition-all z-10"
        >
          <svg
            className="w-6 h-6 stroke-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center mb-6">
          <div className="inline-block bg-[#f1f5f9] px-4 py-1.5 rounded-full border-2 border-[#cbd5e1] text-[#64748b] font-bold text-sm uppercase tracking-widest mb-4">
            {date}
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-[#334155] uppercase tracking-widest flex items-center justify-center gap-2 sm:gap-3">
            <span className="text-xl sm:text-3xl">🏠</span>{" "}
            {match.games.room_code}
          </h2>
          {isInProgress && (
            <div className="mt-3 inline-block bg-[#fbbf24] text-[#78350f] px-3 py-1 rounded-lg border-2 border-[#b45309] font-black uppercase text-sm tracking-wider animate-pulse">
              Match In Progress
            </div>
          )}
        </div>

        <div className="bg-[#f8fafc] rounded-3xl border-4 border-[#e2e8f0] p-4 sm:p-6 overflow-y-auto custom-scrollbar">
          <h3 className="text-[#94a3b8] font-black text-sm uppercase tracking-widest mb-4 text-center">
            Final Standings
          </h3>

          <div className="flex flex-col gap-3">
            {players.map((p: any, i: number) => {
              const pName = p.profiles?.name || p.guest_name || "Unknown";
              const pAvatar = p.profiles?.avatar || p.guest_avatar || "";
              const isMe = p.profiles?.username === currentUsername;

              let medal = "";
              let bgClass = "bg-white border-[#cbd5e1]";
              let shadowClass = "shadow-[0_4px_0_#e2e8f0]";

              if (i === 0) {
                medal = "🥇";
                bgClass =
                  "bg-gradient-to-r from-[#fef3c7] to-[#fde68a] border-[#d97706]";
                shadowClass = "shadow-[0_4px_0_#b45309]";
              } else if (i === 1) {
                medal = "🥈";
                bgClass =
                  "bg-gradient-to-r from-[#f8fafc] to-[#f1f5f9] border-[#94a3b8]";
                shadowClass = "shadow-[0_4px_0_#64748b]";
              } else if (i === 2) {
                medal = "🥉";
                bgClass =
                  "bg-gradient-to-r from-[#ffedd5] to-[#fed7aa] border-[#c2410c]";
                shadowClass = "shadow-[0_4px_0_#9a3412]";
              } else if (isMe) {
                bgClass = "bg-white border-[#3b82f6]";
                shadowClass = "shadow-[0_4px_0_#2563eb]";
              }

              return (
                <div
                  key={i}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 ${bgClass} ${shadowClass} relative`}
                >
                  {isMe && (
                    <div
                      className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#3b82f6] rounded-full border-2 border-[#1e3a8a] shadow-sm z-10"
                      title="You"
                    ></div>
                  )}

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-6 sm:w-8 flex justify-center font-black text-lg sm:text-xl">
                      {medal || (
                        <span className="text-[#94a3b8] text-sm">#{i + 1}</span>
                      )}
                    </div>
                    {pAvatar && (
                      <img
                        src={pAvatar}
                        alt={pName}
                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-[#94a3b8] bg-white shadow-sm"
                      />
                    )}
                    <span
                      className={`font-bold text-base sm:text-lg truncate max-w-25 sm:max-w-30 ${isMe ? "text-[#1e3a8a]" : "text-[#1f2937]"}`}
                    >
                      {pName}
                    </span>
                  </div>

                  <div
                    className="bg-[#94a3b8] text-white px-2 sm:px-3 py-1 rounded-xl font-black text-base sm:text-lg shadow-inner"
                    style={textStroke}
                  >
                    {p.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default MatchDetailsPopup;
