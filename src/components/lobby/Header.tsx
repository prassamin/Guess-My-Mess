"use client";

import { useRouter } from "@bprogress/next";
import { Trophy, Settings } from "lucide-react";

export default function Header({ user }: { user: any }) {
  const router = useRouter();

  const handleProfileClick = () => {
    const username = user?.username || user?.user_metadata?.username;
    if (username) {
      router.push(`/profile/${username}`);
    }
  };

  return (
    <header className="w-full h-14 sm:h-20 shrink-0 px-4 sm:px-6 flex justify-end items-center relative z-20 mt-2 sm:mt-4">
      <div className="flex gap-2 sm:gap-4 items-center">
        <button 
          onClick={() => router.push("/leaderboard")}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-[#ffb74d] border-2 sm:border-4 border-[#f57c00] shadow-[0_4px_0_#f57c00] sm:shadow-[0_6px_0_#f57c00] rounded-xl sm:rounded-2xl flex items-center justify-center active:translate-y-1.5 active:shadow-none transition-all"
        >
          <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white" />
        </button>
        {/* <button className="w-12 h-12 sm:w-14 sm:h-14 bg-[#e2e8f0] border-2 sm:border-4 border-[#94a3b8] shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] rounded-xl sm:rounded-2xl flex items-center justify-center active:translate-y-1.5 active:shadow-none transition-all">
          <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-[#1f2937]" />
        </button> */}

        {user && !user.is_anonymous && (
          <div onClick={handleProfileClick} className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 sm:border-4 border-[#94a3b8] shadow-[0_4px_0_#94a3b8] sm:shadow-[0_6px_0_#94a3b8] rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer hover:scale-105 active:translate-y-1.5 active:shadow-none transition-all">
            <div className="absolute top-0 inset-x-0 h-3 bg-white/40 pointer-events-none" />
            <img
              src={
                user.user_metadata?.avatar_url ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>
    </header>
  );
}
