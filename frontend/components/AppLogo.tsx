'use client';

import React from 'react';
import { Heart } from 'lucide-react';

interface AppLogoProps {
  isDark?: boolean;
  className?: string;
  onClick?: () => void;
}

export default function AppLogo({ isDark = true, className = '', onClick }: AppLogoProps) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="w-8.5 h-8.5 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
        <Heart className="w-4.5 h-4.5 text-white fill-white" />
      </div>
      <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
        DOC<span className="text-blue-500">4</span>U
      </span>
    </div>
  );
}
