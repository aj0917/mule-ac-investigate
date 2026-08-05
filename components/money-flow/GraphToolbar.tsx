'use client';

import React, { useState } from 'react';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Filter,
  Layers,
  RotateCcw,
  Maximize2,
  GitMerge,
  Sparkles,
} from 'lucide-react';
import { TraceDirection, GraphLayoutType } from '@/types/investigation';

interface GraphToolbarProps {
  rootQuery: string;
  direction: TraceDirection;
  maxDepth: number;
  layout: GraphLayoutType;
  activeFilterCount: number;
  onSearch: (q: string) => void;
  onChangeDirection: (dir: TraceDirection) => void;
  onChangeDepth: (depth: number) => void;
  onChangeLayout: (layout: GraphLayoutType) => void;
  onResetGraph: () => void;
  onOpenFilters: () => void;
}

export const GraphToolbar: React.FC<GraphToolbarProps> = ({
  rootQuery,
  direction,
  maxDepth,
  layout,
  activeFilterCount,
  onSearch,
  onChangeDirection,
  onChangeDepth,
  onChangeLayout,
  onResetGraph,
  onOpenFilters,
}) => {
  const [inputVal, setInputVal] = useState(rootQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputVal);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-blue-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Start investigation from Account, UTR, UPI ID or Transaction ID..."
            className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 focus:border-blue-500 rounded-xl pl-10 pr-24 py-2 text-xs text-slate-100 placeholder-slate-500 font-medium focus:outline-none transition-colors"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-bold rounded-lg transition-colors"
          >
            Trace Root
          </button>
        </form>

        {/* Direction Actions */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onChangeDirection('FORWARD')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 ${
              direction === 'FORWARD'
                ? 'bg-blue-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Trace Forward</span>
          </button>

          <button
            onClick={() => onChangeDirection('BACKWARD')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors flex items-center space-x-1 ${
              direction === 'BACKWARD'
                ? 'bg-purple-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Trace Backward</span>
          </button>

          <button
            onClick={() => onChangeDirection('BOTH')}
            className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition-colors ${
              direction === 'BOTH'
                ? 'bg-slate-800 text-slate-100 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Both Directions
          </button>
        </div>

        {/* Hop Depth Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[10px] font-bold text-slate-500 uppercase px-2">Hops:</span>
          {[1, 2, 3, 5, 10].map((d) => (
            <button
              key={d}
              onClick={() => onChangeDepth(d)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                maxDepth === d ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
        {/* Layout Switcher */}
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Layout:</span>
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['FLOW', 'NETWORK', 'TIMELINE'] as const).map((l) => (
              <button
                key={l}
                onClick={() => onChangeLayout(l)}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${
                  layout === l ? 'bg-slate-800 text-blue-400 border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {l === 'FLOW' ? 'Flow Graph' : l === 'NETWORK' ? 'Radial Network' : 'Chronological Timeline'}
              </button>
            ))}
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenFilters}
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center space-x-1.5"
          >
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={onResetGraph}
            title="Reset Graph View"
            className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-semibold text-xs transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View</span>
          </button>
        </div>
      </div>
    </div>
  );
};
