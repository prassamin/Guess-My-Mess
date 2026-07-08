"use client";

import { useState } from "react";
import { useRouter } from "@bprogress/next";
import { Loader2, X } from "lucide-react";
import {
  createRoomInRedis,
  checkRoomExists,
  getPublicRooms,
} from "@/actions/room";
import { customAlphabet } from "nanoid";

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  initialMode?: "menu" | "create";
}

export default function RoomModal({
  isOpen,
  onClose,
  user,
  initialMode = "menu",
}: RoomModalProps) {
  const router = useRouter();

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

  const [isJoiningRandom, setIsJoiningRandom] = useState(false);

  const handleJoinRandom = async () => {
    setIsJoiningRandom(true);
    setJoinError("");
    try {
      const { rooms } = await getPublicRooms();
      // Filter for rooms that have space (getPublicRooms already filters for valid status)
      const availableRooms = rooms.filter(
        (r: any) => r.playersCount < r.maxPlayers
      );

      if (availableRooms.length > 0) {
        // Pick a random available room
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
      // Generate a random 6-character room code using nanoid
      const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 6);

      let roomCode = "";
      let res;
      // Retry up to 10 times to find a unique room code
      for (let attempt = 0; attempt < 10; attempt++) {
        roomCode = nanoid();
        const exists = await checkRoomExists(roomCode);
        if (!exists) {
          // Save room settings to Redis directly via Server Action
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1f2937]/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`bg-white border-2 sm:border-[6px] border-[#0f172a] rounded-3xl sm:rounded-[3rem] p-4 sm:p-6 md:p-8 w-[92vw] sm:w-full shadow-[0_8px_0_#0f172a] sm:shadow-[0_16px_0_#0f172a] relative animate-in zoom-in-95 duration-300 mx-auto ${
          modalMode === "menu"
            ? "max-w-[92vw] sm:max-w-md md:max-w-lg"
            : "max-w-[95vw] sm:max-w-2xl"
        }`}
      >
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-10 h-10 sm:w-14 sm:h-14 bg-[#f87171] border-2 sm:border-4 border-[#991b1b] rounded-full flex items-center justify-center shadow-[0_4px_0_#991b1b] sm:shadow-[0_6px_0_#991b1b] active:translate-y-1.5 active:shadow-none transition-all z-10"
        >
          <X className="w-6 h-6 sm:w-8 sm:h-8 text-white" strokeWidth={4} />
        </button>

        {modalMode === "menu" ? (
          <>
            <h2 className="text-2xl sm:text-4xl font-black text-center text-[#1f2937] uppercase tracking-widest mb-4 sm:mb-8 text-stroke-sm">
              <span className="text-white">Choose Mode</span>
            </h2>

            <div className="space-y-5">
              <button
                onClick={() => router.push("/rooms")}
                className="w-full h-14 sm:h-20 bg-[#c084fc] border-2 sm:border-4 border-[#7e22ce] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#7e22ce] sm:shadow-[0_8px_0_#7e22ce] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-3xl font-black text-white uppercase tracking-widest relative overflow-hidden text-stroke-sm"
              >
                <div className="absolute top-0 inset-x-0 h-5 bg-white/30 rounded-t-xl pointer-events-none" />
                Public Rooms
              </button>

              <button
                onClick={handleJoinRandom}
                disabled={isJoiningRandom}
                className="w-full h-14 sm:h-20 bg-[#ffb74d] border-2 sm:border-4 border-[#f57c00] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#f57c00] sm:shadow-[0_8px_0_#f57c00] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-3xl font-black text-white uppercase tracking-widest relative overflow-hidden disabled:opacity-50 text-stroke-sm"
              >
                <div className="absolute top-0 inset-x-0 h-5 bg-white/30 rounded-t-xl pointer-events-none" />
                {isJoiningRandom ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  "Join Random"
                )}
              </button>

              <button
                onClick={() => setModalMode("create")}
                className="w-full h-14 sm:h-20 bg-[#4ade80] border-2 sm:border-4 border-[#166534] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#166534] sm:shadow-[0_8px_0_#166534] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-3xl font-black text-white uppercase tracking-widest relative overflow-hidden text-stroke-sm"
              >
                <div className="absolute top-0 inset-x-0 h-5 bg-white/30 rounded-t-xl pointer-events-none" />
                Create Room
              </button>

              <div className="flex flex-col gap-2">
                <div className="flex gap-3 pt-2 border-t-4 border-dashed border-gray-300">
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
                      className="w-full h-14 sm:h-20 bg-[#e2e8f0] border-2 sm:border-4 border-[#94a3b8] rounded-xl sm:rounded-2xl text-center text-xl sm:text-3xl font-black text-[#1f2937] uppercase placeholder:text-gray-400 focus:outline-none shadow-[0_4px_0_#94a3b8] sm:shadow-[0_8px_0_#94a3b8]"
                      onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                    />
                    <div className="absolute top-1 inset-x-1 h-5 bg-white/40 rounded-t-xl pointer-events-none" />
                  </div>
                  <button
                    onClick={handleJoinRoom}
                    className="w-24 sm:w-32 shrink-0 h-14 sm:h-20 bg-[#60a5fa] border-2 sm:border-4 border-[#1d4ed8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_8px_0_#1d4ed8] active:translate-y-2 active:shadow-none transition-all flex items-center justify-center text-lg sm:text-2xl font-black text-white uppercase tracking-widest relative overflow-hidden disabled:opacity-50 text-stroke-sm"
                    disabled={!roomCode.trim() || isJoining}
                  >
                    <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-xl pointer-events-none" />
                    {isJoining ? (
                      <Loader2 className="w-6 h-6 animate-spin drop-shadow-md" />
                    ) : (
                      "Join"
                    )}
                  </button>
                </div>
                {joinError && (
                  <p className="text-red-500 font-bold text-center mt-2 animate-in fade-in slide-in-from-top-2">
                    {joinError}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl sm:text-4xl font-black text-center text-[#1f2937] uppercase tracking-widest mb-4 sm:mb-6 text-stroke-sm">
              <span className="text-white">Room Settings</span>
            </h2>

            <div
              className="space-y-3 sm:space-y-4 max-h-[70vh] sm:max-h-[60vh] overflow-y-auto pr-2"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col sm:flex-row justify-between items-center sm:col-span-2 gap-2 sm:gap-4">
                  <div className="flex flex-col text-center sm:text-left">
                    <span className="font-black text-[#1f2937] text-xl uppercase tracking-wider">
                      Room Visibility
                    </span>
                    <span className="font-bold text-gray-500 text-sm uppercase">
                      {isPublic
                        ? "Anyone can find and join this room"
                        : "Only people with the code can join"}
                    </span>
                  </div>
                  <div className="flex bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden w-full sm:w-64 shrink-0">
                    <button
                      onClick={() => setIsPublic(true)}
                      className={`flex-1 py-3 font-black text-lg transition-colors border-r-[3px] border-[#94a3b8] ${
                        isPublic
                          ? "bg-[#4ade80] text-white shadow-inner"
                          : "text-[#1f2937] hover:bg-gray-100"
                      }`}
                    >
                      PUBLIC
                    </button>
                    <button
                      onClick={() => setIsPublic(false)}
                      className={`flex-1 py-3 font-black text-lg transition-colors ${
                        !isPublic
                          ? "bg-[#f87171] text-white shadow-inner"
                          : "text-[#1f2937] hover:bg-gray-100"
                      }`}
                    >
                      PRIVATE
                    </button>
                  </div>
                </div>

                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col items-center">
                  <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-2">
                    Max Players
                  </span>
                  <div className="flex w-full justify-between bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden">
                    {[4, 8, 12, 16].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMaxPlayers(num)}
                        className={`flex-1 py-2 font-black transition-colors ${
                          maxPlayers === num
                            ? "bg-[#4ade80] text-white shadow-inner"
                            : "text-[#1f2937] hover:bg-gray-100"
                        } ${
                          num !== 16 ? "border-r-[3px] border-[#94a3b8]" : ""
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col items-center">
                  <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-2">
                    Rounds
                  </span>
                  <div className="flex w-full justify-between bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden">
                    {[3, 5, 8, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setRounds(num)}
                        className={`flex-1 py-2 font-black transition-colors ${
                          rounds === num
                            ? "bg-[#ffb74d] text-white shadow-inner"
                            : "text-[#1f2937] hover:bg-gray-100"
                        } ${
                          num !== 10 ? "border-r-[3px] border-[#94a3b8]" : ""
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col items-center">
                  <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-2">
                    Draw Time (s)
                  </span>
                  <div className="flex w-full justify-between bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden">
                    {[60, 90, 120, 150].map((num) => (
                      <button
                        key={num}
                        onClick={() => setDrawTime(num)}
                        className={`flex-1 py-2 font-black transition-colors ${
                          drawTime === num
                            ? "bg-[#60a5fa] text-white shadow-inner"
                            : "text-[#1f2937] hover:bg-gray-100"
                        } ${
                          num !== 150 ? "border-r-[3px] border-[#94a3b8]" : ""
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col items-center">
                  <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-2">
                    Word Choices
                  </span>
                  <div className="flex w-full justify-between bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden">
                    {[2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        onClick={() => setWordCount(num)}
                        className={`flex-1 py-2 font-black transition-colors ${
                          wordCount === num
                            ? "bg-[#a855f7] text-white shadow-inner"
                            : "text-[#1f2937] hover:bg-gray-100"
                        } ${
                          num !== 5 ? "border-r-[3px] border-[#94a3b8]" : ""
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col items-center sm:col-span-2">
                  <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-2">
                    Hints Provided
                  </span>
                  <div className="flex w-full justify-between bg-white rounded-xl border-[3px] border-[#94a3b8] overflow-hidden max-w-sm mx-auto">
                    {[0, 1, 2, 3].map((num) => (
                      <button
                        key={num}
                        onClick={() => setHints(num)}
                        className={`flex-1 py-2 font-black transition-colors ${
                          hints === num
                            ? "bg-[#f43f5e] text-white shadow-inner"
                            : "text-[#1f2937] hover:bg-gray-100"
                        } ${
                          num !== 3 ? "border-r-[3px] border-[#94a3b8]" : ""
                        }`}
                      >
                        {num === 0 ? "0" : num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-[#e2e8f0] p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-[#94a3b8] shadow-inner flex flex-col">
                <span className="font-black text-[#1f2937] text-lg uppercase tracking-wider mb-3">
                  Custom Words (comma separated)
                </span>
                <textarea
                  rows={3}
                  value={customWords}
                  onChange={(e) => setCustomWords(e.target.value)}
                  placeholder="e.g. apple, banana, sports car..."
                  className="w-full bg-white border-2 sm:border-4 border-[#94a3b8] rounded-lg sm:rounded-xl p-3 sm:p-4 font-bold text-[#1f2937] text-base sm:text-lg focus:outline-none resize-none mb-3 sm:mb-4 shadow-inner"
                />

                <label className="flex items-center space-x-4 cursor-pointer group w-max">
                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={customWordsOnly}
                      onChange={(e) => setCustomWordsOnly(e.target.checked)}
                    />
                    <div
                      className={`w-12 h-7 sm:w-14 sm:h-8 rounded-full border-2 sm:border-4 border-[#94a3b8] transition-colors ${
                        customWordsOnly ? "bg-[#4ade80]" : "bg-white"
                      }`}
                    ></div>
                    <div
                      className={`absolute top-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-[3px] border-[#94a3b8] transition-transform duration-200 ${
                        customWordsOnly
                          ? "translate-x-6 bg-white"
                          : "translate-x-1 bg-gray-300"
                      }`}
                    ></div>
                  </div>
                  <span className="font-black text-[#1f2937] text-sm uppercase tracking-wide transition-colors">
                    Use Custom Words Only
                  </span>
                </label>
              </div>

              {createError && (
                <p className="text-red-500 font-bold text-center mt-2 animate-in fade-in slide-in-from-top-2">
                  {createError}
                </p>
              )}

              <div className="flex space-x-3 sm:space-x-4 pt-1 sm:pt-2 pb-2">
                <button
                  onClick={() => setModalMode("menu")}
                  className="w-1/3 h-12 sm:h-16 bg-[#94a3b8] border-2 sm:border-4 border-[#475569] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#475569] sm:shadow-[0_6px_0_#475569] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-lg sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden disabled:opacity-50 text-stroke-sm"
                  disabled={isCreating}
                >
                  Back
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1 h-12 sm:h-16 bg-[#4ade80] border-2 sm:border-4 border-[#166534] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#166534] sm:shadow-[0_6px_0_#166534] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-2xl font-black text-white uppercase tracking-widest relative overflow-hidden disabled:opacity-70 text-stroke-sm"
                >
                  <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-xl pointer-events-none" />
                  {isCreating ? (
                    <Loader2 className="w-8 h-8 animate-spin drop-shadow-md" />
                  ) : (
                    "Start Game"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
