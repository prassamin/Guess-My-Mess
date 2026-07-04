import { Play } from "lucide-react";
import Logo from "@/components/Logo";

interface LogoBlockProps {
  user: any;
  onPlayClick: () => void;
}

export default function LogoBlock({ user, onPlayClick }: LogoBlockProps) {


  return (
    <div className="flex-1 flex flex-col items-center justify-center relative w-full h-full min-h-50 sm:min-h-62.5 lg:min-h-100 py-6">
      <div className="absolute top-[15%] left-[5%] w-10 h-10 sm:w-16 sm:h-16 bg-[#f87171] border-2 sm:border-4 border-[#991b1b] rounded-full animate-[bounce_4s_infinite] shadow-[0_4px_0_#991b1b] sm:shadow-[0_6px_0_#991b1b]" />
      <div className="absolute bottom-[20%] right-[5%] w-8 h-8 sm:w-12 sm:h-12 bg-[#ffb74d] border-2 sm:border-4 border-[#f57c00] rounded-full animate-[bounce_3s_infinite_reverse] shadow-[0_4px_0_#f57c00] sm:shadow-[0_6px_0_#f57c00]" />
      <div className="absolute top-[30%] right-[10%] w-6 h-6 sm:w-10 sm:h-10 bg-[#4ade80] border-2 sm:border-4 border-[#166534] rounded-full animate-[pulse_2s_infinite] shadow-[0_3px_0_#166534] sm:shadow-[0_6px_0_#166534]" />

      <div className="flex flex-col items-center justify-center mb-10 z-10">
        <Logo size="large" />
      </div>

      {user && !user.is_anonymous && (
        <button
          onClick={onPlayClick}
          className="w-full max-w-sm h-20 sm:h-28 rounded-2xl sm:rounded-3xl bg-[#4ade80] border-2 sm:border-[5px] border-[#166534] shadow-[0_6px_0_#166534] sm:shadow-[0_12px_0_#166534] active:shadow-[0_0px_0_#166534] active:translate-y-2 sm:active:translate-y-3 transition-all flex items-center justify-center overflow-hidden relative group transform rotate-1"
        >
          <div className="absolute top-0 inset-x-0 h-4 sm:h-8 bg-white/30 rounded-t-xl sm:rounded-t-2xl pointer-events-none" />
          <Play className="w-8 h-8 sm:w-12 sm:h-12 text-white fill-white mr-2 sm:mr-4 drop-shadow-[0_2px_0_#1f2937] sm:drop-shadow-[0_4px_0_#1f2937] group-hover:scale-125 transition-transform" />
          <span
            className="font-black text-white text-4xl sm:text-5xl uppercase tracking-widest relative z-10 text-stroke-md sm:text-stroke-logo-sm"
          >
            PLAY
          </span>
        </button>
      )}
    </div>
  );
}
