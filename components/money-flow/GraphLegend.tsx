'use client';

import React from 'react';
import { Layers, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';

export const GraphLegend: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 text-[11px] text-slate-300 backdrop-blur-md flex flex-wrap items-center gap-4 shadow-lg">
      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-500/30" />
        <span className="font-semibold text-slate-200">Root Account</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded bg-slate-800 border border-slate-600" />
        <span className="text-slate-300">Connected Account</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded bg-purple-900/60 border border-purple-500/40" />
        <span className="text-slate-300">Cash / ATM WDL</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-4 h-0.5 bg-emerald-400 relative inline-block">
          <span className="absolute right-0 -top-1 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-l-4 border-l-emerald-400" />
        </span>
        <span className="text-slate-300">Money Flow (Out/In)</span>
      </div>

      <div className="flex items-center space-x-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-amber-300 font-medium">Active Multi-Hop Trail</span>
      </div>
    </div>
  );
};
