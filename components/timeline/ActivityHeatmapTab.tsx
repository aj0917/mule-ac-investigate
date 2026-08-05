'use client';

import React, { useState } from 'react';
import { Grid, Clock, Filter, Layers, Info, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { TimelineEvent, HeatmapCell } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';
import { buildActivityHeatmap } from '@/lib/timelineAnalytics';

interface ActivityHeatmapTabProps {
  events: TimelineEvent[];
  onSelectCellEvents?: (cellEvents: TimelineEvent[]) => void;
}

export const ActivityHeatmapTab: React.FC<ActivityHeatmapTabProps> = ({
  events,
  onSelectCellEvents,
}) => {
  const [metric, setMetric] = useState<'COUNT' | 'INCOMING' | 'OUTGOING' | 'TOTAL'>('COUNT');
  const [selectedCell, setSelectedCell] = useState<{ day: number; hour: number; label: string } | null>(null);

  const cells = buildActivityHeatmap(events);

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Calculate max metric value for color scaling
  let maxVal = 1;
  cells.forEach((c) => {
    const v =
      metric === 'COUNT'
        ? c.count
        : metric === 'INCOMING'
        ? c.incoming
        : metric === 'OUTGOING'
        ? c.outgoing
        : c.totalValue;
    if (v > maxVal) maxVal = v;
  });

  const getCellColor = (val: number) => {
    if (val === 0) return 'bg-slate-950 border-slate-900';
    const pct = val / maxVal;
    if (pct < 0.25) return 'bg-blue-950/60 border-blue-900/60 text-blue-300';
    if (pct < 0.5) return 'bg-blue-900/80 border-blue-800 text-blue-200';
    if (pct < 0.75) return 'bg-blue-700 border-blue-600 text-white font-bold';
    return 'bg-blue-500 border-blue-400 text-white font-bold shadow-sm shadow-blue-500/50';
  };

  const getCellValue = (c: HeatmapCell) => {
    if (metric === 'COUNT') return c.count;
    if (metric === 'INCOMING') return c.incoming;
    if (metric === 'OUTGOING') return c.outgoing;
    return c.totalValue;
  };

  const selectedCellEvents = selectedCell
    ? events.filter((e) => {
        const dt = new Date(e.timestamp);
        if (isNaN(dt.getTime())) return false;
        const jsDay = dt.getDay();
        const dayIdx = jsDay === 0 ? 6 : jsDay - 1;
        return dayIdx === selectedCell.day && dt.getHours() === selectedCell.hour;
      })
    : [];

  return (
    <div className="space-y-6">
      {/* Metric Selector Deck */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Grid className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Transaction Activity Heatmap Matrix (Day vs Hour)
          </h3>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metric:</span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(
              [
                { id: 'COUNT', label: 'Transaction Count' },
                { id: 'INCOMING', label: 'Incoming Value' },
                { id: 'OUTGOING', label: 'Outgoing Value' },
                { id: 'TOTAL', label: 'Total Volume' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => setMetric(m.id)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  metric === m.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 7x24 Heatmap Grid Table */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4 overflow-x-auto scrollbar-thin">
        <div className="min-w-[700px]">
          {/* Hour Headers 00..23 */}
          <div className="grid grid-cols-25 gap-1 text-center font-mono text-[10px] text-slate-400 pb-2">
            <div className="text-left font-bold text-slate-500">Day \ Hour</div>
            {hours.map((h) => (
              <div key={h} className="font-semibold">{String(h).padStart(2, '0')}</div>
            ))}
          </div>

          {/* Day Rows */}
          {days.map((dayLabel, dIdx) => (
            <div key={dayLabel} className="grid grid-cols-25 gap-1 py-1 items-center">
              <div className="text-xs font-bold font-mono text-slate-300">{dayLabel}</div>
              {hours.map((h) => {
                const cell = cells.find((c) => c.dayOfWeek === dIdx && c.hourOfDay === h) || {
                  dayOfWeek: dIdx,
                  dayLabel,
                  hourOfDay: h,
                  count: 0,
                  incoming: 0,
                  outgoing: 0,
                  totalValue: 0,
                };
                const val = getCellValue(cell);
                const isSelected = selectedCell?.day === dIdx && selectedCell?.hour === h;

                return (
                  <div
                    key={h}
                    onClick={() => {
                      setSelectedCell({ day: dIdx, hour: h, label: `${dayLabel} ${String(h).padStart(2, '0')}:00` });
                    }}
                    title={`${dayLabel} ${String(h).padStart(2, '0')}:00–${String(h + 1).padStart(2, '0')}:00\nTransactions: ${cell.count}\nIncoming: ₹${cell.incoming.toLocaleString()}\nOutgoing: ₹${cell.outgoing.toLocaleString()}`}
                    className={`h-9 rounded-lg border text-[10px] font-mono flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${getCellColor(
                      val
                    )} ${isSelected ? 'ring-2 ring-amber-400 border-amber-400' : ''}`}
                  >
                    {val > 0 ? (metric === 'COUNT' ? val : `₹${Math.round(val / 1000)}k`) : ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend bar */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
          <span>Click any cell to inspect transactions occurring during that hour block.</span>
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Low</span>
            <span className="w-3 h-3 rounded bg-blue-950 border border-blue-900 inline-block" />
            <span className="w-3 h-3 rounded bg-blue-900 inline-block" />
            <span className="w-3 h-3 rounded bg-blue-700 inline-block" />
            <span className="w-3 h-3 rounded bg-blue-500 inline-block" />
            <span className="text-slate-500">High Concentration</span>
          </div>
        </div>
      </div>

      {/* Selected Cell Event Inspector Drawer/Panel */}
      {selectedCell && (
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>
                Transactions during {selectedCell.label} ({selectedCellEvents.length} Events)
              </span>
            </h4>
            <button
              onClick={() => setSelectedCell(null)}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Close Inspector
            </button>
          </div>

          {selectedCellEvents.length === 0 ? (
            <p className="text-xs text-slate-500 italic">No transactions recorded during this hour block.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
              {selectedCellEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs font-mono"
                >
                  <div>
                    <span className="text-slate-400 text-[10px]">{evt.timeFormatted}</span>
                    <p className="font-bold text-slate-200">{evt.title}</p>
                    <p className="text-[10px] text-slate-500">{evt.description}</p>
                  </div>
                  {evt.amount !== undefined && (
                    <span
                      className={`font-bold ${
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
      )}
    </div>
  );
};
