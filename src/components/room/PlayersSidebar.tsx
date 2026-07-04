import { useState } from "react";
import { Users, Crown, Paintbrush, UserX, MicOff, Mic } from "lucide-react";
import { useRoomStore } from "@/store/roomStore";

export default function PlayersSidebar() {
  const { user, roomState, mutedUserIds, setMutedUserIds, ws } = useRoomStore();
  const currentUserId = user?.id;
  const players = roomState?.players || [];
  const hostId = roomState?.hostId;
  const drawerId = (roomState?.gameState?.phase === 'drawing' || roomState?.gameState?.phase === 'choosing') ? roomState?.players[roomState.gameState.currentTurnIndex]?.id : undefined;
  const serverMutedUsers = roomState?.serverMutedUsers || [];

  const handleKick = (targetId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "kick", targetId }));
    }
  };

  const handleVoteKick = (targetId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "vote_kick", targetId }));
    }
  };

  const handleServerToggleMute = (targetId: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "server_toggle_mute", targetId }));
    }
  };

  const handleToggleMute = (targetId: string) => {
    setMutedUserIds((prev: string[]) => 
      prev.includes(targetId) ? prev.filter((id: string) => id !== targetId) : [...prev, targetId]
    );
  };

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const smTextStroke = {
    textShadow:
      "-1.5px -1.5px 0 #1f2937, 1.5px -1.5px 0 #1f2937, -1.5px 1.5px 0 #1f2937, 1.5px 1.5px 0 #1f2937, 0 3px 0 #1f2937",
  };

  return (
    <div className="bg-white border lg:border-4 border-[#1e3a8a] rounded-none lg:rounded-4xl p-2 sm:p-5 flex flex-col shadow-none lg:shadow-[0_10px_0_#1e3a8a] relative h-full max-h-full min-h-70 sm:min-h-0">
      <div className="absolute inset-x-2 top-2 h-4 sm:h-6 bg-linear-to-b from-blue-50/80 to-transparent rounded-t-3xl pointer-events-none" />

      <div className="flex items-center justify-center space-x-1.5 sm:space-x-2 mb-2 sm:mb-6 bg-[#60a5fa] p-2 md:p-3 rounded-lg sm:rounded-2xl border-2 sm:border-[3px] border-[#1d4ed8] shadow-[0_1px_0_#1d4ed8] sm:shadow-[0_4px_0_#1d4ed8] relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-4 bg-white/30 rounded-t-md sm:rounded-t-xl pointer-events-none" />
        <Users
          className="w-3.5 h-3.5 md:w-8 md:h-8 text-white drop-shadow-[0_1px_0_#1f2937] sm:drop-shadow-[0_2px_0_#1f2937]"
          fill="#fff"
        />
        <h2
          className="font-black text-white text-sm md:text-2xl tracking-widest uppercase mt-0.5 sm:mt-1"
          style={smTextStroke}
        >
          Players
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 sm:space-y-4 pr-1 sm:pr-2 min-h-0 relative z-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-thumb]:rounded-full">
        {players.map((player: any) => (
          <div key={player.id} className="relative">
            <div
              onClick={() => {
                if (player.id !== currentUserId) {
                  setMenuOpenId(menuOpenId === player.id ? null : player.id);
                }
              }}
              className={`bg-[#e2e8f0] p-2 sm:p-3 rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#94a3b8] shadow-[0_2px_0_#94a3b8] sm:shadow-[0_4px_0_#94a3b8] flex items-center space-x-2 sm:space-x-3 relative overflow-hidden ${
                player.id !== currentUserId
                  ? "cursor-pointer hover:bg-[#cbd5e1] active:translate-y-0.5 active:shadow-none transition-all"
                  : ""
              }`}
            >
              <div className="absolute top-0 left-0 right-0 h-2 sm:h-4 bg-white/60 pointer-events-none rounded-t-lg sm:rounded-t-xl" />
              <div className="relative z-10 shrink-0">
                <img
                  alt={player.name}
                  src={
                    player.avatar ||
                    "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
                  }
                  className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl border-2 sm:border-[3px] border-[#94a3b8] bg-white"
                />
                <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 bg-[#4ade80] w-4 h-4 sm:w-6 sm:h-6 rounded-full border-2 sm:border-[3px] border-[#166534] shadow-[0_1px_0_#166534] sm:shadow-[0_2px_0_#166534]"></div>
              </div>
              <div className="flex flex-col relative z-10 flex-1 min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-black text-[#1f2937] text-sm sm:text-xl uppercase truncate">
                    {player.id === currentUserId
                      ? `${player.name} (You)`
                      : player.name}
                  </span>
                  <div className="flex items-center space-x-1 shrink-0">
                    {player.id === hostId && (
                      <div className="bg-[#fbbf24] p-0.5 sm:p-1 rounded-md border-2 border-[#d97706] shadow-[0_2px_0_#d97706]">
                        <Crown
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-[0_1px_0_#1f2937]"
                          fill="#fff"
                        />
                      </div>
                    )}
                    {player.id === drawerId && (
                      <div className="bg-[#f87171] p-0.5 sm:p-1 rounded-md border-2 border-[#991b1b] shadow-[0_2px_0_#991b1b]">
                        <Paintbrush
                          className="w-3 h-3 sm:w-4 sm:h-4 text-white drop-shadow-[0_1px_0_#1f2937]"
                          fill="#fff"
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-[#1f2937] rounded-full px-2 py-0.5 sm:px-3 sm:py-1 inline-block mt-0.5 sm:mt-1 w-max">
                  <span className="text-[10px] sm:text-xs font-black text-[#ffb74d]">
                    {player.score || 0} PTS
                  </span>
                </div>
              </div>

              {player.id !== currentUserId &&
                mutedUserIds.includes(player.id) && (
                  <div className="ml-auto bg-[#e2e8f0] p-1 rounded-md border-2 border-[#94a3b8] shadow-[0_2px_0_#94a3b8] shrink-0">
                    <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-[#1f2937]" />
                  </div>
                )}

              {serverMutedUsers.includes(player.id) && (
                <div
                  className={`ml-auto bg-[#ef4444] p-1 rounded-md border-2 border-[#991b1b] shadow-[0_2px_0_#991b1b] shrink-0 ${player.id !== currentUserId && mutedUserIds.includes(player.id) ? "ml-2" : ""}`}
                >
                  <MicOff className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Player Popover Modal */}
      {menuOpenId && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[#1f2937]/60 backdrop-blur-sm"
            onClick={() => setMenuOpenId(null)}
          />
          <div className="bg-white w-full max-w-sm rounded-3xl border-4 border-[#0f172a] p-6 shadow-[0_12px_0_#0f172a] relative z-10 transform transition-all flex flex-col items-center">
            {(() => {
              const player = players.find((p: any) => p.id === menuOpenId);
              if (!player) return null;
              return (
                <>
                  <button
                    onClick={() => setMenuOpenId(null)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-[#1f2937] transition-colors"
                  >
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>

                  <img
                    alt={player.name}
                    src={
                      player.avatar ||
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
                    }
                    className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-4 border-[#94a3b8] mb-4 bg-slate-100"
                  />

                  <h3 className="font-black text-[#1f2937] text-2xl sm:text-3xl uppercase text-center mb-6 truncate w-full">
                    {player.name}
                  </h3>

                  <div className="flex flex-col w-full space-y-3 sm:space-y-4">
                    {currentUserId === hostId ? (
                      <>
                        <button
                          onClick={() => {
                            handleKick(player.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full h-14 sm:h-16 rounded-2xl bg-[#f87171] border-4 border-[#991b1b] shadow-[0_4px_0_#991b1b] active:translate-y-1 active:shadow-none flex items-center justify-center space-x-2 text-white transition-all"
                        >
                          <UserX className="w-6 h-6 sm:w-7 sm:h-7" />
                          <span className="font-black text-lg sm:text-xl uppercase">
                            Kick Player
                          </span>
                        </button>

                        <button
                          onClick={() => {
                            handleServerToggleMute(player.id);
                            setMenuOpenId(null);
                          }}
                          className="w-full h-14 sm:h-16 rounded-2xl bg-[#f43f5e] border-4 border-[#9f1239] shadow-[0_4px_0_#9f1239] active:translate-y-1 active:shadow-none flex items-center justify-center space-x-2 text-white transition-all"
                        >
                          {serverMutedUsers.includes(player.id) ? (
                            <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                          ) : (
                            <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                          )}
                          <span className="font-black text-lg sm:text-xl uppercase">
                            {serverMutedUsers.includes(player.id)
                              ? "Global Unmute"
                              : "Global Mute"}
                          </span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          handleVoteKick(player.id);
                          setMenuOpenId(null);
                        }}
                        className="w-full h-14 sm:h-16 rounded-2xl bg-[#fbbf24] border-4 border-[#d97706] shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none flex items-center justify-center space-x-2 text-[#78350f] transition-all"
                      >
                        <UserX className="w-6 h-6 sm:w-7 sm:h-7" />
                        <span className="font-black text-lg sm:text-xl uppercase">
                          Vote Kick
                        </span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        handleToggleMute(player.id);
                        setMenuOpenId(null);
                      }}
                      className="w-full h-14 sm:h-16 rounded-2xl bg-[#e2e8f0] border-4 border-[#94a3b8] shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none flex items-center justify-center space-x-2 text-[#334155] transition-all"
                    >
                      {mutedUserIds.includes(player.id) ? (
                        <Mic className="w-6 h-6 sm:w-7 sm:h-7" />
                      ) : (
                        <MicOff className="w-6 h-6 sm:w-7 sm:h-7" />
                      )}
                      <span className="font-black text-lg sm:text-xl uppercase">
                        {mutedUserIds.includes(player.id)
                          ? "Local Unmute"
                          : "Local Mute"}
                      </span>
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
