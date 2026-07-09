"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SkyBackground from "@/components/SkyBackground";

import MatchCard from "@/components/profile/MatchCard";
import MatchDetailsPopup from "@/components/profile/MatchDetailsPopup";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useRouter } from "@bprogress/next";
import { ArrowLeft, Edit3, Trophy, Gamepad2 } from "lucide-react";

export default function ProfileView({
  initialProfile,
  initialMatches,
  isOwnProfile: initialIsOwnProfile,
}: {
  username: string;
  initialProfile: any;
  initialMatches: any[];
  isOwnProfile: boolean;
}) {
  const router = useRouter();

  const [profile, setProfile] = useState<any>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);

  // Edit State
  const [stats] = useState({
    gamesPlayed: initialMatches?.length || 0,
    totalPoints:
      initialMatches?.reduce((acc, match) => acc + (match.score || 0), 0) || 0,
  });
  const [matches] = useState<any[]>(initialMatches);
  const isOwnProfile = initialIsOwnProfile;

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <SkyBackground />
        <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative z-10 text-center max-w-md w-full mx-4">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-widest mb-6">
            Player Not Found
          </h1>
          <button
            onClick={() => router.push("/")}
            className="w-full h-16 bg-linear-to-b from-amber-400 to-amber-500 shadow-[0_4px_0_#d97706] rounded-2xl active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group"
          >
            <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center relative overflow-x-hidden overflow-y-auto pb-20">
      <SkyBackground />

      {/* Header */}
      <div className="w-full p-4 sm:p-6 flex justify-between items-center relative z-10 max-w-5xl mx-auto mt-2">
        <button
          onClick={() => router.push("/")}
          className="h-12 sm:h-14 px-5 sm:px-6 bg-linear-to-b from-slate-50 to-slate-200 border border-slate-300 shadow-[0_4px_0_#cbd5e1] rounded-2xl active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-slate-700 font-bold uppercase tracking-widest relative overflow-hidden group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          Home
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(true)}
            className="h-12 sm:h-14 px-5 sm:px-6 bg-linear-to-b from-sky-400 to-sky-500 shadow-[0_4px_0_#0369a1] rounded-2xl active:translate-y-1 active:shadow-none transition-all flex items-center justify-center text-white font-black uppercase tracking-widest relative overflow-hidden group"
          >
            <div className="absolute top-0 inset-x-0 h-3 bg-white/20 rounded-t-xl pointer-events-none" />
            <Edit3 className="w-5 h-5 mr-2" />
            Edit
          </button>
        )}
      </div>

      <div className="w-full max-w-5xl px-4 relative z-10 mt-4 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Player Identity & Stats */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] flex flex-col items-center relative overflow-hidden group">
            <div className="w-32 h-32 sm:w-40 sm:h-40 bg-slate-50 rounded-full shadow-[0_0_0_4px_white,0_8px_24px_rgba(0,0,0,0.1)] shrink-0 overflow-hidden flex items-center justify-center relative mb-6 transform group-hover:scale-105 transition-transform duration-500 object-cover">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-6xl">👤</div>
              )}
            </div>
            <div className="text-center w-full relative z-10">
              <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-widest uppercase mb-3 wrap-break-word leading-tight">
                {profile.name}
              </h1>
              <div className="inline-flex items-center justify-center bg-amber-50 px-4 py-2 rounded-xl border border-amber-100">
                <span className="text-amber-600 font-bold text-sm sm:text-base tracking-widest">
                  @{profile.username}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-4">
            {/* Played Card */}
            <div className="bg-linear-to-b from-violet-400 to-purple-500 p-5 sm:p-6 rounded-4xl shadow-[0_4px_0_#7c3aed] flex flex-row items-center justify-between transform transition-transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Gamepad2 className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 font-black text-sm sm:text-base uppercase tracking-widest drop-shadow-sm">
                  Played
                </span>
              </div>
              <span className="text-white text-3xl sm:text-4xl font-black drop-shadow-md relative z-10">
                {stats.gamesPlayed}
              </span>
            </div>

            {/* Points Card */}
            <div className="bg-linear-to-b from-emerald-400 to-teal-500 p-5 sm:p-6 rounded-4xl shadow-[0_4px_0_#059669] flex flex-row items-center justify-between transform transition-transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-2xl pointer-events-none" />
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/30">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <span className="text-white/90 font-black text-sm sm:text-base uppercase tracking-widest drop-shadow-sm">
                  Points
                </span>
              </div>
              <span className="text-white text-3xl sm:text-4xl font-black drop-shadow-md relative z-10">
                {stats.totalPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Match History */}
        <div className="w-full lg:w-2/3 bg-white/95 backdrop-blur-xl p-6 sm:p-8 rounded-[2.5rem] border border-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col h-[80dvh] lg:h-[75dvh]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b-2 border-slate-100 relative z-10 gap-4">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
              Match History
            </h2>
          </div>

          <div className="flex-1 min-h-0 relative z-10">
            <div className="absolute inset-0 overflow-y-auto pr-3 pb-4 custom-scrollbar space-y-4">
              {matches.length === 0 ? (
                <div className="text-center p-12 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4 h-full my-auto">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl shadow-sm mb-2">
                    🏜️
                  </div>
                  <p className="text-slate-600 font-black text-xl uppercase tracking-widest">
                    No matches yet
                  </p>
                  <p className="text-slate-400 font-bold text-sm">
                    Start drawing to build your legacy!
                  </p>
                </div>
              ) : (
                matches.map((match: any, idx: number) => (
                  <MatchCard
                    key={idx}
                    match={match}
                    onSelect={() => setSelectedMatch(match)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isEditing && (
          <EditProfileModal
            profile={profile}
            onClose={() => setIsEditing(false)}
            onSaveSuccess={(name, avatar) => {
              setProfile({ ...profile, name, avatar });
              setIsEditing(false);
            }}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailsPopup
            match={selectedMatch}
            currentUsername={profile.username}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
