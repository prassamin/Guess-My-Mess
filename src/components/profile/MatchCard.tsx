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

  let placeColor = "bg-white text-slate-500 border-slate-200 shadow-sm";

  if (isInProgress) {
    placeColor = "bg-slate-50 text-slate-400 border-slate-100";
  } else if (match.placement === 1) {
    placeColor =
      "bg-linear-to-br from-amber-200 to-amber-400 text-amber-900 border-amber-400 shadow-sm";
  } else if (match.placement === 2) {
    placeColor =
      "bg-linear-to-br from-slate-100 to-slate-300 text-slate-700 border-slate-300 shadow-sm";
  } else if (match.placement === 3) {
    placeColor =
      "bg-linear-to-br from-orange-200 to-orange-400 text-orange-900 border-orange-400 shadow-sm";
  }

  return (
    <div
      onClick={onSelect}
      className="group bg-white/60 border-2 border-white backdrop-blur-sm p-4 rounded-3xl flex items-center justify-between gap-4 transition-all cursor-pointer relative overflow-hidden hover:bg-white hover:border-sky-100 hover:shadow-[0_8px_30px_rgba(14,165,233,0.1)] hover:-translate-y-1"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400 rounded-bl-full opacity-[0.02] pointer-events-none group-hover:scale-150 group-hover:opacity-[0.05] transition-all duration-500"></div>

      <div className="flex items-center gap-4 z-10">
        <div
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl border-2 flex items-center justify-center font-black text-xl sm:text-2xl shrink-0 ${placeColor}`}
        >
          <span>{placeStr}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
            {date}
            {isInProgress && (
              <span className="bg-amber-100 text-amber-700 text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border border-amber-200">
                Active
              </span>
            )}
          </span>
          <p className="text-slate-700 font-black text-base sm:text-lg uppercase tracking-wider flex items-center gap-2">
            {match.games.room_code}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-end z-10">
        <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1">
          Score
        </span>
        <div className="bg-white/80 backdrop-blur-sm px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl border border-white shadow-sm text-slate-700 font-black text-lg sm:text-xl group-hover:border-sky-200 group-hover:text-sky-600 transition-colors">
          {match.score}
        </div>
      </div>
    </div>
  );
}

export default MatchCard;
