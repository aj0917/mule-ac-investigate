'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
} from 'lucide-react';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';
import { buildPeriodComparison } from '@/lib/timelineAnalytics';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface ComparativeAnalysisTabProps {
  events: TimelineEvent[];
}

export const ComparativeAnalysisTab: React.FC<ComparativeAnalysisTabProps> = ({ events }) => {
  const [periodAStart, setPeriodAStart] = useState('2026-04-01');
  const [periodAEnd, setPeriodAEnd] = useState('2026-04-15');
  const [periodBStart, setPeriodBStart] = useState('2026-04-16');
  const [periodBEnd, setPeriodBEnd] = useState('2026-04-30');

  const comparison = buildPeriodComparison(
    events,
    { label: 'Period A (Prior)', start: periodAStart, end: periodAEnd },
    { label: 'Period B (Current)', start: periodBStart, end: periodBEnd }
  );

  // Group events by date for trend chart
  const dateMap: Record<string, { date: string; incoming: number; outgoing: number; count: number }> = {};

  events.forEach((e) => {
    if (!e.date) return;
    if (!dateMap[e.date]) {
      dateMap[e.date] = { date: e.date, incoming: 0, outgoing: 0, count: 0 };
    }
    dateMap[e.date].count += 1;
    if (e.direction === 'IN') dateMap[e.date].incoming += e.amount || 0;
    else if (e.direction === 'OUT') dateMap[e.date].outgoing += e.amount || 0;
  });

  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {/* Date Range Configurator */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
            Comparative Time Period Configurator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              PERIOD A (Baseline Period)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-500 uppercase">Start Date</label>
                <input
                  type="date"
                  value={periodAStart}
                  onChange={(e) => setPeriodAStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 uppercase">End Date</label>
                <input
                  type="date"
                  value={periodAEnd}
                  onChange={(e) => setPeriodAEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
              PERIOD B (Comparison Period)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] text-slate-500 uppercase">Start Date</label>
                <input
                  type="date"
                  value={periodBStart}
                  onChange={(e) => setPeriodBStart(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="block text-[9px] text-slate-500 uppercase">End Date</label>
                <input
                  type="date"
                  value={periodBEnd}
                  onChange={(e) => setPeriodBEnd(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison Metrics Table */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period A Card */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
            {comparison.periodA.label}
          </span>
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Transactions:</span>
              <span className="font-bold text-slate-100">{comparison.periodA.txnsCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Total Money In:</span>
              <span className="font-bold text-emerald-400">{formatCurrencyINR(comparison.periodA.totalIn)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Total Money Out:</span>
              <span className="font-bold text-rose-400">{formatCurrencyINR(comparison.periodA.totalOut)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Active Accounts:</span>
              <span className="font-bold text-slate-100">{comparison.periodA.activeAccounts}</span>
            </div>
          </div>
        </div>

        {/* Change / Delta Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-xl border border-slate-800 flex flex-col justify-center items-center text-center space-y-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            NET PERIOD CHANGE / DELTA
          </span>
          <div className="flex items-center space-x-2">
            {comparison.pctCount >= 0 ? (
              <ArrowUpRight className="w-6 h-6 text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-6 h-6 text-rose-400" />
            )}
            <span
              className={`text-2xl font-bold font-mono ${
                comparison.pctCount >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {comparison.pctCount >= 0 ? '+' : ''}{comparison.pctCount}%
            </span>
          </div>
          <span className="text-xs font-mono text-slate-300">
            {comparison.diffCount >= 0 ? '+' : ''}{comparison.diffCount} Net Transactions
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            Volume Delta: {formatCurrencyINR(comparison.diffVolume)} ({comparison.pctVolume}%)
          </span>
        </div>

        {/* Period B Card */}
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
            {comparison.periodB.label}
          </span>
          <div className="space-y-2 font-mono text-xs text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Transactions:</span>
              <span className="font-bold text-slate-100">{comparison.periodB.txnsCount}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Total Money In:</span>
              <span className="font-bold text-emerald-400">{formatCurrencyINR(comparison.periodB.totalIn)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Total Money Out:</span>
              <span className="font-bold text-rose-400">{formatCurrencyINR(comparison.periodB.totalOut)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800">
              <span className="text-slate-500">Active Accounts:</span>
              <span className="font-bold text-slate-100">{comparison.periodB.activeAccounts}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Activity Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <span>Daily Financial Activity Trend Timeline</span>
          </h3>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '11px' }}
                  formatter={(val: any) => formatCurrencyINR(Number(val))}
                />
                <Area type="monotone" dataKey="incoming" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" name="Incoming" />
                <Area type="monotone" dataKey="outgoing" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" name="Outgoing" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};
