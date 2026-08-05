'use client';

import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Transaction } from '@/types/investigation';
import { getTimeSeriesData, formatCurrencyINR } from '@/lib/storage';
import { TrendingUp, BarChart2 } from 'lucide-react';

interface FinancialActivityChartProps {
  transactions: Transaction[];
  hasData: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 shadow-xl text-xs space-y-1.5 font-sans">
        <div className="font-semibold text-slate-200 border-b border-slate-800 pb-1">
          Date: {label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-4">
            <span className="flex items-center space-x-1.5" style={{ color: entry.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}:</span>
            </span>
            <span className="font-mono font-semibold text-slate-100">
              {formatCurrencyINR(entry.value, false)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const FinancialActivityChart: React.FC<FinancialActivityChartProps> = ({
  transactions,
  hasData,
}) => {
  const [daysFilter, setDaysFilter] = useState<'7' | '30' | '90' | 'all'>('30');

  const chartData = hasData ? getTimeSeriesData(transactions, daysFilter) : [];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Financial Activity Overview</h3>
            <p className="text-[11px] text-slate-400">
              Daily trend of Money In, Money Out, and Cash Withdrawals
            </p>
          </div>
        </div>

        {/* Days Filter Buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 self-start sm:self-auto">
          {(['7', '30', '90', 'all'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setDaysFilter(filter)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                daysFilter === filter
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {filter === 'all' ? 'All' : `${filter} Days`}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas or Empty State */}
      {!hasData || chartData.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-lg bg-slate-950/40 space-y-2">
          <BarChart2 className="w-8 h-8 text-slate-600 mb-1" />
          <p className="text-xs font-semibold text-slate-300">No Financial Activity Data</p>
          <p className="text-[11px] text-slate-500 max-w-sm">
            Import a bank statement to visualize incoming credits, outgoing debits, and cash withdrawal timelines.
          </p>
        </div>
      ) : (
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorMoneyIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMoneyOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorWithdrawals" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#334155' }}
                tickFormatter={(val) => formatCurrencyINR(val, true)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
              />
              <Area
                type="monotone"
                dataKey="moneyIn"
                name="Money In"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMoneyIn)"
              />
              <Area
                type="monotone"
                dataKey="moneyOut"
                name="Money Out"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorMoneyOut)"
              />
              <Area
                type="monotone"
                dataKey="withdrawals"
                name="Withdrawals"
                stroke="#a855f7"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                fillOpacity={1}
                fill="url(#colorWithdrawals)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};
