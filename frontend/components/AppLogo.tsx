'use client';

import React from 'react';
import { Stethoscope } from 'lucide-react';

interface AppLogoProps {
  isDark?: boolean;
  className?: string;
  onClick?: () => void;
  accentColor?: 'blue' | 'emerald' | 'purple';
}

export default function AppLogo({
  isDark = true,
  className = '',
  onClick,
  accentColor = 'blue',
}: AppLogoProps) {
  const accentClasses = {
    blue: 'bg-gradient-to-tr from-blue-600 to-sky-500 shadow-blue-500/25',
    emerald: 'bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-emerald-500/25',
    purple: 'bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-purple-500/25',
  }[accentColor];

  const textAccent = {
    blue: 'text-blue-500',
    emerald: 'text-emerald-500',
    purple: 'text-purple-400',
  }[accentColor];

  return (
    <div
      onClick={onClick}
      className={`group flex items-center gap-2.5 select-none transition-transform duration-200 active:scale-95 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      <div
        className={`w-9 h-9 rounded-xl ${accentClasses} flex items-center justify-center shadow-lg transition-transform duration-200 group-hover:scale-105 shrink-0`}
      >
        <Stethoscope className="w-5 h-5 text-white stroke-[2.2]" />
      </div>
      <div className="flex flex-col">
        <span
          className={`text-lg font-black tracking-tight leading-tight transition-colors ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}
        >
          DOC<span className={textAccent}>4</span>U
        </span>
        <span className="text-[9px] font-bold tracking-widest uppercase text-zinc-500 -mt-0.5">
          Care Portal
        </span>
      </div>
    </div>
  );
}
