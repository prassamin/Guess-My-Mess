"use client";

import { useRoomStore } from "@/store/room-store";

export default function PlayerList() {
  const { roomState } = useRoomStore();
  const players = roomState?.players || [];
  const maxPlayers = roomState?.settings?.maxPlayers || 8;

  return (
    <div className="w-full lg:w-64 bg-white rounded-2xl border-4 border-[#94a3b8] flex flex-col shadow-[0_8px_0_#94a3b8] shrink-0 overflow-hidden transition-all">
      <div className="bg-[#e2e8f0] p-3 border-b-4 border-[#94a3b8]">
        <h2 className="font-black text-[#1f2937] text-lg uppercase tracking-wider text-center drop-shadow-sm">
          Players ({players.length}/{maxPlayers})
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {players.map((player: any) => (
          <div key={player.id} className="flex items-center gap-3 bg-[#f8fafc] p-2.5 rounded-xl border-2 border-[#cbd5e1] hover:border-[#94a3b8] transition-colors">
            <img src={player.avatar} alt={player.name} className="w-10 h-10 rounded-full bg-blue-200 border-2 border-[#94a3b8] shadow-sm shrink-0 object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#1f2937] truncate leading-tight">{player.name}</p>
              <p className="text-xs font-bold text-[#64748b] leading-tight mt-0.5">{player.score || 0} pts</p>
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <p className="text-center font-bold text-[#94a3b8] mt-4">Connecting...</p>
        )}
      </div>
    </div>
  );
}
