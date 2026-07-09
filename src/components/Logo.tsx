import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'small' | 'large';
  onClick?: () => void;
}

export default function Logo({ className = "", size = 'large', onClick }: LogoProps) {
  const isSmall = size === 'small';
  
  const baseLetter = `leading-none font-black transition-transform inline-block ${
    isSmall ? 'hover:scale-125 hover:-translate-y-1' : 'hover:scale-110'
  }`;

  const topRowSize = isSmall ? 'text-2xl sm:text-3xl' : 'text-[60px] min-[400px]:text-7xl md:text-[100px] lg:text-[130px]';
  const bottomRowSize = isSmall ? 'text-xl sm:text-2xl' : 'text-5xl min-[400px]:text-6xl md:text-[80px] lg:text-[110px]';

  const spacingTop = isSmall ? 'space-x-[2px] sm:space-x-1' : 'space-x-1 sm:space-x-3 mb-2';
  const spacingBottom = isSmall ? 'space-x-[2px] sm:space-x-1 mt-1 sm:mt-1' : 'space-x-1 sm:space-x-2 mt-2 sm:mt-4';
  
  const spaceWidth = isSmall ? 'w-1.5 sm:w-2' : 'w-2 sm:w-6 md:w-8';

  return (
    <div 
      className={`flex flex-col items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`flex ${spacingTop} ${isSmall ? 'text-stroke-logo-sm' : 'text-stroke-logo'}`}>
        <span className={`${topRowSize} ${baseLetter} text-[#f87171] transform -rotate-6`}>G</span>
        <span className={`${topRowSize} ${baseLetter} text-[#60a5fa] transform rotate-3`}>U</span>
        <span className={`${topRowSize} ${baseLetter} text-[#4ade80] transform -rotate-3`}>E</span>
        <span className={`${topRowSize} ${baseLetter} text-[#ffb74d] transform rotate-6`}>S</span>
        <span className={`${topRowSize} ${baseLetter} text-[#a855f7] transform -rotate-3`}>S</span>
      </div>
      <div className={`flex ${spacingBottom} ${isSmall ? 'text-stroke-logo-sm' : 'text-stroke-logo'}`}>
        <span className={`${bottomRowSize} ${baseLetter} text-[#f43f5e] transform -rotate-3`}>M</span>
        <span className={`${bottomRowSize} ${baseLetter} text-[#eab308] transform rotate-6`}>Y</span>
        <span className={spaceWidth}></span>
        <span className={`${bottomRowSize} ${baseLetter} text-[#2dd4bf] transform -rotate-6`}>M</span>
        <span className={`${bottomRowSize} ${baseLetter} text-[#3b82f6] transform rotate-3`}>E</span>
        <span className={`${bottomRowSize} ${baseLetter} text-[#f87171] transform -rotate-3`}>S</span>
        <span className={`${bottomRowSize} ${baseLetter} text-[#60a5fa] transform rotate-6`}>S</span>
      </div>
    </div>
  );
}
