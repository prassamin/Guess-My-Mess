import { LogOut } from "lucide-react";
import { useRouter } from "@bprogress/next";
import Logo from "@/components/Logo";

export default function TopBar() {
  const router = useRouter();

  return (
    <header className="bg-[#60a5fa] border-y-4 lg:border-4 border-[#1e3a8a] border-x-0 lg:border-x-4 rounded-none lg:rounded-4xl p-2 sm:p-3 px-3 sm:px-6 flex flex-col sm:flex-row justify-between items-center shadow-none lg:shadow-[0_10px_0_#1e3a8a] relative z-10 gap-3 sm:gap-0">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#fff_2px,transparent_2px)] bg-size-[16px_16px] rounded-none lg:rounded-4xl" />

      {/* Top reflection highlight */}
      <div className="absolute inset-x-2 top-2 h-4 sm:h-6 bg-linear-to-b from-white/40 to-transparent rounded-t-3xl pointer-events-none" />

      {/* LEFT: Logo / Branding */}
      <div className="flex items-center w-full sm:w-1/3 justify-center sm:justify-start relative z-10">
        <Logo
          size="small"
          onClick={() => router.push("/")}
          className="sm:items-start"
        />
      </div>

      {/* RIGHT: User Profile & Leave Button */}
      <div className="items-center justify-end space-x-3 w-full sm:w-1/3 relative z-10 hidden sm:flex">
        <button
          onClick={() => router.push("/")}
          className="relative shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#f87171] border-[3px] border-[#991b1b] shadow-[0_4px_0_#991b1b] active:shadow-[0_0px_0_#991b1b] active:translate-y-1 transition-all flex items-center justify-center overflow-hidden group"
          title="Leave Room"
        >
          <div className="absolute top-0 left-0 right-0 h-4 bg-white/30 rounded-t-xl pointer-events-none" />
          <LogOut
            className="w-5 h-5 sm:w-6 sm:h-6 text-white drop-shadow-[0_2px_0_#1f2937] group-hover:-translate-x-1 transition-transform"
            strokeWidth={3}
          />
        </button>
      </div>
    </header>
  );
}
