'use client';

import React from 'react';
import {
  Zap,
  Clock,
  ArrowRight,
  RotateCcw,
  BarChart2,
  TrendingDown,
  Info,
  ChevronRight,
} from 'lucide-react';
import { Transaction } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { calculateVelocityAnalysis } from '@/lib/timelineAnalytics';

interface VelocityAnalysisTabProps {
  transactions: Transaction[];
  selectedAccountId?: string;
  onSelectTxnPair?: (fromTxnId: string, toTxnId: string) => void;
}

export const VelocityAnalysisTab: React.FC<VelocityAnalysisTabProps> = ({
  transactions,
  selectedAccountId,
  onSelectTxnPair,
}) => {
  const velocity = calculateVelocityAnalysis(transactions, selectedAccountId);

  return (
    <div className="space-y-6">
      {/* Velocity Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Multi-Hop Sequence
          </span>
          <div className="flex items-center space-x-2 text-sm font-bold font-mono text-slate-100 mt-1">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{velocity.totalHops} Hops</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">
            Total Duration: {velocity.formattedTotalElapsed}
          </span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Average Hop Interval
          </span>
          <div className="text-sm font-bold font-mono text-blue-400 mt-1">
            {velocity.avgHopIntervalMinutes} mins
          </div>
          <span className="text-[10px] text-slate-500 block">Mean time between transfers</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Median Hop Interval
          </span>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            {velocity.medianHopIntervalMinutes} mins
          </div>
          <span className="text-[10px] text-slate-500 block">50th percentile velocity</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Fastest Rapid Hop
          </span>
          <div className="text-sm font-bold font-mono text-rose-400 mt-1">
            {velocity.minHopIntervalMinutes} mins
          </div>
          <span className="text-[10px] text-slate-500 block">Minimum elapsed time</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Maximum Hop Delay
          </span>
          <div className="text-sm font-bold font-mono text-purple-400 mt-1">
            {velocity.maxHopIntervalMinutes} mins
          </div>
          <span className="text-[10px] text-slate-500 block">Longest observed gap</span>
        </div>
      </div>

      {/* Velocity Elapsed Time Chart */}
      {velocity.hops.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>Elapsed Hop Time Sequence Chart</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Y-Axis: Elapsed Mins | X-Axis: Hop Number
            </span>
          </div>

          <div className="h-48 flex items-end space-x-3 pt-6 pb-2 border-b border-slate-800 overflow-x-auto scrollbar-thin">
            {velocity.hops.map((hop) => {
              const maxVal = Math.max(...velocity.hops.map((h) => h.elapsedMinutes), 1);
              const heightPct = Math.max(10, Math.min(100, (hop.elapsedMinutes / maxVal) * 100));

              return (
                <div
                  key={hop.hopNumber}
                  onClick={() => onSelectTxnPair && onSelectTxnPair(hop.fromTxnId, hop.toTxnId)}
                  className="flex-1 min-w-[50px] flex flex-col items-center gap-1 group cursor-pointer"
                >
                  <span className="text-[9px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {hop.elapsedMinutes}m
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-cyan-400 rounded-t-lg transition-all"
                  />
                  <span className="text-[10px] font-mono font-bold text-slate-300">#{hop.hopNumber}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Velocity Hop Sequence Table */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Sequential Multi-Hop Transfer Breakdown</span>
        </h3>

        {velocity.hops.length === 0 ? (
          <p className="text-xs text-slate-500 italic p-4 text-center">
            Insufficient sequential transactions to calculate velocity hops.
          </p>
        ) : (
          <div className="space-y-2">
            {velocity.hops.map((hop) => (
              <div
                key={hop.hopNumber}
                className="bg-slate-950 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between flex-wrap gap-4"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    #{hop.hopNumber}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-slate-100 font-bold truncate">{hop.fromAccount}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="text-purple-400 font-bold truncate">{hop.toAccount}</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">
                      Channel: {hop.channel}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-6 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      {formatCurrencyINR(hop.amount)}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">Transferred Amount</span>
                  </div>

                  <div className="bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-center font-mono">
                    <span className="text-xs font-bold text-amber-400 block">{hop.formattedElapsed}</span>
                    <span className="text-[9px] text-slate-500">Elapsed Interval</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
