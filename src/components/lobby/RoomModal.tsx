"use client";

import { useState, useRef } from "react";
import { useRouter } from "@bprogress/next";
import { Loader2, X, Users, Shuffle, Plus, Play } from "lucide-react";
import {
  createRoomInRedis,
  checkRoomExists,
  getPublicRooms,
} from "@/actions/room";
import { customAlphabet } from "nanoid";
import { motion, AnimatePresence } from "framer-motion";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";

interface RoomModalProps {
  onClose: () => void;
  user: any;
  initialMode?: "menu" | "create";
}

export default function RoomModal({
  onClose,
  user,
  initialMode = "menu",
}: RoomModalProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);

  // Use the new hook!
  useOnClickOutside(modalRef as any, onClose);

  const [modalMode, setModalMode] = useState<"menu" | "create">(initialMode);
  const [roomCode, setRoomCode] = useState("");
  const [rounds, setRounds] = useState(3);
  const [drawTime, setDrawTime] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [wordCount, setWordCount] = useState(3);
  const [hints, setHints] = useState(2);
  const [customWords, setCustomWords] = useState("");
  const [customWordsOnly, setCustomWordsOnly] = useState(false);
  const [isPublic, setIsPublic] = useState(true);

  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [isJoiningRandom, setIsJoiningRandom] = useState(false);

  const handleJoinRoom = async () => {
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    setIsJoining(true);
    setJoinError("");
    try {
      const exists = await checkRoomExists(code);
      if (exists) {
        sessionStorage.setItem("previouslyConfirmed", "true");
        router.push(`/room/${code}`);
      } else {
        setJoinError("Room not found!");
      }
    } catch {
      setJoinError("Error checking room");
    } finally {
      setIsJoining(false);
    }
  };

  const handleJoinRandom = async () => {
    setIsJoiningRandom(true);
    setJoinError("");
    try {
      const { rooms } = await getPublicRooms();
      const availableRooms = rooms.filter(
        (r: any) => r.playersCount < r.maxPlayers
      );

      if (availableRooms.length > 0) {
        const randomRoom =
          availableRooms[Math.floor(Math.random() * availableRooms.length)];
        sessionStorage.setItem("previouslyConfirmed", "true");
        router.push(`/room/${randomRoom.id}`);
      } else {
        setJoinError("No public rooms available!");
      }
    } catch {
      setJoinError("Failed to find a room.");
    } finally {
      setIsJoiningRandom(false);
    }
  };

  const handleCreateRoom = async () => {
    if (!user) return;
    setIsCreating(true);
    setCreateError("");

    try {
      const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);
      let roomCode = "";
      let res;
      for (let attempt = 0; attempt < 10; attempt++) {
        roomCode = nanoid();
        const exists = await checkRoomExists(roomCode);
        if (!exists) {
          const settings = {
            isPublic,
            maxPlayers,
            rounds,
            drawTime,
            wordCount,
            hints,
            customWordsOnly,
            customWords: customWords.trim(),
          };
          res = await createRoomInRedis(roomCode, user.id, settings);
          break;
        }
      }

      if (!res || !res.success) {
        throw new Error(
          res?.error || "Failed to create a unique room. Please try again."
        );
      }

      sessionStorage.setItem("previouslyConfirmed", "true");
      router.push(`/room/${roomCode}`);
    } catch (err: any) {
      console.error(err);
      setCreateError(
        (err.message === "An unexpected response was received from the server."
          ? "Internal Server Error"
          : err.message) || "Failed to create room"
      );
      setIsCreating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
        className={`bg-white/95 backdrop-blur-xl border border-white rounded-4xl sm:rounded-[2.5rem] p-5 sm:p-8 w-full shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] relative flex flex-col mx-auto ${
          modalMode === "menu"
            ? "max-w-[95vw] sm:max-w-md md:max-w-lg"
            : "max-w-[95vw] sm:max-w-2xl max-h-dvh"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-3 w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:scale-105 hover:text-red-500 hover:border-red-200 active:scale-95 text-slate-400 transition-all z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
        </button>

        <AnimatePresence mode="wait">
          {modalMode === "menu" ? (
            <motion.div
              key="menu"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col"
            >
              <h2 className="text-lg sm:text-2xl font-black text-center text-slate-800 uppercase tracking-widest mb-4 sm:mb-6">
                Choose Mode
              </h2>

              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={() => router.push("/rooms")}
                  className="w-full h-12 sm:h-16 bg-linear-to-b from-purple-400 to-purple-500 rounded-2xl shadow-[0_4px_0_#9333ea] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-base sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group gap-2"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                  <Users className="w-5 h-5" />
                  Public Rooms
                </button>

                <button
                  onClick={handleJoinRandom}
                  disabled={isJoiningRandom}
                  className="w-full h-12 sm:h-16 bg-linear-to-b from-amber-400 to-amber-500 rounded-2xl shadow-[0_4px_0_#d97706] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-base sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group gap-2 disabled:opacity-50"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                  {isJoiningRandom ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Shuffle className="w-5 h-5" />
                      Join Random
                    </>
                  )}
                </button>

                <button
                  onClick={() => setModalMode("create")}
                  className="w-full h-12 sm:h-16 bg-linear-to-b from-emerald-400 to-emerald-500 rounded-2xl shadow-[0_4px_0_#059669] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-base sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group gap-2"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                  <Plus className="w-5 h-5" />
                  Create Room
                </button>

                <div className="flex flex-col gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-slate-100">
                  <div className="flex gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        placeholder="CODE"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        value={roomCode}
                        onChange={(e) => {
                          setRoomCode(e.target.value.toUpperCase());
                          setJoinError("");
                        }}
                        maxLength={6}
                        className="w-full h-12 sm:h-16 bg-slate-50 border-2 border-slate-200 rounded-2xl text-center text-lg sm:text-2xl font-black text-slate-800 uppercase placeholder:text-slate-300 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/20 transition-all shadow-inner"
                        onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                      />
                    </div>
                    <button
                      onClick={handleJoinRoom}
                      className="w-20 sm:w-32 shrink-0 h-12 sm:h-16 bg-linear-to-b from-sky-400 to-sky-500 rounded-2xl shadow-[0_4px_0_#0284c7] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-base sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group gap-1 disabled:opacity-50"
                      disabled={!roomCode.trim() || isJoining}
                    >
                      <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                      {isJoining ? (
                        <Loader2 className="w-4 sm:w-5 h-4 sm:h-5 animate-spin" />
                      ) : (
                        <>
                          <Play className="w-3 sm:w-4 h-3 sm:h-4 fill-current" />
                          Join
                        </>
                      )}
                    </button>
                  </div>
                  {joinError && (
                    <p className="text-red-500 font-bold text-center mt-1 animate-in fade-in slide-in-from-top-2 text-sm">
                      {joinError}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="create"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full"
            >
              <h2 className="text-lg sm:text-2xl font-black text-center text-slate-800 uppercase tracking-widest mb-4 sm:mb-6 shrink-0">
                Room Settings
              </h2>

              <div className="max-h-[60dvh] overflow-y-auto custom-scrollbar pr-2 sm:pr-4 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Visibility */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col sm:col-span-2 gap-2 sm:gap-3">
                    <div className="flex flex-col">
                      <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider mb-1">
                        Room Visibility
                      </span>
                      <span className="font-bold text-slate-400 text-[10px] sm:text-xs uppercase">
                        {isPublic
                          ? "Anyone can find and join this room"
                          : "Only people with the code can join"}
                      </span>
                    </div>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      <button
                        onClick={() => setIsPublic(true)}
                        className={`flex-1 py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all ${
                          isPublic
                            ? "bg-white text-emerald-500 shadow-sm"
                            : "text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        PUBLIC
                      </button>
                      <button
                        onClick={() => setIsPublic(false)}
                        className={`flex-1 py-2 sm:py-2.5 rounded-lg font-black text-xs sm:text-sm transition-all ${
                          !isPublic
                            ? "bg-white text-rose-500 shadow-sm"
                            : "text-slate-400 hover:bg-slate-200"
                        }`}
                      >
                        PRIVATE
                      </button>
                    </div>
                  </div>

                  {/* Max Players */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3">
                    <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider">
                      Max Players
                    </span>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {[4, 8, 12, 16].map((num) => (
                        <button
                          key={num}
                          onClick={() => setMaxPlayers(num)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-lg font-black text-xs sm:text-sm transition-all ${
                            maxPlayers === num
                              ? "bg-white text-sky-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rounds */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3">
                    <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider">
                      Rounds
                    </span>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {[3, 5, 8, 10].map((num) => (
                        <button
                          key={num}
                          onClick={() => setRounds(num)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-lg font-black text-xs sm:text-sm transition-all ${
                            rounds === num
                              ? "bg-white text-amber-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Draw Time */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3">
                    <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider">
                      Draw Time (s)
                    </span>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {[60, 90, 120, 150].map((num) => (
                        <button
                          key={num}
                          onClick={() => setDrawTime(num)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-lg font-black text-xs sm:text-sm transition-all ${
                            drawTime === num
                              ? "bg-white text-indigo-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Word Choices */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3">
                    <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider">
                      Word Choices
                    </span>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1">
                      {[2, 3, 4, 5].map((num) => (
                        <button
                          key={num}
                          onClick={() => setWordCount(num)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-lg font-black text-xs sm:text-sm transition-all ${
                            wordCount === num
                              ? "bg-white text-purple-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hints Provided */}
                  <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3 sm:col-span-2">
                    <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider text-center">
                      Hints Provided
                    </span>
                    <div className="flex bg-slate-100 rounded-xl p-1 gap-1 max-w-sm mx-auto w-full">
                      {[0, 1, 2, 3].map((num) => (
                        <button
                          key={num}
                          onClick={() => setHints(num)}
                          className={`flex-1 py-1.5 sm:py-2 rounded-lg font-black text-xs sm:text-sm transition-all ${
                            hints === num
                              ? "bg-white text-rose-500 shadow-sm"
                              : "text-slate-400 hover:bg-slate-200"
                          }`}
                        >
                          {num === 0 ? "0" : num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Custom Words */}
                <div className="bg-slate-50 p-3 sm:p-5 rounded-2xl border border-slate-200 flex flex-col gap-2 sm:gap-3">
                  <span className="font-black text-slate-700 text-xs sm:text-sm uppercase tracking-wider">
                    Custom Words (comma separated)
                  </span>
                  <textarea
                    rows={2}
                    value={customWords}
                    onChange={(e) => setCustomWords(e.target.value)}
                    placeholder="e.g. apple, banana, sports car..."
                    className="w-full bg-white border-2 border-slate-200 rounded-xl p-2 sm:p-4 font-bold text-slate-700 text-sm sm:text-base focus:outline-none focus:border-sky-400 focus:ring-4 focus:ring-sky-400/20 transition-all resize-none shadow-sm placeholder:text-slate-300"
                  />

                  <label className="flex items-center space-x-3 cursor-pointer group w-max mt-1 sm:mt-2">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={customWordsOnly}
                        onChange={(e) => setCustomWordsOnly(e.target.checked)}
                      />
                      <div
                        className={`w-11 h-6 rounded-full transition-colors ${
                          customWordsOnly ? "bg-emerald-400" : "bg-slate-200"
                        }`}
                      ></div>
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                          customWordsOnly ? "translate-x-6" : "translate-x-1"
                        }`}
                      ></div>
                    </div>
                    <span className="font-bold text-slate-500 text-xs sm:text-sm uppercase tracking-wider transition-colors group-hover:text-slate-700">
                      Use Custom Words Only
                    </span>
                  </label>
                </div>
              </div>

              {createError && (
                <p className="text-red-500 font-bold text-center mt-2 animate-in fade-in text-xs sm:text-sm shrink-0">
                  {createError}
                </p>
              )}

              <div className="flex space-x-3 sm:space-x-4 pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-slate-100 shrink-0">
                <button
                  onClick={() => setModalMode("menu")}
                  className="w-1/3 h-12 sm:h-16 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:bg-slate-50 hover:border-slate-300 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-xs sm:text-base font-black text-slate-500 uppercase tracking-widest disabled:opacity-50"
                  disabled={isCreating}
                >
                  Back
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1 h-12 sm:h-16 bg-linear-to-b from-emerald-400 to-emerald-500 rounded-2xl shadow-[0_4px_0_#059669] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-base sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden disabled:opacity-70 group"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
                  {isCreating ? (
                    <Loader2 className="w-5 sm:w-6 h-5 sm:h-6 animate-spin drop-shadow-md" />
                  ) : (
                    <>
                      <Play className="w-4 sm:w-5 h-4 sm:h-5 mr-2 fill-current" />
                      Start Game
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
