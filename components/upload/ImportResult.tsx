'use client';

import React from 'react';
import { formatCurrencyINR } from '@/lib/storage';
import { CheckCircle2, ArrowRight, FileSpreadsheet, LayoutDashboard, AlertCircle } from 'lucide-react';

interface ImportResultProps {
  importedCount: number;
  reviewCount: number;
  dateRangeStr: string;
  moneyIn: number;
  moneyOut: number;
  withdrawals: number;
  onViewTransactions: () => void;
  onViewDashboard: () => void;
  onImportAnother: () => void;
}

export const ImportResult: React.FC<ImportResultProps> = ({
  importedCount,
  reviewCount,
  dateRangeStr,
  moneyIn,
  moneyOut,
  withdrawals,
  onViewTransactions,
  onViewDashboard,
  onImportAnother,
}) => {
  return (
    <div className="py-6 space-y-6 text-center max-w-lg mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-slate-100">Statement Imported Successfully</h2>
        <p className="text-xs text-slate-400">
          Transactions have been normalized and added to your active investigation workspace.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 grid grid-cols-2 gap-3 text-left">
        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Transactions Imported
          </span>
          <span className="text-lg font-bold font-mono text-emerald-400">
            {importedCount.toLocaleString('en-IN')}
          </span>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Rows Requiring Review
          </span>
          <span className={`text-lg font-bold font-mono ${reviewCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {reviewCount}
          </span>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Money In (Credits)
          </span>
          <span className="text-sm font-bold font-mono text-emerald-400">
            {formatCurrencyINR(moneyIn)}
          </span>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Money Out (Debits)
          </span>
          <span className="text-sm font-bold font-mono text-amber-400">
            {formatCurrencyINR(moneyOut)}
          </span>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 col-span-2 flex justify-between items-center">
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Cash Withdrawals (ATM)
            </span>
            <span className="text-xs font-bold font-mono text-purple-400">
              {formatCurrencyINR(withdrawals)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Statement Period
            </span>
            <span className="text-xs font-mono text-slate-300">{dateRangeStr}</span>
          </div>
        </div>
      </div>

      {reviewCount > 0 && (
        <div className="p-3 bg-amber-950/30 border border-amber-900/60 rounded-lg text-xs text-amber-300 flex items-center space-x-2 text-left">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            {reviewCount} rows had unparseable dates or zero amounts and were flagged for investigator review.
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
        <button
          onClick={onViewTransactions}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-5 py-2.5 rounded-xl text-xs transition-colors shadow-md"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>View Transactions</span>
        </button>

        <button
          onClick={onViewDashboard}
          className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-xl text-xs transition-colors font-medium"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>View Dashboard</span>
        </button>

        <button
          onClick={onImportAnother}
          className="w-full sm:w-auto text-xs text-slate-400 hover:text-slate-200 py-2.5 px-3 underline font-medium"
        >
          Import Another Statement
        </button>
      </div>
    </div>
  );
};
