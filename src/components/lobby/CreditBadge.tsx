import { Code2, Hammer } from "lucide-react";
import Link from "next/link";

export default function CreditBadge() {
  return (
    <div className="w-full flex justify-center lg:justify-start lg:absolute lg:bottom-6 lg:left-6 z-20 pointer-events-none px-4 pb-6 lg:pb-0 shrink-0">
      <Link
        href="https://github.com/prassamin"
        target="_blank"
        className="pointer-events-auto group relative flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
      >
        {/* Main Plaque Background */}
        <div className="absolute inset-0 bg-[#fbbf24] border-4 border-[#78350f] rounded-xl shadow-[0_6px_0_#78350f] transition-all group-hover:bg-[#f59e0b] group-active:shadow-[0_2px_0_#78350f] group-active:translate-y-1" />
        
        {/* Inner Plaque Highlight for 3D effect */}
        <div className="absolute top-1 inset-x-1 h-3 bg-white/30 rounded-t-lg pointer-events-none" />

        <div className="relative px-6 py-2.5 flex items-center gap-3">
          {/* Left Icon Block */}
          <div className="w-8 h-8 rounded-lg bg-[#78350f] flex items-center justify-center border-2 border-[#f59e0b] shadow-inner transform -rotate-6 group-hover:rotate-0 transition-transform">
            <Hammer className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />
          </div>

          {/* Text Content */}
          <div className="flex flex-col items-start leading-none -mt-0.5">
            <span className="text-[10px] sm:text-xs font-bold text-[#78350f] uppercase tracking-widest opacity-80">
              Developed By
            </span>
            <span 
              className="text-sm sm:text-base font-black text-white uppercase tracking-widest"
              style={{ WebkitTextStroke: "1px #78350f" }}
            >
              Prassamin
            </span>
          </div>

          {/* Right Decorator */}
          <div className="absolute -right-2 -top-2 w-6 h-6 bg-[#ef4444] border-[3px] border-[#7f1d1d] rounded-full shadow-[0_2px_0_#7f1d1d] flex items-center justify-center z-10 animate-pulse">
            <Code2 className="w-3 h-3 text-white stroke-3" />
          </div>
        </div>
      </Link>
    </div>
  );
}
