
import React from 'react';

export const AkafliegLogo: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
      {/* Background Wing Shape */}
      <path 
        d="M10 80 L50 20 L90 80 L75 80 L50 45 L25 80 Z" 
        fill="white" 
      />
      {/* Red Accent (Vertical Stabilizer/Stylized A) */}
      <path 
        d="M50 20 L65 80 L55 80 L50 45 L45 80 L35 80 Z" 
        fill="#ef4444" 
      />
      {/* Flight Path Arc */}
      <path 
        d="M20 90 Q50 70 80 90" 
        fill="none" 
        stroke="#ef4444" 
        strokeWidth="3" 
        strokeLinecap="round" 
      />
    </svg>
    <div className="flex flex-col leading-none">
      <span className="text-white font-black tracking-tighter text-xl uppercase italic">Akaflieg</span>
      <span className="text-red-500 font-bold tracking-[0.3em] text-[10px] uppercase">Graz</span>
    </div>
  </div>
);
