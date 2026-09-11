import React, { useState, useEffect } from 'react';
import { Leaf, Sparkles } from 'lucide-react';

interface EcoPageLoaderProps {
  message?: string;
}

const ECO_TIPS = [
  'Recycling 1 ton of paper saves 17 mature trees and 7,000 gallons of water.',
  'Aluminum cans can be melted down and back on store shelves within 60 days.',
  'Diverting plastic from landfills prevents toxic microplastics in waterways.',
  'Connecting to Jaipur Smart Recycling Grid & verification stations...',
  'Computing real-time carbon offsets and community rewards balance...'
];

export const EcoPageLoader: React.FC<EcoPageLoaderProps> = ({ message }) => {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex(prev => (prev + 1) % ECO_TIPS.length);
    }, 1800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md transition-all duration-300">
      <div className="flex flex-col items-center max-w-sm p-6 text-center space-y-4">
        {/* Animated Concentric Eco Rings */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          {/* Outer Pulsing Glow Ring */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/20 animate-ping opacity-50" />
          
          {/* Middle Spinning Dashed Ring */}
          <div className="absolute inset-1 rounded-full border-2 border-dashed border-emerald-500/60 animate-spin [animation-duration:6s]" />

          {/* Inner Counter-Spinning Ring */}
          <div className="absolute inset-3 rounded-full border-2 border-t-emerald-400 border-r-teal-500 border-b-transparent border-l-transparent animate-spin [animation-duration:1.5s]" />

          {/* Center Eco Leaf Emblem */}
          <div className="relative z-10 w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-primary to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
            <Leaf className="h-6 w-6" />
          </div>
        </div>

        {/* Status Text & Message */}
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-mono font-bold text-primary uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5 animate-spin [animation-duration:3s]" />
            <span>{message || 'EcoDrop Network Processing...'}</span>
          </div>
          <p className="text-xs text-muted-foreground transition-all duration-500 min-h-[32px] px-2 italic">
            "{ECO_TIPS[tipIndex]}"
          </p>
        </div>

        {/* Mini progress line */}
        <div className="w-48 h-1 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-primary to-teal-400 animate-indeterminate" />
        </div>
      </div>
    </div>
  );
};

export default EcoPageLoader;
