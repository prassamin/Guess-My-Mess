function MatchCard({ match, onSelect }: { match: any; onSelect: () => void }) {
  const date = new Date(match.games.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });

  const isInProgress = match.games.status === "in_progress";
  const placeStr = isInProgress
    ? "..."
    : match.placement
      ? `#${match.placement}`
      : "-";

  let placeColor = "bg-[#f1f5f9] text-[#64748b] border-[#cbd5e1]";
  let shadowColor = "#94a3b8";

  if (isInProgress) {
    placeColor = "bg-[#f8fafc] text-[#94a3b8] border-[#e2e8f0]";
    shadowColor = "#cbd5e1";
  } else if (match.placement === 1) {
    placeColor =
      "bg-gradient-to-br from-[#fde68a] to-[#f59e0b] text-white border-[#b45309]";
    shadowColor = "#92400e";
  } else if (match.placement === 2) {
    placeColor =
      "bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8] text-white border-[#475569]";
    shadowColor = "#334155";
  } else if (match.placement === 3) {
    placeColor =
      "bg-gradient-to-br from-[#fed7aa] to-[#ea580c] text-white border-[#9a3412]";
    shadowColor = "#7c2d12";
  }

  return (
    <div
      onClick={onSelect}
      className="group bg-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-[#94a3b8] shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] flex items-center justify-between gap-3 sm:gap-4 transition-all cursor-pointer relative overflow-hidden hover:-translate-y-1 hover:shadow-[0_6px_0_#94a3b8] sm:hover:shadow-[0_8px_0_#94a3b8]"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#f87171] rounded-bl-full opacity-[0.03] pointer-events-none group-hover:scale-150 transition-transform duration-500"></div>

      <div className="flex items-center gap-4 z-10">
        <div
          className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl border-2 sm:border-4 flex items-center justify-center font-black text-xl sm:text-3xl shadow-[0_2px_0_${shadowColor}] sm:shadow-[0_4px_0_${shadowColor}] shrink-0 ${placeColor}`}
        >
          <span
            style={
              match.placement <= 3
                ? { WebkitTextStroke: `1.5px ${shadowColor}`, color: "white" }
                : {}
            }
          >
            {placeStr}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-[#94a3b8] font-bold text-xs uppercase tracking-widest mb-0.5 flex items-center gap-2">
            {date}
            {isInProgress && (
              <span className="bg-[#fbbf24] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md border-2 border-[#b45309] shadow-[0_2px_0_#b45309]">
                Active
              </span>
            )}
          </span>
          <p className="text-[#1f2937] font-black text-base sm:text-2xl uppercase tracking-wider flex items-center gap-1 sm:gap-2">
            <span className="text-sm sm:text-xl">🏠</span>{" "}
            {match.games.room_code}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end z-10">
        <span className="text-[#64748b] font-bold text-xs uppercase tracking-widest mb-1">
          Score
        </span>
        <div
          className="bg-[#60a5fa] px-3 py-1 sm:px-4 sm:py-1.5 rounded-xl border-2 sm:border-[3px] border-[#1d4ed8] shadow-[0_2px_0_#1d4ed8] sm:shadow-[0_4px_0_#1d4ed8] text-white font-black text-lg sm:text-2xl"
          style={{ WebkitTextStroke: "1px #1d4ed8" }}
        >
          {match.score}
        </div>
      </div>
    </div>
  );
}

export default MatchCard;
