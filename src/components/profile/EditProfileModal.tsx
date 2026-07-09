import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { revalidateProfile } from "@/actions/profile";
import { useOnClickOutside } from "@/hooks/useOnClickOutside";
import { motion } from "framer-motion";
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
import { X, Shuffle, ChevronLeft, ChevronRight } from "lucide-react";

export default function EditProfileModal({
  profile,
  onClose,
  onSaveSuccess,
}: {
  profile: any;
  onClose: () => void;
  onSaveSuccess: (name: string, avatar: string) => void;
}) {
  const modalRef = useRef<HTMLDivElement>(null);
  useOnClickOutside(modalRef as any, onClose);

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
    setAvatarOptions((prev) => ({
      ...prev,
      seed: Math.random().toString(36).substring(7),
    }));
  }, []);

  useEffect(() => {
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
  }, [avatarOptions]);
  
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
        className="bg-white/95 w-full max-w-2xl rounded-4xl sm:rounded-[2.5rem] border border-white shadow-2xl p-5 sm:p-8 relative flex flex-col backdrop-blur-xl max-h-[95dvh]"
      >
        <button
          onClick={() => onClose()}
          className="absolute -top-3 -right-3 w-10 h-10 sm:w-12 sm:h-12 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-lg hover:scale-105 hover:text-red-500 hover:border-red-200 active:scale-95 text-slate-400 transition-all z-10"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
        </button>

        <h2 className="hidden sm:block text-2xl font-black text-slate-800 uppercase tracking-widest mb-6 text-center">
          Edit Profile
        </h2>

        <div className="flex flex-col md:flex-row gap-6 sm:gap-8 items-start">
          {/* Left: Avatar Preview */}
          <div className="w-full md:w-1/3 flex flex-row md:flex-col items-center justify-center gap-4">
            <div className="w-28 h-28 sm:w-48 sm:h-48 bg-slate-50 rounded-3xl sm:rounded-4xl border border-slate-200 shrink-0 overflow-hidden shadow-inner flex items-center justify-center relative">
              <img
                src={editAvatar}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <button
              onClick={handleRandomizeAvatar}
              className="flex-1 md:w-full bg-linear-to-b from-emerald-400 to-emerald-500 h-12 rounded-xl shadow-[0_4px_0_#047857] text-white font-black uppercase tracking-wider text-xs sm:text-sm active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2 group px-4"
            >
              <Shuffle className="w-4 h-4 group-hover:rotate-12 transition-transform" />
              Randomize
            </button>
          </div>

          {/* Right: Controls */}
          <div className="w-full md:w-2/3 flex flex-col gap-4">
            <div className="w-full mb-0 sm:mb-2">
              <label className="block text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest mb-1.5 sm:mb-2 px-1">
                Display Name
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 sm:px-5 py-2.5 sm:py-3 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-black text-slate-800 focus:outline-none focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-400/20 transition-all placeholder:text-slate-300"
                maxLength={16}
                placeholder="Your Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-2">
              {/* Hair / Headwear */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Hair / Hat
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => cycleOption("top", TOP_OPTIONS, -1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => cycleOption("top", TOP_OPTIONS, 1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Hair Color */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Hair Color
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => cycleOption("hairColor", COLOR_OPTIONS, -1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => cycleOption("hairColor", COLOR_OPTIONS, 1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Accessories */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Glasses
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      cycleOption("accessories", ACCESSORY_OPTIONS, -1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("accessories", ACCESSORY_OPTIONS, 1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Clothes */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Clothing
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      cycleOption("clothing", CLOTHING_OPTIONS, -1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => cycleOption("clothing", CLOTHING_OPTIONS, 1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Skin Color */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Skin Tone
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      cycleOption("skinColor", SKIN_COLOR_OPTIONS, -1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("skinColor", SKIN_COLOR_OPTIONS, 1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Eyes */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Eyes
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => cycleOption("eyes", EYES_OPTIONS, -1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => cycleOption("eyes", EYES_OPTIONS, 1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Mouth */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Mouth
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() => cycleOption("mouth", MOUTH_OPTIONS, -1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => cycleOption("mouth", MOUTH_OPTIONS, 1)}
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>

              {/* Facial Hair */}
              <div className="flex flex-col">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest mb-1.5 px-1 truncate">
                  Facial Hair
                </span>
                <div className="flex items-center gap-1 sm:gap-2">
                  <button
                    onClick={() =>
                      cycleOption("facialHair", FACIAL_HAIR_OPTIONS, -1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() =>
                      cycleOption("facialHair", FACIAL_HAIR_OPTIONS, 1)
                    }
                    className="flex-1 h-8 sm:h-10 bg-white border border-slate-200 rounded-lg sm:rounded-xl shadow-sm hover:border-slate-300 hover:bg-slate-50 active:scale-95 text-slate-600 flex items-center justify-center transition-all"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full mt-4 sm:mt-6 h-14 sm:h-16 bg-linear-to-b from-sky-400 to-sky-500 rounded-xl sm:rounded-2xl shadow-[0_4px_0_#0369a1] active:translate-y-1 active:shadow-none text-white text-lg sm:text-xl font-black uppercase disabled:opacity-50 transition-all flex items-center justify-center relative overflow-hidden group shrink-0 mb-2"
            >
              <div className="absolute top-0 inset-x-0 h-4 bg-white/20 rounded-t-xl sm:rounded-t-2xl pointer-events-none" />
              <span>
                {isSaving ? "Saving..." : "Save Changes"}
              </span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
