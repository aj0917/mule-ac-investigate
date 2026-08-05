'use client';

import React from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Users,
  FileSpreadsheet,
  Banknote,
} from 'lucide-react';
import { DashboardMetrics } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface MetricCardsProps {
  metrics: DashboardMetrics;
  hasData: boolean;
}

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, hasData }) => {
  const cards = [
    {
      title: 'Total Transactions',
      value: hasData ? metrics.totalTransactions.toLocaleString('en-IN') : '0',
      subtitle: hasData ? `${metrics.creditCount} Credits, ${metrics.debitCount} Debits` : 'No transactions imported',
      icon: Receipt,
      iconBg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      title: 'Money In',
      value: hasData ? formatCurrencyINR(metrics.totalMoneyIn) : '₹0',
      subtitle: hasData ? `Full: ${formatCurrencyINR(metrics.totalMoneyIn, false)}` : 'Incoming credits',
      icon: ArrowDownLeft,
      iconBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
    {
      title: 'Money Out',
      value: hasData ? formatCurrencyINR(metrics.totalMoneyOut) : '₹0',
      subtitle: hasData ? `Full: ${formatCurrencyINR(metrics.totalMoneyOut, false)}` : 'Outgoing debits',
      icon: ArrowUpRight,
      iconBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      title: 'Withdrawals',
      value: hasData ? formatCurrencyINR(metrics.totalWithdrawals) : '₹0',
      subtitle: hasData ? 'ATM & Cash withdrawals' : 'Cash withdrawals',
      icon: Banknote,
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      title: 'Unique Accounts',
      value: hasData ? metrics.uniqueAccounts.toLocaleString('en-IN') : '0',
      subtitle: hasData ? 'Identified UPI/Account entities' : 'Identified accounts',
      icon: Users,
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    },
    {
      title: 'Statements Imported',
      value: hasData ? metrics.statementsCount.toString() : '0',
      subtitle: hasData ? 'Active parsed statement files' : 'Statement files',
      icon: FileSpreadsheet,
      iconBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg border ${card.iconBg}`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl font-bold text-slate-100 font-mono tracking-tight">
                {card.value}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">{card.subtitle}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
