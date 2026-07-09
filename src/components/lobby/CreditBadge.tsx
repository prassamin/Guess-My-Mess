import { Hammer } from "lucide-react";
import Link from "next/link";

export default function CreditBadge() {
  return (
    <div className="w-full flex justify-center lg:justify-start lg:absolute lg:bottom-6 lg:left-6 z-20 pointer-events-none px-4 pb-6 lg:pb-0 shrink-0">
      <Link
        href="https://github.com/prassamin"
        target="_blank"
        className="pointer-events-auto group relative flex items-center justify-center cursor-pointer active:scale-95 active:translate-y-1 transition-all"
      >
        {/* Play Button Style - Violet/Purple Gradient */}
        <div className="absolute inset-0 bg-linear-to-b from-violet-500 to-purple-600 rounded-2xl shadow-[0_4px_0_#5b21b6] group-active:shadow-[0_0px_0_#5b21b6] transition-all" />

        {/* Play Button Style - Top glass highlight */}
        <div className="absolute top-0 inset-x-0 h-3 bg-white/20 rounded-t-2xl pointer-events-none" />

        <div className="relative px-5 py-3 flex items-center gap-3">
          <Hammer className="w-5 h-5 text-white fill-white/20 group-hover:-rotate-12 transition-transform duration-300" />

          <div className="flex flex-col items-start leading-none -mt-0.5">
            <span className="text-[10px] sm:text-[11px] font-black text-white/70 uppercase tracking-widest mb-1">
              Developed By
            </span>
            <span className="text-base sm:text-lg font-black text-white uppercase tracking-widest drop-shadow-sm">
              Prassamin
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
