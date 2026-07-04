"use client";

import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import SkyBackground from "@/components/SkyBackground";

import MatchCard from "@/components/profile/MatchCard";
import MatchDetailsPopup from "@/components/profile/MatchDetailsPopup";
import EditProfileModal from "@/components/profile/EditProfileModal";
import { useRouter } from "@bprogress/next";

export default function ProfileView({ 
  initialProfile, 
  initialMatches, 
  isOwnProfile: initialIsOwnProfile 
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
    totalPoints: initialMatches?.reduce((acc, match) => acc + (match.score || 0), 0) || 0,
  });
  const [matches] = useState<any[]>(initialMatches);
  const isOwnProfile = initialIsOwnProfile;

  const textStroke = {
    textShadow:
      "-2px -2px 0 #1f2937, 2px -2px 0 #1f2937, -2px 2px 0 #1f2937, 2px 2px 0 #1f2937, 0 4px 0 #1f2937",
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <SkyBackground />
        <div className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border-2 sm:border-[6px] border-[#0f172a] shadow-[0_6px_0_#0f172a] sm:shadow-[0_12px_0_#0f172a] relative z-10 text-center max-w-md w-full mx-4">
          <h1
            className="text-3xl sm:text-4xl font-black text-[#f87171] uppercase tracking-widest mb-4"
            style={textStroke}
          >
            <span className="text-white">Player Not Found</span>
          </h1>
          <button
            onClick={() => router.push("/")}
            className="w-full h-12 sm:h-16 bg-[#60a5fa] border-2 sm:border-4 border-[#1d4ed8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-xl sm:text-2xl font-black text-white uppercase tracking-widest relative overflow-hidden"
          >
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
          className="h-10 sm:h-14 px-4 sm:px-8 bg-[#fbbf24] border-2 sm:border-[6px] border-[#b45309] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#b45309] sm:shadow-[0_6px_0_#b45309] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-lg sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden group"
        >
          <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-lg pointer-events-none" />
          <span className="transform group-hover:-translate-x-1 transition-transform mr-2">
            &larr;
          </span>
          <span style={textStroke}>Home</span>
        </button>

        {isOwnProfile && (
          <button
            onClick={() => setIsEditing(true)}
            className="h-10 sm:h-14 px-4 sm:px-8 bg-[#60a5fa] border-2 sm:border-[6px] border-[#1d4ed8] rounded-xl sm:rounded-2xl shadow-[0_4px_0_#1d4ed8] sm:shadow-[0_6px_0_#1d4ed8] active:translate-y-1.5 active:shadow-none transition-all flex items-center justify-center text-lg sm:text-xl font-black text-white uppercase tracking-widest relative overflow-hidden"
          >
            <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-lg pointer-events-none" />
            <span style={textStroke}>Edit Profile ✏️</span>
          </button>
        )}
      </div>

      <div className="w-full max-w-5xl px-4 relative z-10 mt-2 flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Player Identity & Stats */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Profile Card */}
          <div className="bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border-2 sm:border-[6px] border-[#0f172a] shadow-[0_6px_0_#0f172a] sm:shadow-[0_12px_0_#0f172a] flex flex-col items-center relative overflow-hidden group">
            {/* Background Pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 2px 2px, #1f2937 1px, transparent 0)",
                backgroundSize: "16px 16px",
              }}
            ></div>

            <div className="w-24 h-24 sm:w-40 sm:h-40 bg-[#f8fafc] rounded-full border-4 sm:border-8 border-[#94a3b8] shrink-0 overflow-hidden shadow-[0_4px_0_#94a3b8] sm:shadow-[0_8px_0_#94a3b8] flex items-center justify-center relative mb-4 sm:mb-6 transform group-hover:scale-105 transition-transform duration-300">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="text-7xl">👤</div>
                  <div className="absolute inset-0 shadow-[inset_0_8px_16px_rgba(0,0,0,0.1)] pointer-events-none rounded-full"></div>
                </>
              )}
            </div>
            <div className="text-center w-full relative z-10">
              <h1 className="text-2xl sm:text-4xl font-black text-[#1f2937] tracking-tight uppercase mb-2 sm:mb-3 wrap-break-word leading-tight">
                {profile.name}
              </h1>
              <div className="inline-flex items-center justify-center bg-[#f1f5f9] px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl border-2 sm:border-4 border-[#cbd5e1] shadow-inner">
                <span className="text-[#64748b] font-black text-sm sm:text-xl tracking-wider">
                  @{profile.username}
                </span>
              </div>
            </div>
          </div>

          {/* Stats Column */}
          <div className="flex flex-col gap-4">
            <div className="bg-[#a78bfa] p-4 sm:p-6 rounded-2xl sm:rounded-4xl border-2 sm:border-[6px] border-[#5b21b6] shadow-[0_4px_0_#5b21b6] sm:shadow-[0_8px_0_#5b21b6] flex flex-row items-center justify-between transform transition-transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-xl pointer-events-none" />
              <span
                className="text-white font-black text-lg sm:text-2xl uppercase tracking-widest"
                style={textStroke}
              >
                Played
              </span>
              <span
                className="text-white text-3xl sm:text-5xl font-black"
                style={textStroke}
              >
                {stats.gamesPlayed}
              </span>
            </div>
            <div className="bg-[#34d399] p-4 sm:p-6 rounded-2xl sm:rounded-4xl border-2 sm:border-[6px] border-[#047857] shadow-[0_4px_0_#047857] sm:shadow-[0_8px_0_#047857] flex flex-row items-center justify-between transform transition-transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-xl pointer-events-none" />
              <span
                className="text-white font-black text-lg sm:text-2xl uppercase tracking-widest"
                style={textStroke}
              >
                Points
              </span>
              <span
                className="text-white text-3xl sm:text-5xl font-black"
                style={textStroke}
              >
                {stats.totalPoints}
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Match History */}
        <div className="w-full lg:w-2/3 bg-white p-4 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border-2 sm:border-[6px] border-[#0f172a] shadow-[0_6px_0_#0f172a] sm:shadow-[0_12px_0_#0f172a] relative overflow-hidden flex flex-col h-[60dvh] lg:h-[75dvh]">
          {/* Decorative Background Pattern */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(#1f2937 2px, transparent 2px)",
              backgroundSize: "24px 24px",
            }}
          ></div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 pb-2 sm:pb-4 border-b-2 sm:border-b-4 border-dashed border-[#e2e8f0] relative z-10 gap-2 sm:gap-4">
            <h2 className="text-2xl sm:text-4xl font-black text-[#1f2937] uppercase tracking-widest flex items-center gap-2 sm:gap-3">
              Match History
            </h2>
          </div>

          <div className="flex-1 min-h-0 relative z-10">
            <div className="absolute inset-0 overflow-y-auto pr-2 pb-4 custom-scrollbar space-y-4">
              {matches.length === 0 ? (
                <div className="text-center p-12 bg-white rounded-3xl border-4 border-dashed border-[#cbd5e1] flex flex-col items-center justify-center gap-4 h-full my-auto">
                  <div className="w-24 h-24 bg-[#f1f5f9] rounded-full flex items-center justify-center text-5xl border-4 border-[#e2e8f0] mb-2">
                    🏜️
                  </div>
                  <p className="text-[#1f2937] font-black text-2xl uppercase tracking-widest">
                    No matches yet
                  </p>
                  <p className="text-[#64748b] font-bold text-lg">
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

      {/* Edit Profile Dialog - AVATAR PLAYGROUND */}
      <EditProfileModal
        profile={profile}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSaveSuccess={(name, avatar) => {
          setProfile({ ...profile, name, avatar });
          setIsEditing(false);
        }}
      />
      {/* Match Details Popup */}
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailsPopup
            match={selectedMatch}
            currentUsername={profile.username}
            onClose={() => setSelectedMatch(null)}
          />
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
          border: 2px solid #cbd5e1;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #1f2937;
          border-radius: 8px;
          border: 2px solid #f1f5f9;
        }
      `,
        }}
      />
    </div>
  );
}
