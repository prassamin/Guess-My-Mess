"use client";

import { useRoomStore } from "@/store/room-store";
import { useState, useRef, useEffect } from "react";

export default function ChatBox() {
  const { chatMessages, ws } = useRoomStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim() && ws?.connected) {
      ws.emit("message", { type: "chat", text: input });
      setInput("");
    }
  };

  return (
    <div className="w-full lg:w-80 bg-white rounded-2xl border-4 border-[#94a3b8] flex flex-col shadow-[0_8px_0_#94a3b8] shrink-0 overflow-hidden transition-all">
      <div className="bg-[#e2e8f0] p-3 border-b-4 border-[#94a3b8]">
        <h2 className="font-black text-[#1f2937] text-lg uppercase tracking-wider text-center drop-shadow-sm">
          Chat
        </h2>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-2.5 custom-scrollbar bg-[#f8fafc]"
      >
        {chatMessages.map((msg, idx) =>
          msg.userId === "system" ? (
            <div
              key={idx}
              className="bg-green-100 border-2 border-green-300 p-2 rounded-xl shadow-sm"
            >
              <p className="text-sm font-bold text-green-800 text-center">
                {msg.text}
              </p>
            </div>
          ) : (
            <div
              key={idx}
              className="bg-white border-2 border-[#e2e8f0] p-2.5 rounded-xl shadow-sm"
            >
              <p className="text-sm">
                <span className="font-black text-[#1f2937] mr-2">
                  {msg.name}:
                </span>
                <span className="font-medium text-[#475569] wrap-break-word">
                  {msg.text}
                </span>
              </p>
            </div>
          )
        )}
      </div>

      <div className="p-3 border-t-4 border-[#94a3b8] bg-[#e2e8f0] shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleSend}
          placeholder="Type here..."
          className="w-full bg-white border-2 border-[#cbd5e1] rounded-xl px-4 py-2.5 font-bold text-[#1f2937] focus:outline-none focus:border-[#3b82f6] placeholder-[#94a3b8] transition-colors shadow-inner"
        />
      </div>
    </div>
  );
}
