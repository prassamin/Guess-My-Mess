import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import { revalidateProfile } from "@/actions/profile";
import {
  TOP_OPTIONS,
  ACCESSORY_OPTIONS,
  CLOTHING_OPTIONS,
  COLOR_OPTIONS,
  EYES_OPTIONS,
  FACIAL_HAIR_OPTIONS,
  MOUTH_OPTIONS,
  SKIN_COLOR_OPTIONS,
} from "@/lib/dicebear";

const textStroke = {
  WebkitTextStroke: "1.5px #1f2937",
  color: "white",
};

export default function EditProfileModal({
  profile,
  isOpen,
  onClose,
  onSaveSuccess,
}: {
  profile: any;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (name: string, avatar: string) => void;
}) {
  const [editName, setEditName] = useState(profile.name || "");
  const [editAvatar, setEditAvatar] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Avatar Playground State
  const [avatarOptions, setAvatarOptions] = useState({
    seed: "123456",
    top: "shortFlat",
    accessories: "none",
    hairColor: "2c1b18",
    clothing: "hoodie",
    skinColor: "ffdbb4",
    eyes: "default",
    mouth: "smile",
    facialHair: "none",
  });

  const cycleOption = (
    type: keyof typeof avatarOptions,
    array: string[],
    direction: number,
  ) => {
    setAvatarOptions((prev) => {
      if (type === "seed") return prev; // Cannot cycle seed

      const currentValue = prev[type];
      const currentIndex = array.indexOf(currentValue);
      let newIndex = currentIndex + direction;

      if (newIndex >= array.length) newIndex = 0;
      if (newIndex < 0) newIndex = array.length - 1;

      return { ...prev, [type]: array[newIndex] };
    });
  };

  const handleRandomizeAvatar = () => {
    const getRandom = (arr: string[]) =>
      arr[Math.floor(Math.random() * arr.length)];
    setAvatarOptions({
      seed: Math.random().toString(36).substring(7),
      top: getRandom(TOP_OPTIONS),
      accessories: getRandom(ACCESSORY_OPTIONS),
      hairColor: getRandom(COLOR_OPTIONS),
      clothing: getRandom(CLOTHING_OPTIONS),
      skinColor: getRandom(SKIN_COLOR_OPTIONS),
      eyes: getRandom(EYES_OPTIONS),
      mouth: getRandom(MOUTH_OPTIONS),
      facialHair: getRandom(FACIAL_HAIR_OPTIONS),
    });
  };

  useEffect(() => {
    if (isOpen) {
      setAvatarOptions((prev) => ({
        ...prev,
        seed: Math.random().toString(36).substring(7),
      }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      let url = `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarOptions.seed}&top=${avatarOptions.top}`;
      if (avatarOptions.accessories === "none")
        url += "&accessoriesProbability=0";
      else
        url += `&accessoriesProbability=100&accessories=${avatarOptions.accessories}`;

      if (avatarOptions.facialHair === "none")
        url += "&facialHairProbability=0";
      else
        url += `&facialHairProbability=100&facialHair=${avatarOptions.facialHair}`;

      url += `&hairColor=${avatarOptions.hairColor}&clothing=${avatarOptions.clothing}&skinColor=${avatarOptions.skinColor}&eyes=${avatarOptions.eyes}&mouth=${avatarOptions.mouth}`;
      setEditAvatar(url);
    }
  }, [avatarOptions, isOpen]);
  const handleSaveProfile = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);

    // Update public profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ name: editName, avatar: editAvatar })
      .eq("id", profile.id);

    if (!profileError) {
      // Update auth metadata
      await supabase.auth.updateUser({
        data: { full_name: editName, avatar_url: editAvatar },
      });

      if (profile?.username) {
        await revalidateProfile(profile.username);
      }

      onSaveSuccess(editName, editAvatar);
    }
    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] border-[6px] border-[#0f172a] shadow-[0_12px_0_#0f172a] p-8 relative flex flex-col">
        <button
          onClick={() => onClose()}
          className="absolute top-4 right-4 w-12 h-12 bg-[#f87171] border-4 border-[#b91c1c] rounded-xl flex items-center justify-center shadow-[0_4px_0_#b91c1c] active:translate-y-1 active:shadow-none text-white transition-colors z-10"
        >
          <svg
            className="w-6 h-6 stroke-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="text-3xl font-black text-[#1f2937] uppercase tracking-widest mb-6 text-center">
          Edit Profile
        </h2>

        <div className="flex flex-col md:flex-row gap-8 items-start">
          {/* Left: Avatar Preview */}
          <div className="w-full md:w-1/3 flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-[#f8fafc] rounded-4xl border-8 border-[#94a3b8] shrink-0 overflow-hidden shadow-[0_8px_0_#94a3b8] flex items-center justify-center relative">
              <img
                src={editAvatar}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 shadow-[inset_0_8px_16px_rgba(0,0,0,0.1)] pointer-events-none rounded-4xl"></div>
            </div>

            <button
              onClick={handleRandomizeAvatar}
              className="w-full bg-[#34d399] px-4 py-3 rounded-xl border-4 border-[#047857] shadow-[0_4px_0_#047857] text-white font-black uppercase tracking-wider text-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5 stroke-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Randomize
            </button>
          </div>

          {/* Right: Controls */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="w-full mb-2">
              <label className="block text-[#64748b] font-black text-sm uppercase tracking-widest mb-2 px-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-5 py-4 bg-[#f8fafc] border-[6px] border-[#94a3b8] rounded-3xl text-2xl font-black text-[#1f2937] shadow-[inset_0_4px_8px_rgba(0,0,0,0.05)] focus:outline-none focus:border-[#60a5fa] focus:ring-4 focus:ring-[#60a5fa]/30 transition-all placeholder:text-[#94a3b8]"
                maxLength={16}
                placeholder="Your Name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {/* Hair / Headwear */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Hair / Hat
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleOption("top", TOP_OPTIONS, -1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => cycleOption("top", TOP_OPTIONS, 1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Hair Color */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Hair Color
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleOption("hairColor", COLOR_OPTIONS, -1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => cycleOption("hairColor", COLOR_OPTIONS, 1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Accessories */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Glasses
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      cycleOption("accessories", ACCESSORY_OPTIONS, -1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("accessories", ACCESSORY_OPTIONS, 1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Clothes */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Clothing
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      cycleOption("clothing", CLOTHING_OPTIONS, -1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => cycleOption("clothing", CLOTHING_OPTIONS, 1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Skin Color */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Skin Tone
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      cycleOption("skinColor", SKIN_COLOR_OPTIONS, -1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("skinColor", SKIN_COLOR_OPTIONS, 1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Eyes */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Eyes
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleOption("eyes", EYES_OPTIONS, -1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => cycleOption("eyes", EYES_OPTIONS, 1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Mouth */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Mouth
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => cycleOption("mouth", MOUTH_OPTIONS, -1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => cycleOption("mouth", MOUTH_OPTIONS, 1)}
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Facial Hair */}
              <div className="flex flex-col">
                <span className="text-[#64748b] font-black text-sm uppercase tracking-widest mb-1.5 px-1">
                  Facial Hair
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      cycleOption("facialHair", FACIAL_HAIR_OPTIONS, -1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("facialHair", FACIAL_HAIR_OPTIONS, 1)
                    }
                    className="flex-1 h-12 bg-white border-4 border-[#94a3b8] rounded-xl shadow-[0_4px_0_#94a3b8] active:translate-y-1 active:shadow-none text-[#1f2937] font-black hover:bg-gray-50 transition-colors flex items-center justify-center"
                  >
                    <svg
                      className="w-6 h-6 stroke-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full mt-6 bg-[#fbbf24] border-[6px] border-[#b45309] rounded-3xl shadow-[0_8px_0_#b45309] active:translate-y-2 active:shadow-none py-5 text-white text-3xl font-black uppercase disabled:opacity-50 transition-all flex items-center justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 inset-x-0 h-4 bg-white/30 rounded-t-lg pointer-events-none" />
              <span style={textStroke}>
                {isSaving ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
