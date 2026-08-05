'use client';

import React from 'react';
import { Transaction } from '@/types/investigation';
import { getChannelBreakdown, formatCurrencyINR } from '@/lib/storage';
import { Layers, CreditCard, Landmark, Smartphone, Banknote, HelpCircle } from 'lucide-react';

interface TransactionChannelChartProps {
  transactions: Transaction[];
  hasData: boolean;
}

export const TransactionChannelChart: React.FC<TransactionChannelChartProps> = ({
  transactions,
  hasData,
}) => {
  const channelData = hasData ? getChannelBreakdown(transactions) : [];
  const maxAmount = channelData.length > 0 ? Math.max(...channelData.map((c) => c.totalAmount)) : 1;

  const getChannelBadgeColor = (ch: string) => {
    switch (ch) {
      case 'UPI':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'IMPS':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'NEFT':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'RTGS':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'ATM':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'CASH':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'CARD':
        return 'bg-pink-500/10 text-pink-400 border-pink-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Layers className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Transaction Channels</h3>
          <p className="text-[11px] text-slate-400">
            Payment mechanism distribution (UPI, IMPS, NEFT, ATM, etc.)
          </p>
        </div>
      </div>

      {!hasData || channelData.length === 0 ? (
        <div className="h-52 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-lg bg-slate-950/40">
          <p className="text-xs font-semibold text-slate-300">No Channel Breakdown Available</p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
            Import a bank statement to analyze payment channel distribution.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
          {channelData.map((item) => {
            const pct = Math.min(100, Math.round((item.totalAmount / maxAmount) * 100));
            return (
              <div key={item.channel} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getChannelBadgeColor(
                        item.channel
                      )}`}
                    >
                      {item.channel}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      {item.count.toLocaleString('en-IN')} txns
                    </span>
                  </div>
                  <span className="font-mono font-semibold text-slate-200">
                    {formatCurrencyINR(item.totalAmount)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(4, pct)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
