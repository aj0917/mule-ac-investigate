'use client';

import React from 'react';
import {
  GitMerge,
  Clock,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { MoneyTrailSummary, MoneyTrailHop } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface MoneyTrailPanelProps {
  summary: MoneyTrailSummary;
  selectedHopIndex?: number;
  onSelectHop: (hop: MoneyTrailHop) => void;
  onSelectNode: (nodeId: string) => void;
}

export const MoneyTrailPanel: React.FC<MoneyTrailPanelProps> = ({
  summary,
  selectedHopIndex,
  onSelectHop,
  onSelectNode,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <GitMerge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Multi-Hop Money Trail</h3>
            <p className="text-[11px] text-slate-400">Chronological flow across connected accounts</p>
          </div>
        </div>

        <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          {summary.hopsCount} {summary.hopsCount === 1 ? 'Hop' : 'Hops'}
        </span>
      </div>

      {/* Cycle Callout if detected */}
      {summary.isCycleDetected && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
          <div className="flex items-center space-x-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Cycle detected in transaction network</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Observed money movement loops back to previously traversed accounts ({(summary.cycleNodes || []).slice(0, 3).join(' → ')}...).
          </p>
        </div>
      )}

      {/* Flow Summary Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
          <span className="text-slate-400">Starting Account</span>
          <button
            onClick={() => onSelectNode(summary.startingAccount)}
            className="font-mono font-bold text-blue-400 hover:underline truncate max-w-[150px]"
          >
            {summary.startingAccount}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
          <span className="text-slate-400">Ending Account / Endpoint</span>
          <button
            onClick={() => onSelectNode(summary.endingAccount)}
            className="font-mono font-bold text-slate-200 hover:underline truncate max-w-[150px]"
          >
            {summary.endingAccount}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs pt-1">
          <div>
            <span className="block text-[10px] uppercase text-slate-500">Initial Hop Amount</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {formatCurrencyINR(summary.originalAmount, true)}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Final Hop Amount</span>
            <span className="font-mono font-bold text-slate-100 text-sm">
              {formatCurrencyINR(summary.finalAmount, true)}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Observed Time Span</span>
            <span className="font-semibold text-slate-300 flex items-center space-x-1 mt-0.5">
              <Clock className="w-3 h-3 text-blue-400" />
              <span>{summary.timeSpanFormatted}</span>
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Amount Retained %</span>
            <span className="font-bold text-slate-200 mt-0.5 block">{summary.percentageMoved}%</span>
          </div>
        </div>
      </div>

      {/* Step-by-Step Hop List */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
          <span>Sequential Hop Sequence</span>
          <span className="text-[10px] text-slate-500 font-normal">Click hop to highlight</span>
        </h4>

        {summary.hops.length > 0 ? (
          <div className="space-y-2 relative before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {summary.hops.map((hop) => {
              const isSelected = selectedHopIndex === hop.hopIndex;

              return (
                <div
                  key={hop.hopIndex}
                  onClick={() => onSelectHop(hop)}
                  className={`relative pl-8 p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/15 border-blue-500/60 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Circle Marker */}
                  <div
                    className={`absolute left-2 top-3.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400'
                    }`}
                  >
                    {hop.hopIndex}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">
                        HOP {hop.hopIndex}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">{hop.date}</span>
                    </div>

                    {/* From -> To */}
                    <div className="flex items-center space-x-1.5 text-[11px]">
                      <span className="font-mono text-slate-300 truncate max-w-[110px]">{hop.fromLabel}</span>
                      <ArrowRight className="w-3 h-3 text-blue-400 shrink-0" />
                      <span className="font-mono text-slate-100 font-semibold truncate max-w-[110px]">{hop.toLabel}</span>
                    </div>

                    {/* Amount & Channel */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {formatCurrencyINR(hop.amount, false)}
                      </span>
                      <span className="px-1.5 py-0.5 bg-slate-900 text-slate-300 font-bold text-[9px] rounded border border-slate-800">
                        {hop.channel}
                      </span>
                    </div>

                    {/* Time gap indicator */}
                    {hop.timeGapMinutes !== undefined && (
                      <div className="text-[10px] text-slate-500 italic flex items-center space-x-1">
                        <Clock className="w-2.5 h-2.5 text-slate-500" />
                        <span>Elapsed since previous: ~{hop.timeGapMinutes} mins</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-950 border border-slate-800 rounded-xl">
            Select a root account to compute multi-hop money flow.
          </div>
        )}
      </div>
    </div>
  );
};
