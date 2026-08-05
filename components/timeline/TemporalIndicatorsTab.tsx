'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Clock,
  ArrowRight,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  Tag,
} from 'lucide-react';
import { PatternIndicator } from '@/types/investigation';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';

interface TemporalIndicatorsTabProps {
  indicators: PatternIndicator[];
  events: TimelineEvent[];
  onSelectEvent?: (event: TimelineEvent) => void;
  onOpenPatternEngine?: () => void;
}

export const TemporalIndicatorsTab: React.FC<TemporalIndicatorsTabProps> = ({
  indicators,
  events,
  onSelectEvent,
  onOpenPatternEngine,
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filtered = indicators.filter((ind) => {
    if (severityFilter !== 'ALL' && ind.priority !== severityFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Indicator Filter & Header */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Chronological Pattern Indicators & Anomalies ({filtered.length})
          </h3>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Severities</option>
            <option value="HIGH">HIGH SEVERITY</option>
            <option value="MEDIUM">MEDIUM SEVERITY</option>
            <option value="LOW">LOW SEVERITY</option>
          </select>

          {onOpenPatternEngine && (
            <button
              onClick={onOpenPatternEngine}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-xs font-semibold transition-colors flex items-center space-x-1"
            >
              <span>Step 5 Pattern Engine</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Indicator Cards List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No temporal pattern indicators found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ind) => {
            const isHigh = ind.priority === 'HIGH';
            const isMedium = ind.priority === 'MEDIUM';

            // Find matching timeline event if any
            const matchingEvt = events.find((e) => e.relatedIndicatorId === ind.id || e.title === ind.title);

            return (
              <div
                key={ind.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded border ${
                        isHigh
                          ? 'bg-rose-950 border-rose-800 text-rose-400'
                          : isMedium
                          ? 'bg-amber-950 border-amber-800 text-amber-400'
                          : 'bg-blue-950 border-blue-800 text-blue-400'
                      }`}
                    >
                      {ind.priority} PRIORITY
                    </span>
                    <span className="text-xs font-bold text-slate-100">{ind.title}</span>
                  </div>

                  {ind.startDate && (
                    <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>{ind.startDate}</span>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-300 font-mono leading-relaxed">
                  {ind.subtitle}
                </p>

                {/* Account & Amount details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800/80 text-xs font-mono">
                  {ind.rootAccountId && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Target Account</span>
                      <span className="text-slate-200 font-bold">{ind.rootAccountLabel || ind.rootAccountId}</span>
                    </div>
                  )}

                  {ind.totalAmount !== undefined && (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Associated Volume</span>
                      <span className="text-emerald-400 font-bold">{formatCurrencyINR(ind.totalAmount)}</span>
                    </div>
                  )}

                  {(ind.transactionIds?.length || ind.supportingTransactions?.length) ? (
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Supporting Txn Count</span>
                      <span className="text-blue-400 font-bold">
                        {(ind.transactionIds?.length || ind.supportingTransactions?.length)} Transactions
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Actions */}
                {matchingEvt && onSelectEvent && (
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => onSelectEvent(matchingEvt)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 text-xs font-semibold transition-colors flex items-center space-x-1.5"
                    >
                      <span>Jump to Timeline Event</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
