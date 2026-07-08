import { MessageCircle, Send, UserX } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/app-store";
import { useRoomStore } from "@/store/room-store";

export default function ChatSidebar() {
  const { user } = useAppStore();
  const { chatMessages: messages, roomState, ws } = useRoomStore();
  const currentUserId = user?.id;

  const kickVotes = roomState?.kickVotes || {};
  const kickVotesNo = roomState?.kickVotesNo || {};
  const players = roomState?.players || [];

  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (text: string) => {
    if (ws && ws.connected) {
      ws.emit("message", { type: "chat", text });
    }
  };

  const handleVoteKick = (targetId: string) => {
    if (ws && ws.connected) {
      ws.emit("message", { type: "vote_kick", targetId });
    }
  };

  const handleVoteKickNo = (targetId: string) => {
    if (ws && ws.connected) {
      ws.emit("message", { type: "vote_kick_no", targetId });
    }
  };

  const smTextStroke = {
    textShadow:
      "-1.5px -1.5px 0 #1f2937, 1.5px -1.5px 0 #1f2937, -1.5px 1.5px 0 #1f2937, 1.5px 1.5px 0 #1f2937, 0 3px 0 #1f2937",
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, kickVotes]);

  const handleSend = () => {
    if (inputText.trim()) {
      handleSendMessage(inputText);
      setInputText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSend();
    }
  };

  return (
    <div className="bg-white border lg:border-4 border-[#1e3a8a] rounded-none lg:rounded-4xl flex flex-col overflow-hidden shadow-none lg:shadow-[0_10px_0_#1e3a8a] relative h-full max-h-full">
      {/* Header */}
      <div className="absolute top-0 inset-x-0 h-4 md:h-6 bg-white/20 rounded-t-4xl pointer-events-none z-20" />
      <div className="bg-[#ffb74d] border-b-2 md:border-b-4 border-[#f57c00] p-2 md:p-5 flex items-center justify-center space-x-1.5 sm:space-x-3 relative z-10 shrink-0">
        <div className="absolute top-0 left-0 right-0 h-1 sm:h-4 bg-white/40 pointer-events-none" />
        <MessageCircle
          className="w-3.5 h-3.5 sm:w-8 sm:h-8 text-white drop-shadow-[0_1px_0_#1f2937] sm:drop-shadow-[0_2px_0_#1f2937]"
          fill="#fff"
        />
        <h2
          className="font-black text-white text-sm md:text-2xl tracking-widest uppercase mt-0.5 sm:mt-1"
          style={smTextStroke}
        >
          Chat
        </h2>
      </div>

      <div className="flex-1 p-2 sm:p-4 overflow-y-auto space-y-3 bg-[#f1f5f9] min-h-0 relative z-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-[#cbd5e1] [&::-webkit-scrollbar-thumb]:rounded-full scrollbar-auto">
        {/* Subtle grid pattern for the chat background */}
        <div className="absolute inset-0 pointer-events-none opacity-50 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] bg-size-[20px_20px] z-[-1]" />

        {messages.map((msg, i) => {
          const isSystem = msg.userId === "system";

          if (isSystem) {
            const isCorrect = msg.isCorrectGuess;
            const isClose = msg.isCloseGuess;
            const isLeave =
              msg.text.includes("left") || msg.text.includes("kicked");

            let bgColor = "bg-[#ffb74d]"; // default orange for join
            let shadowColor = "shadow-[0_3px_0_#f57c00]";
            let borderColor = "border-[#f57c00]";

            if (isCorrect) {
              bgColor = "bg-[#4ade80]"; // green
              shadowColor = "shadow-[0_3px_0_#166534]";
              borderColor = "border-[#166534]";
            } else if (isClose) {
              bgColor = "bg-[#fbbf24]"; // yellow
              shadowColor = "shadow-[0_3px_0_#b45309]";
              borderColor = "border-[#b45309]";
            } else if (isLeave) {
              bgColor = "bg-[#f87171]"; // red
              shadowColor = "shadow-[0_3px_0_#991b1b]";
              borderColor = "border-[#991b1b]";
            }

            return (
              <div
                key={i}
                className="flex justify-center animate-in fade-in zoom-in duration-300 my-2"
              >
                <div
                  className={`${bgColor} ${shadowColor} text-[#1f2937] font-black px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs rounded-full border-2 sm:border-[3px] ${borderColor} inline-block relative overflow-hidden text-center uppercase tracking-widest`}
                >
                  <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 pointer-events-none" />
                  {msg.text}
                </div>
              </div>
            );
          }

          const isMe = msg.userId === currentUserId;
          return (
            <div
              key={i}
              className={`flex flex-col ${
                isMe ? "items-end" : "items-start"
              } animate-in fade-in slide-in-from-bottom-2 duration-200`}
            >
              <span className="text-[10px] sm:text-xs font-black text-gray-500 mb-0.5 mx-1 uppercase tracking-wider">
                {isMe ? "You" : msg.name}
              </span>
              <div
                className={`${
                  isMe
                    ? "bg-[#60a5fa] rounded-tr-none shadow-[0_3px_0_#1d4ed8]"
                    : "bg-white rounded-tl-none shadow-[0_3px_0_#94a3b8]"
                } ${
                  isMe ? "text-white" : "text-[#1f2937]"
                } font-black p-2 sm:p-3 text-xs sm:text-sm rounded-xl sm:rounded-2xl border-2 sm:border-[3px] ${
                  isMe ? "border-[#1d4ed8]" : "border-[#94a3b8]"
                } inline-block max-w-[85%] relative overflow-hidden wrap-break-word`}
              >
                <div className="absolute top-0 left-0 right-0 h-2 bg-white/40 pointer-events-none" />
                {msg.text}
              </div>
            </div>
          );
        })}

        {/* Active Polls */}
        {Object.entries(kickVotes).map(([targetId, voters]) => {
          if (!voters || (voters as string[])?.length === 0) return null;

          const targetPlayer = players.find((p: any) => p.id === targetId);
          if (!targetPlayer) return null;

          const noVoters = kickVotesNo[targetId] || [];

          const hasVoted = currentUserId
            ? (voters as string[])?.includes(currentUserId) ||
              noVoters.includes(currentUserId)
            : false;
          const votesNeeded = Math.ceil(players.length / 2);
          const isTarget = currentUserId === targetId;

          return (
            <div
              key={`poll-${targetId}`}
              className="bg-[#fbbf24] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-[3px] border-[#d97706] shadow-[0_4px_0_#d97706] my-4 animate-in slide-in-from-bottom-4 duration-300 relative overflow-hidden mx-1"
            >
              <div className="absolute top-0 left-0 right-0 h-2 sm:h-4 bg-white/30 pointer-events-none" />

              <div className="flex items-center justify-center space-x-2 mb-2 sm:mb-3 relative z-10">
                <UserX className="w-5 h-5 sm:w-6 sm:h-6 text-[#1f2937]" />
                <h4 className="font-black text-[#1f2937] text-xs sm:text-sm uppercase tracking-wider text-center">
                  Kick {targetPlayer.name}?
                </h4>
              </div>

              <div className="w-full flex space-x-1 h-3 sm:h-4 mb-2 sm:mb-3 relative z-10">
                {/* Yes bar */}
                <div className="bg-[#d97706]/10 rounded-l-full border-2 border-r-0 border-[#d97706] overflow-hidden flex-1 relative">
                  <div
                    className="bg-[#4ade80] h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        ((voters as string[])?.length / votesNeeded) * 100
                      )}%`,
                    }}
                  />
                </div>
                {/* No bar */}
                <div className="bg-[#d97706]/10 rounded-r-full border-2 border-l-0 border-[#d97706] overflow-hidden flex-1 relative flex justify-end">
                  <div
                    className="bg-[#f87171] h-full transition-all duration-500 ease-out"
                    style={{
                      width: `${Math.min(
                        100,
                        (noVoters.length / votesNeeded) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-between font-black text-[#1f2937] text-[10px] sm:text-xs mb-3 sm:mb-4 uppercase relative z-10 px-1">
                <span>
                  {(voters as string[])?.length}/{votesNeeded} Yes
                </span>
                <span>
                  {noVoters.length}/{votesNeeded} No
                </span>
              </div>

              <div className="relative z-10">
                {!hasVoted && !isTarget ? (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleVoteKick(targetId)}
                      className="flex-1 bg-[#4ade80] hover:bg-[#22c55e] border-2 sm:border-[3px] border-[#166534] rounded-lg sm:rounded-xl py-2 shadow-[0_3px_0_#166534] active:translate-y-0.75 active:shadow-none transition-all font-black text-white text-xs sm:text-sm uppercase"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => handleVoteKickNo(targetId)}
                      className="flex-1 bg-[#f87171] hover:bg-[#ef4444] border-2 sm:border-[3px] border-[#991b1b] rounded-lg sm:rounded-xl py-2 shadow-[0_3px_0_#991b1b] active:translate-y-0.75 active:shadow-none transition-all font-black text-white text-xs sm:text-sm uppercase"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-white/50 border-2 border-[#d97706] rounded-lg sm:rounded-xl py-2 text-center font-black text-[#1f2937] text-xs sm:text-sm uppercase">
                    {isTarget ? "You are being voted on!" : "Vote Cast"}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      <div className="p-2 sm:p-4 bg-[#e2e8f0] border-t-4 border-[#94a3b8] relative z-10 shrink-0 flex gap-2 sm:gap-3">
        <div className="absolute top-0 left-0 right-0 h-2 sm:h-3 bg-white/60 pointer-events-none z-20" />
        <input
          type="text"
          placeholder="TYPE GUESS!"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-0 bg-white text-[#1f2937] placeholder:text-gray-400 font-black text-xs sm:text-lg rounded-xl px-3 py-2 sm:px-4 sm:py-3 outline-none border-2 sm:border-[3px] border-[#94a3b8] shadow-inner relative z-10 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-12 sm:w-16 shrink-0 bg-[#60a5fa] border-2 sm:border-[3px] border-[#1d4ed8] rounded-xl flex items-center justify-center shadow-[0_4px_0_#1d4ed8] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed relative z-10 overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-2 bg-white/30 rounded-t-lg pointer-events-none" />
          <Send
            className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_2px_0_#1f2937] -ml-1"
            fill="#fff"
          />
        </button>
      </div>
    </div>
  );
}
