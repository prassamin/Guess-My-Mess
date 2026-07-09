import { Play } from "lucide-react";
import Logo from "@/components/Logo";

interface LogoBlockProps {
  user: any;
  onPlayClick: () => void;
}

export default function LogoBlock({ user, onPlayClick }: LogoBlockProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-50 sm:min-h-62.5 lg:min-h-100 py-6">
      {/* Decorative bouncing dots styled like the logo (bordered and shadowed) */}
      <div className="absolute top-[15%] left-[5%] w-10 h-10 sm:w-16 sm:h-16 bg-[#ff6b6b] border-[3px] sm:border-4 border-[#1f2937] rounded-full animate-[bounce_4s_infinite] shadow-[0_4px_0_#1f2937] pointer-events-none not-md:hidden" />
      <div className="absolute bottom-[20%] right-[5%] w-8 h-8 sm:w-12 sm:h-12 bg-[#fca311] border-[3px] sm:border-4 border-[#1f2937] rounded-full animate-[bounce_3s_infinite_reverse] shadow-[0_4px_0_#1f2937] pointer-events-none not-md:hidden" />
      <div className="absolute top-[30%] right-[10%] w-6 h-6 sm:w-10 sm:h-10 bg-[#4ecdc4] border-[3px] sm:border-4 border-[#1f2937] rounded-full animate-[pulse_2s_infinite] shadow-[0_4px_0_#1f2937] pointer-events-none not-md:hidden" />

      <div className="flex flex-col items-center justify-center mb-10 z-10 w-full max-w-lg">
        <Logo size="large" />
      </div>

      {user && !user.is_anonymous && (
        <button
          onClick={onPlayClick}
          className="w-full max-w-xs sm:max-w-sm h-16 sm:h-24 rounded-3xl md:rounded-4xl bg-linear-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 shadow-[0_6px_0_#d97706] active:shadow-none active:translate-y-1.5 transition-all flex items-center justify-center overflow-hidden relative group transform hover:scale-[1.02]"
        >
          <div className="absolute top-0 inset-x-0 h-4 sm:h-6 bg-white/20 rounded-t-2xl sm:rounded-t-3xl pointer-events-none" />
          <Play className="w-6 h-6 sm:w-12 sm:h-12 text-white fill-white mr-2 sm:mr-4 group-hover:scale-110 transition-transform" />
          <span className="font-black text-white text-3xl sm:text-5xl uppercase tracking-widest relative z-10">
            PLAY
          </span>
        </button>
      )}
    </div>
  );
}
