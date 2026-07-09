"use client";

import { useRouter } from "@bprogress/next";
import { Trophy } from "lucide-react";

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
      <div className="flex gap-3 sm:gap-4 items-center">
        {/* Leaderboard Button */}
        <button 
          onClick={() => router.push("/leaderboard")}
          className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-b from-amber-400 to-amber-500 shadow-[0_4px_0_#d97706] rounded-xl sm:rounded-2xl flex items-center justify-center active:translate-y-1 active:shadow-none transition-all relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-2 bg-white/20 rounded-t-lg pointer-events-none" />
          <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white fill-white group-hover:scale-110 transition-transform" />
        </button>

        {/* Profile Avatar */}
        {user && !user.is_anonymous && (
          <button 
            onClick={handleProfileClick} 
            className="w-12 h-12 sm:w-14 sm:h-14 bg-white border-2 border-slate-200 shadow-[0_4px_0_#cbd5e1] rounded-xl sm:rounded-2xl flex items-center justify-center relative overflow-hidden cursor-pointer hover:scale-105 active:translate-y-1 active:shadow-none transition-all"
          >
            <div className="absolute top-0 inset-x-0 h-2 bg-white/40 pointer-events-none z-10" />
            <img
              src={
                user.avatar ||
                user.user_metadata?.avatar_url ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
              }
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        )}
      </div>
    </header>
  );
}
