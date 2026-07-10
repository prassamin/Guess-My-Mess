import { useState, useEffect, useRef } from "react";
import { Clock, CheckCircle } from "lucide-react";
import DrawingCanvas from "./DrawingCanvas";
import { useRoomStore } from "@/store/room-store";
import { useAppStore } from "@/store/app-store";
import { playAudio } from "@/lib/audio";

export default function GameArea() {
  const { user } = useAppStore();
  const { roomState, ws, wordChoices, currentWord, revealedWord } =
    useRoomStore();
  const userId = user?.id;
  const [now, setNow] = useState(0);

  useEffect(() => {
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const gs = roomState?.gameState;
  const drawer = gs ? roomState?.players?.[gs.currentTurnIndex] : null;
  const isDrawer = drawer?.id === userId;

  const timeLeft = gs
    ? Math.max(0, Math.ceil((gs.turnEndTime - now) / 1000))
    : 0;
  const prevTimeLeftRef = useRef(timeLeft);
  const prevPhaseRef = useRef(gs?.phase);

  useEffect(() => {
    if (
      (gs?.phase === "drawing" || gs?.phase === "choosing") &&
      timeLeft <= 10 &&
      timeLeft > 0 &&
      timeLeft !== prevTimeLeftRef.current
    ) {
      playAudio("tick");
    }
    prevTimeLeftRef.current = timeLeft;
  }, [timeLeft, gs?.phase]);

  useEffect(() => {
    if (gs?.phase === "drawing" && prevPhaseRef.current !== "drawing") {
      playAudio("round_start");
    }
    prevPhaseRef.current = gs?.phase;
  }, [gs?.phase]);

  if (!gs) return null;

  const handleChooseWord = (word: string) => {
    if (ws && ws.connected) {
      ws.emit("message", { type: "word_chosen", word });
    }
  };

  const textStroke = {
    textShadow:
      "-2px -2px 0 #1f2937, 2px -2px 0 #1f2937, -2px 2px 0 #1f2937, 2px 2px 0 #1f2937, 0 4px 0 #1f2937",
  };

  if (gs.phase === "choosing") {
    return (
      <div className="flex-1 bg-white rounded-none lg:rounded-4xl shadow-none lg:shadow-[0_12px_0_#94a3b8] flex flex-col items-center justify-center border-y-2 lg:border-[6px] border-[#94a3b8] border-x-0 lg:border-x-[6px] relative overflow-hidden p-4 sm:p-8 w-full h-full min-h-0">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-50/80 pointer-events-none z-20" />
        {isDrawer ? (
          <div className="flex flex-col justify-center items-center w-full max-w-5xl z-10 px-2 sm:px-6 h-full">
            <h2
              className="font-black text-[#1f2937] text-2xl sm:text-5xl uppercase tracking-widest mb-6 sm:mb-12 text-center drop-shadow-xl"
              style={textStroke}
            >
              <span className="text-white">Choose a Word</span>
            </h2>
            <div className="flex flex-row flex-wrap items-center justify-center  gap-3 sm:gap-6">
              {wordChoices.map((word, idx) => {
                // Dynamically distribute hues based on total number of choices
                const hue =
                  (idx * (360 / Math.max(1, wordChoices.length))) % 360;
                const bgColor = `hsl(${hue}, 85%, 65%)`;
                const shadowColor = `hsl(${hue}, 85%, 40%)`;

                return (
                  <button
                    key={word}
                    onClick={() => handleChooseWord(word)}
                    style={{
                      backgroundColor: bgColor,
                      borderColor: shadowColor,
                      boxShadow: `0 8px 0 ${shadowColor}`,
                    }}
                    className="order-4 h-fit p-5 sm:border-[6px] border-2 rounded-2xl sm:rounded-3xl active:translate-y-1 sm:active:translate-y-2 active:shadow-none transition-all flex flex-col items-center justify-center relative overflow-hidden group hover:-translate-y-2 hover:shadow-[0_12px_0_rgba(0,0,0,0.2)]"
                  >
                    <div className="absolute top-0 inset-x-0 h-4 sm:h-6 bg-white/30 rounded-t-xl sm:rounded-t-2xl pointer-events-none" />

                    <span
                      className="font-black text-white text-lg sm:text-3xl uppercase tracking-widest relative z-10 transition-transform text-center leading-tight sm:leading-none wrap-break-word"
                      style={textStroke}
                    >
                      {word}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center z-10">
            <div className="w-16 h-16 sm:w-24 sm:h-24 mb-4 sm:mb-6 relative">
              <img
                alt={"Avatar"}
                src={drawer?.avatar}
                className="w-full h-full rounded-2xl border-[3px] sm:border-4 border-[#94a3b8] bg-white relative z-10 animate-bounce"
              />
            </div>
            <h2
              className="font-black text-[#1f2937] text-xl sm:text-5xl uppercase tracking-widest mb-2 sm:mb-4"
              style={textStroke}
            >
              <span className="text-white">{drawer?.name} is choosing...</span>
            </h2>
            <div className="flex space-x-2 mt-2 sm:mt-4">
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-[#60a5fa] rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-[#f87171] rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <div
                className="w-3 h-3 sm:w-4 sm:h-4 bg-[#4ade80] rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gs.phase === "drawing") {
    const hasGuessedCorrectly = gs.guessedCorrectly.includes(userId);

    // Create the blank word structure (e.g. "_ _ _ _ _")
    const blankWord = Array(gs.wordLength).fill("_").join(" ");

    const getDynamicFontSize = (len: number) => {
      if (len > 24) return "text-xs md:text-lg";
      if (len > 18) return "text-sm md:text-xl";
      if (len > 12) return "text-base md:text-2xl";
      return "text-xl md:text-4xl";
    };

    let wordCountsStr = "";
    if (isDrawer && currentWord) {
      wordCountsStr = currentWord
        .split(" ")
        .map((w) => w.length)
        .join(", ");
    } else if (gs.lastSentHint) {
      wordCountsStr = gs.lastSentHint
        .split("   ")
        .map((w: any) => w.replace(/ /g, "").length)
        .join(", ");
    } else {
      wordCountsStr = String(gs.wordLength);
    }

    const dynamicTextClass = getDynamicFontSize(gs.wordLength);

    return (
      <div className="flex-1 flex flex-col h-full min-h-0 w-full">
        {/* Top bar for the drawing canvas area showing the word / timer */}
        <div className="bg-white border-y-2 lg:border-[6px] border-[#94a3b8] rounded-none lg:rounded-t-4xl lg:border-b-0 p-2.5 md:p-4 flex items-center justify-between shrink-0 relative overflow-hidden z-10 shadow-[0_-2px_0_rgba(0,0,0,0.1)_inset] sm:shadow-[0_-4px_0_rgba(0,0,0,0.1)_inset]">
          <div className="absolute top-0 inset-x-0 h-2 sm:h-4 bg-slate-100/80 pointer-events-none" />

          <div className="flex items-center space-x-1.5 sm:space-x-4 relative z-10 max-w-[30%]">
            <img
              alt={"Avatar"}
              src={drawer?.avatar}
              className="w-8 h-8 md:w-12 md:h-12 rounded-lg sm:rounded-xl border-2 sm:border-[3px] border-[#94a3b8] bg-[#e2e8f0]"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="font-black text-[#1f2937] text-xs sm:text-base uppercase leading-none truncate">
                {drawer?.name}
              </span>
              <span className="font-bold text-gray-500 text-[9px] sm:text-xs uppercase mt-0.5 sm:mt-1 leading-none">
                is drawing
              </span>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-2 sm:px-4 min-w-0">
            <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
              {isDrawer ? (
                <span
                  className={`font-black text-[#f87171] tracking-widest uppercase truncate ${dynamicTextClass}`}
                  style={textStroke}
                >
                  <span className="text-white">{currentWord}</span>
                </span>
              ) : hasGuessedCorrectly ? (
                <div className="flex items-center space-x-1 sm:space-x-2 bg-[#4ade80] border-2 sm:border-[3px] border-[#166534] px-2 py-0.5 sm:px-4 sm:py-1.5 rounded-full shadow-[0_1px_0_#166534] sm:shadow-[0_4px_0_#166534]">
                  <CheckCircle className="w-2.5 h-2.5 sm:w-5 sm:h-5 text-white" />
                  <span className="font-black text-white text-[9px] sm:text-lg uppercase whitespace-nowrap">
                    Guessed It!
                  </span>
                </div>
              ) : (
                <span
                  className={`font-black text-[#1f2937] tracking-widest uppercase whitespace-pre-wrap text-center ${dynamicTextClass}`}
                  style={{ wordSpacing: "0.2em" }}
                >
                  {revealedWord || gs.lastSentHint || blankWord}
                </span>
              )}
              {(!hasGuessedCorrectly || isDrawer) && (
                <span className="hidden sm:inline-block font-black text-gray-400 text-xs md:text-sm bg-gray-100/80 px-2 py-1 rounded-lg border-2 border-gray-200 whitespace-nowrap">
                  {wordCountsStr}
                </span>
              )}
            </div>
            {(!hasGuessedCorrectly || isDrawer) && (
              <span className="sm:hidden font-black text-gray-400 text-[10px] bg-gray-100/80 px-1.5 py-0.5 rounded border border-gray-200 mt-1 whitespace-nowrap">
                {wordCountsStr}
              </span>
            )}
          </div>

          <div className="flex items-stretch bg-[#ffb74d] rounded-lg sm:rounded-2xl border-2 sm:border-[3px] border-[#f57c00] shadow-[0_1.5px_0_#f57c00] sm:shadow-[0_4px_0_#f57c00] relative z-10 shrink-0 overflow-hidden h-8 sm:h-14">
            <div className="px-1.5 sm:px-3 flex flex-col items-center justify-center bg-white/30 border-r-2 sm:border-r-[3px] border-[#f57c00]">
              <span className="font-black text-[#1f2937] text-[6px] sm:text-[10px] uppercase tracking-widest leading-none">
                Rnd
              </span>
              <span className="font-black text-[#1f2937] text-[10px] sm:text-base leading-none mt-0.5">
                {gs.currentRound || 1}/{roomState?.settings?.rounds || 3}
              </span>
            </div>
            <div className="px-2 sm:px-4 flex items-center justify-center relative">
              <Clock className="w-3 h-3 sm:w-6 sm:h-6 text-[#1f2937] absolute opacity-20" />
              <span
                className={`font-black text-[#1f2937] text-xs sm:text-2xl relative z-10 ${
                  timeLeft <= 10 ? "animate-pulse text-red-600" : ""
                }`}
              >
                {timeLeft}
              </span>
            </div>
          </div>
        </div>

        {/* The actual canvas component */}
        <div className="flex-1 min-h-0 w-full relative flex flex-col">
          <DrawingCanvas isDrawer={isDrawer} />
        </div>
      </div>
    );
  }

  if (gs.phase === "round_end") {
    return (
      <div className="flex-1 bg-white rounded-none lg:rounded-4xl shadow-none lg:shadow-[0_12px_0_#94a3b8] flex flex-col items-center justify-center border-y-2 lg:border-[6px] border-[#94a3b8] border-x-0 lg:border-x-[6px] relative overflow-hidden p-4 sm:p-8 w-full h-full min-h-0">
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-50/80 pointer-events-none z-20" />

        <h2
          className="font-black text-[#1f2937] text-lg sm:text-3xl uppercase tracking-widest mb-1 sm:mb-2"
          style={textStroke}
        >
          <span
            className={(gs as any).drawerLeft ? "text-[#f87171]" : "text-white"}
          >
            {(gs as any).drawerLeft ? "The Drawer Left!" : "The word was"}
          </span>
        </h2>

        {revealedWord && !(gs as any).drawerLeft && (
          <h1
            className="font-black text-[#4ade80] text-3xl sm:text-7xl uppercase tracking-widest mb-4 sm:mb-10 text-center"
            style={textStroke}
          >
            {revealedWord}
          </h1>
        )}
        {(gs as any).drawerLeft && (
          <h1
            className="font-black text-[#f87171] text-3xl sm:text-6xl uppercase tracking-widest mb-4 sm:mb-10"
            style={textStroke}
          >
            TURN CANCELLED
          </h1>
        )}

        <div className="bg-[#e2e8f0] border-[3px] md:border-4 border-[#94a3b8] rounded-2xl sm:rounded-3xl p-3 sm:p-6 w-full max-w-md shadow-inner">
          <h3 className="font-black text-[#1f2937] text-base sm:text-xl uppercase mb-2 sm:mb-4 text-center">
            Score Updates
          </h3>
          <div className="flex flex-col space-y-2 sm:space-y-3">
            {roomState.players.map((p: any) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white border-2 sm:border-[3px] border-[#94a3b8] rounded-lg sm:rounded-xl p-2 sm:p-3 shadow-sm"
              >
                <div className="flex items-center space-x-2 sm:space-x-3 overflow-hidden">
                  <img
                    alt={"Avatar"}
                    src={p.avatar}
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg border-2 border-[#94a3b8] shrink-0"
                  />
                  <span className="font-black text-[#1f2937] uppercase text-[10px] sm:text-base truncate">
                    {p.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2 shrink-0 pl-2">
                  {p.lastRoundPoints !== undefined && (
                    <span
                      className={`font-black text-xs sm:text-sm ${
                        p.lastRoundPoints > 0
                          ? "text-[#4ade80]"
                          : p.lastRoundPoints < 0
                            ? "text-[#f87171]"
                            : "text-gray-400"
                      }`}
                    >
                      {p.lastRoundPoints > 0 ? "+" : ""}
                      {p.lastRoundPoints}
                    </span>
                  )}
                  <span className="font-black text-[#ffb74d] text-sm sm:text-lg">
                    {p.score} PTS
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
