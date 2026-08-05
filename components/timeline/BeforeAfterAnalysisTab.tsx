'use client';

import React, { useState } from 'react';
import {
  Clock,
  ArrowRightLeft,
  ArrowLeft,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';
import { buildBeforeAfterContext } from '@/lib/timelineAnalytics';

interface BeforeAfterAnalysisTabProps {
  events: TimelineEvent[];
  initialSelectedEvent?: TimelineEvent;
  onSelectEvent?: (event: TimelineEvent) => void;
}

export const BeforeAfterAnalysisTab: React.FC<BeforeAfterAnalysisTabProps> = ({
  events,
  initialSelectedEvent,
  onSelectEvent,
}) => {
  const sourceEvents = events.filter((e) => e.category === 'SOURCE' && e.amount);

  const [selectedEventId, setSelectedEventId] = useState<string>(
    initialSelectedEvent?.id || sourceEvents[0]?.id || ''
  );
  const [windowMinutes, setWindowMinutes] = useState<number>(30);

  const selectedEvent = events.find((e) => e.id === selectedEventId) || sourceEvents[0];

  if (!selectedEvent) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
        <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
        <p className="text-sm font-semibold">No transactions available for Context Analysis.</p>
      </div>
    );
  }

  const context = buildBeforeAfterContext(selectedEvent, events, windowMinutes);

  return (
    <div className="space-y-6">
      {/* Transaction Selection & Window Deck */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Transaction Selector */}
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Select Target Transaction for Context Analysis
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-blue-500"
          >
            {sourceEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>
                {evt.date} {evt.timeFormatted} - {evt.title} ({evt.channel || 'TXN'})
              </option>
            ))}
          </select>
        </div>

        {/* Time Window Configurator */}
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Context Time Window (±)
          </label>
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            {[5, 15, 30, 60, 360, 1440, 10080].map((mins) => {
              const label =
                mins < 60
                  ? `${mins}m`
                  : mins < 1440
                  ? `${mins / 60}h`
                  : `${mins / 1440}d`;
              return (
                <button
                  key={mins}
                  onClick={() => setWindowMinutes(mins)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                    windowMinutes === mins
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Context Summary Banner */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Observed Transaction Context Summary (±{context.windowMinutes} Minutes)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>BEFORE WINDOW ({context.beforeCount} Events)</span>
            </span>
            <div className="text-xs font-mono space-y-0.5 pt-1">
              <p className="text-emerald-400 font-bold">
                Incoming: {formatCurrencyINR(context.beforeIncoming)}
              </p>
              <p className="text-rose-400 font-bold">
                Outgoing: {formatCurrencyINR(context.beforeOutgoing)}
              </p>
            </div>
          </div>

          <div className="bg-blue-950/40 p-4 rounded-xl border border-blue-500/40 space-y-1">
            <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">
              SELECTED TARGET TRANSACTION
            </span>
            <p className="text-xs font-mono font-bold text-slate-100 truncate mt-1">
              {selectedEvent.title}
            </p>
            <span className="text-sm font-mono font-bold text-emerald-400 block">
              {formatCurrencyINR(selectedEvent.amount || 0)}
            </span>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center justify-end space-x-1">
              <span>AFTER WINDOW ({context.afterCount} Events)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
            <div className="text-xs font-mono text-right space-y-0.5 pt-1">
              <p className="text-emerald-400 font-bold">
                Incoming: {formatCurrencyINR(context.afterIncoming)}
              </p>
              <p className="text-rose-400 font-bold">
                Outgoing: {formatCurrencyINR(context.afterOutgoing)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Before vs After Event Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* BEFORE STREAM */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center space-x-1.5">
              <ArrowLeft className="w-4 h-4" />
              <span>Activity Immediately BEFORE ({context.beforeWindow.length})</span>
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Within -{context.windowMinutes} mins
            </span>
          </div>

          {context.beforeWindow.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">
              No prior activity recorded within this time window.
            </p>
          ) : (
            <div className="space-y-2">
              {context.beforeWindow.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{evt.date} {evt.timeFormatted}</span>
                    <span className="text-slate-300 font-semibold">{evt.sourceLabel}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">{evt.title}</p>
                  {evt.amount !== undefined && (
                    <span
                      className={`text-xs font-mono font-bold block ${
                        evt.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {evt.direction === 'IN' ? '+' : '-'}{formatCurrencyINR(evt.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AFTER STREAM */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span>Activity Immediately AFTER ({context.afterWindow.length})</span>
              <ArrowRight className="w-4 h-4" />
            </h4>
            <span className="text-[10px] font-mono text-slate-500">
              Within +{context.windowMinutes} mins
            </span>
          </div>

          {context.afterWindow.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-6 text-center">
              No subsequent activity recorded within this time window.
            </p>
          ) : (
            <div className="space-y-2">
              {context.afterWindow.map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent && onSelectEvent(evt)}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{evt.date} {evt.timeFormatted}</span>
                    <span className="text-slate-300 font-semibold">{evt.sourceLabel}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-200 truncate">{evt.title}</p>
                  {evt.amount !== undefined && (
                    <span
                      className={`text-xs font-mono font-bold block ${
                        evt.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {evt.direction === 'IN' ? '+' : '-'}{formatCurrencyINR(evt.amount)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
