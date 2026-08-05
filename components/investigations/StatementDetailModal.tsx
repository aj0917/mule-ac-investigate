'use client';

import React from 'react';
import { X, FileSpreadsheet, ShieldCheck, Database, Calendar, Building2, FileText, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { CrossStatement } from '@/types/crossStatement';
import { formatCurrencyINR } from '@/lib/storage';

interface StatementDetailModalProps {
  statement: CrossStatement | null;
  onClose: () => void;
}

export const StatementDetailModal: React.FC<StatementDetailModalProps> = ({
  statement,
  onClose,
}) => {
  if (!statement) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                  {statement.id}
                </span>
                <span className="text-xs text-slate-400">• Dataset {statement.datasetVersion}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{statement.fileName}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Bank Name</span>
              <p className="text-sm font-semibold text-slate-200 mt-1 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                {statement.bankName}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Account Identifier</span>
              <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                {statement.accountNumberMasked}
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Total Rows</span>
              <p className="text-sm font-mono font-bold text-slate-200 mt-1">
                {statement.rowCount.toLocaleString()} txns
              </p>
            </div>
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3">
              <span className="text-[11px] text-slate-400 font-medium">Data Quality</span>
              <p className="text-sm font-semibold mt-1 flex items-center gap-1.5">
                {statement.qualityRating === 'HIGH' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> High Integrity
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Review Req.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Statement Metadata Details */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              Dataset & Cryptographic Lineage
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Statement Reference ID:</span>
                <span className="text-slate-200 font-bold">{statement.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Original Workspace ID:</span>
                <span className="text-slate-300">{statement.originalId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">SHA-256 File Hash:</span>
                <span className="text-emerald-400 truncate max-w-[280px]" title={statement.fileHash}>
                  {statement.fileHash}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Import Date & Time:</span>
                <span className="text-slate-300">{new Date(statement.importedAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Source Case Assignment:</span>
                <span className="text-blue-400 font-sans font-semibold">
                  {statement.caseName || 'Unassigned / Global Dataset'}
                </span>
              </div>
            </div>
          </div>

          {/* Money Totals Breakdown */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3">
              <span className="text-[11px] text-emerald-400 font-semibold uppercase tracking-wider">Total Inflow (Credits)</span>
              <p className="text-lg font-bold font-mono text-emerald-300 mt-1">
                {formatCurrencyINR(statement.totalMoneyIn)}
              </p>
            </div>
            <div className="bg-rose-950/20 border border-rose-500/20 rounded-xl p-3">
              <span className="text-[11px] text-rose-400 font-semibold uppercase tracking-wider">Total Outflow (Debits)</span>
              <p className="text-lg font-bold font-mono text-rose-300 mt-1">
                {formatCurrencyINR(statement.totalMoneyOut)}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 italic bg-slate-950/40 p-3 rounded-lg border border-slate-800/60">
            Note: Statement metadata and dataset hashes are strictly immutable to maintain investigation chain of custody.
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
          >
            Close Metadata Window
          </button>
        </div>
      </div>
    </div>
  );
};
