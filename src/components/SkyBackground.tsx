"use client";

const SoftCloud = ({ 
  opacity = 1, 
  scale = 1, 
  delay = '0s', 
  duration = '60s', 
  top = '10%' 
}: { 
  opacity?: number, 
  scale?: number, 
  delay?: string, 
  duration?: string, 
  top?: string 
}) => (
  <div 
    className="absolute will-change-[left]"
    style={{ 
      top,
      opacity,
      transform: `scale(${scale})`,
      animation: `drift ${duration} linear infinite`,
      animationDelay: delay,
      width: '400px', 
      height: '150px' 
    }}
  >
    {/* Realistic soft volumetric layers using heavy blurs */}
    <div className="absolute bottom-[10%] left-[5%] w-[90%] h-[50%] bg-white/80 blur-lg rounded-full" />
    <div className="absolute bottom-[20%] left-[15%] w-[35%] h-[90%] bg-white/95 blur-xl rounded-full" />
    <div className="absolute bottom-[20%] left-[35%] w-[45%] h-[120%] bg-white blur-[32px] rounded-full" />
    <div className="absolute bottom-[15%] right-[15%] w-[30%] h-[80%] bg-white/90 blur-[20px] rounded-full" />
  </div>
);

export default function SkyBackground() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-linear-to-b from-[#0ea5e9] via-[#38bdf8] to-[#bae6fd] pointer-events-none">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes drift {
          0% { left: 100%; }
          100% { left: -600px; }
        }
      `}} />
      
      {/* 
        Using much longer durations (100s - 250s) for a realistic, gentle drift. 
        Negative delays ensure they are already seamlessly scattered across the screen on load.
      */}
      <SoftCloud top="5%" scale={1.2} opacity={0.9} duration="140s" delay="-30s" />
      <SoftCloud top="20%" scale={0.7} opacity={0.6} duration="180s" delay="-90s" />
      <SoftCloud top="40%" scale={1.5} opacity={1} duration="200s" delay="-150s" />
      <SoftCloud top="60%" scale={0.8} opacity={0.5} duration="160s" delay="-10s" />
      <SoftCloud top="75%" scale={1.1} opacity={0.8} duration="150s" delay="-80s" />
      
      {/* A few extra tiny clouds in the far distance */}
      <SoftCloud top="15%" scale={0.4} opacity={0.4} duration="250s" delay="-120s" />
      <SoftCloud top="50%" scale={0.5} opacity={0.3} duration="220s" delay="-200s" />
      <SoftCloud top="85%" scale={0.6} opacity={0.5} duration="190s" delay="-60s" />
    </div>
  );
}
