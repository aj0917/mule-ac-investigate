'use client';

import React from 'react';
import { DashboardMetrics } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { Activity, Calendar, Zap, Maximize2 } from 'lucide-react';

interface TransactionSummaryProps {
  metrics: DashboardMetrics;
  hasData: boolean;
}

export const TransactionSummary: React.FC<TransactionSummaryProps> = ({
  metrics,
  hasData,
}) => {
  const items = [
    {
      label: 'Credit Transactions',
      val: hasData ? `${metrics.creditCount.toLocaleString('en-IN')} txns` : '0',
      sub: hasData ? formatCurrencyINR(metrics.totalMoneyIn) : '₹0',
      color: 'text-emerald-400',
    },
    {
      label: 'Debit Transactions',
      val: hasData ? `${metrics.debitCount.toLocaleString('en-IN')} txns` : '0',
      sub: hasData ? formatCurrencyINR(metrics.totalMoneyOut) : '₹0',
      color: 'text-amber-400',
    },
    {
      label: 'Cash Withdrawals',
      val: hasData ? formatCurrencyINR(metrics.totalWithdrawals) : '₹0',
      sub: 'ATM & Cash WDL',
      color: 'text-purple-400',
    },
    {
      label: 'Cash Deposits',
      val: hasData ? formatCurrencyINR(metrics.totalDeposits) : '₹0',
      sub: 'Counter & Cash DEP',
      color: 'text-cyan-400',
    },
    {
      label: 'Average Txn Value',
      val: hasData ? formatCurrencyINR(metrics.averageTransactionValue, false) : '₹0',
      sub: 'Mean flow value',
      color: 'text-blue-400',
    },
    {
      label: 'Largest Transaction',
      val: hasData ? formatCurrencyINR(metrics.largestTransaction, false) : '₹0',
      sub: 'Max single record',
      color: 'text-rose-400',
    },
    {
      label: 'First Txn Date',
      val: hasData && metrics.firstTransactionDate ? metrics.firstTransactionDate : 'N/A',
      sub: 'Statement start',
      color: 'text-slate-300',
    },
    {
      label: 'Last Txn Date',
      val: hasData && metrics.lastTransactionDate ? metrics.lastTransactionDate : 'N/A',
      sub: 'Statement end',
      color: 'text-slate-300',
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-3">
        <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-100">Transaction Activity Breakdown</h3>
          <p className="text-[11px] text-slate-400">Key transactional volumes, limits, and timelines</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 border border-slate-800/80 rounded-lg p-3 space-y-1 hover:border-slate-700 transition-colors"
          >
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              {item.label}
            </span>
            <div className={`text-sm font-bold font-mono ${item.color} truncate`}>{item.val}</div>
            <span className="text-[10px] text-slate-500 block truncate">{item.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
