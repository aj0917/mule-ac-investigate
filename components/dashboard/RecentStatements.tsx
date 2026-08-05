'use client';

import React from 'react';
import { BankStatement } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { FileSpreadsheet, Eye, Trash2, Calendar, CheckCircle2, AlertTriangle } from 'lucide-react';

interface RecentStatementsProps {
  statements: BankStatement[];
  onOpenTransactions: (statementId?: string) => void;
  onDeleteStatement: (statementId: string) => void;
  onOpenUpload: () => void;
}

export const RecentStatements: React.FC<RecentStatementsProps> = ({
  statements,
  onOpenTransactions,
  onDeleteStatement,
  onOpenUpload,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">Recently Imported Statements</h3>
            <p className="text-[11px] text-slate-400">
              Active statement files parsed and included in money flow calculations
            </p>
          </div>
        </div>

        <button
          onClick={onOpenUpload}
          className="text-xs bg-slate-950 hover:bg-slate-800 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium self-start sm:self-auto"
        >
          + Import New Statement
        </button>
      </div>

      {statements.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-lg bg-slate-950/40 space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-xs font-semibold text-slate-300">No Bank Statements Imported Yet</p>
          <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
            Upload CSV or Excel bank statement files to analyze financial activity and extract accounts.
          </p>
          <button
            onClick={onOpenUpload}
            className="mt-2 text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Upload Statement
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-2.5 px-3">Statement File</th>
                <th className="py-2.5 px-3">Bank Name</th>
                <th className="py-2.5 px-3">Account No</th>
                <th className="py-2.5 px-3">Period</th>
                <th className="py-2.5 px-3 text-right">Transactions</th>
                <th className="py-2.5 px-3 text-right">Money In / Out</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {statements.map((stmt) => (
                <tr key={stmt.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-100 flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="truncate max-w-[180px]" title={stmt.fileName}>
                        {stmt.fileName}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {(stmt.fileSize / (1024 * 1024)).toFixed(2)} MB • {stmt.fileType.toUpperCase()}
                    </span>
                  </td>

                  <td className="py-3 px-3 font-medium text-slate-300">{stmt.bankName}</td>

                  <td className="py-3 px-3 font-mono text-slate-400">{stmt.accountNumberMasked}</td>

                  <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                    {stmt.periodStart && stmt.periodEnd
                      ? `${stmt.periodStart} – ${stmt.periodEnd}`
                      : 'Full Range'}
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                    {stmt.rowCount.toLocaleString('en-IN')}
                  </td>

                  <td className="py-3 px-3 text-right font-mono text-[11px]">
                    <div className="text-emerald-400 font-semibold">
                      +{formatCurrencyINR(stmt.totalMoneyIn)}
                    </div>
                    <div className="text-amber-400">-{formatCurrencyINR(stmt.totalMoneyOut)}</div>
                  </td>

                  <td className="py-3 px-3 text-center">
                    {stmt.status === 'processed' ? (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Review Required</span>
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => onOpenTransactions(stmt.id)}
                        className="p-1.5 rounded-md bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 transition-colors"
                        title="View Parsed Transactions"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteStatement(stmt.id)}
                        className="p-1.5 rounded-md bg-slate-950 hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                        title="Delete Statement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
