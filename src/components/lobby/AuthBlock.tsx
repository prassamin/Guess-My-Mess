import { createOAuth } from "@/lib/supabase/auth";
import { supabase } from "@/lib/supabase/client";
import { useAppStore } from "@/store/app-store";
import { Loader2, LogOut, Dices, Play } from "lucide-react";
import { useState } from "react";

interface AuthBlockProps {
  name: string;
  setName: (name: string) => void;
  avatarSeed: string;
  setAvatarSeed: (seed: string) => void;
  handlePlay: () => void;
  guestLoading: boolean;
  user: any;
}

export default function AuthBlock({
  name,
  setName,
  avatarSeed,
  setAvatarSeed,
  handlePlay,
  guestLoading,
  user,
}: AuthBlockProps) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const { setUser } = useAppStore();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("draw_guest_user");
    setUser(null);
    setName("");
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  return (
    <div className="w-full max-w-[92vw] sm:max-w-sm md:max-w-md lg:w-105 p-6 sm:p-8 flex flex-col relative mx-auto bg-white/95 backdrop-blur-xl border border-white/80 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.05)]">
      <h2 className="font-black text-2xl sm:text-3xl text-center uppercase tracking-widest mb-6 text-slate-800">
        {user && !user.is_anonymous ? "Your Profile" : "Join Game"}
      </h2>

      {user && !user.is_anonymous ? (
        <div className="flex-1 flex flex-col relative z-10">
          <div className="flex flex-col items-center p-6 mb-8 text-center bg-slate-50/50 rounded-3xl border border-slate-100">
            <img
              src={
                user.avatar ||
                user.user_metadata?.avatar_url ||
                "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"
              }
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full shadow-md bg-white mb-4 object-cover"
            />
            <p className="text-slate-800 font-black text-xl sm:text-2xl uppercase tracking-wide truncate w-full px-2">
              {user.user_metadata?.full_name || "Guest Player"}
            </p>
          </div>

          <div className="mt-auto flex flex-col gap-3">
            <button
              onClick={handleLogout}
              className="relative w-full h-12 sm:h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-bold text-sm uppercase tracking-widest transition-all flex items-center justify-center border border-slate-200 active:scale-95"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center space-y-6 relative z-10">
          <div className="flex flex-col items-center w-full">
            {/* Centered Avatar with overlapping Reroll button */}
            <div className="relative mb-6">
              <img
                alt={avatarSeed}
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`}
                className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-[0_0_0_4px_white,0_4px_12px_rgba(0,0,0,0.1)] object-cover"
              />
              <button
                onClick={() =>
                  setAvatarSeed(Math.random().toString(36).substring(7))
                }
                className="absolute bottom-0 right-0 w-8 h-8 sm:w-10 sm:h-10 bg-white border border-slate-200 rounded-full shadow-md flex items-center justify-center text-slate-500 hover:text-amber-500 hover:border-amber-300 hover:shadow-lg active:scale-95 transition-all group"
                title="Reroll Avatar"
              >
                <Dices className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
              </button>
            </div>

            <input
              type="text"
              placeholder="Enter Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={15}
              className="w-full h-14 sm:h-16 px-6 font-black text-xl sm:text-2xl text-center text-slate-800 uppercase placeholder:text-slate-300 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-amber-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(251,191,36,0.15)] transition-all"
            />
          </div>

          <button
            onClick={handlePlay}
            disabled={guestLoading || googleLoading || !name.trim()}
            className="relative w-full h-14 sm:h-20 rounded-2xl bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-[0_4px_0_#d97706] active:shadow-none active:translate-y-1 transition-all flex items-center justify-center overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed group font-black text-xl sm:text-3xl text-white uppercase tracking-widest"
          >
            {guestLoading ? (
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin" />
            ) : (
              <span className="flex items-center gap-2 sm:gap-3">
                PLAY{" "}
                <Play className="w-5 h-5 sm:w-8 sm:h-8 fill-current group-hover:scale-110 transition-transform" />
              </span>
            )}
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute border-t border-slate-200 w-full"></div>
            <span className="relative bg-white px-4 font-bold text-slate-400 uppercase tracking-widest text-xs">
              Or
            </span>
          </div>

          <button
            onClick={() => {
              const redirectTo = `https://gmm.pras.me/auth/callback?next=/`;
              createOAuth("google", {
                onStarting() {
                  setGoogleLoading(true);
                },
                onError(error) {
                  console.error("Error logging in:", error);
                  setGoogleLoading(false);
                },
                redirectTo,
              });
            }}
            disabled={googleLoading || guestLoading}
            className="relative w-full h-14 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 shadow-sm active:scale-95 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <div className="flex items-center space-x-3">
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              <span className="font-bold text-slate-600 text-xs sm:text-sm tracking-widest uppercase">
                {googleLoading ? "Logging in..." : "Login to save score"}
              </span>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
