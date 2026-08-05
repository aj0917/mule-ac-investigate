'use client';

import React, { useState } from 'react';
import { X, GitCompare, ArrowRight, ShieldCheck, FileText, CheckCircle2 } from 'lucide-react';
import { InvestigationReport } from '@/types/report';
import { formatCurrencyINR } from '@/lib/storage';

interface ReportComparisonModalProps {
  reports: InvestigationReport[];
  baseReport: InvestigationReport;
  onClose: () => void;
}

export const ReportComparisonModal: React.FC<ReportComparisonModalProps> = ({
  reports,
  baseReport,
  onClose,
}) => {
  const otherReports = reports.filter((r) => r.id !== baseReport.id);
  const [targetReportId, setTargetReportId] = useState<string>(otherReports[0]?.id || baseReport.id);

  const targetReport = reports.find((r) => r.id === targetReportId) || baseReport;

  const baseSnap = baseReport.snapshot || {
    totalAccounts: 12,
    totalTransactions: 1842,
    totalIncomingAmount: 4820000,
    totalOutgoingAmount: 4670000,
    totalWithdrawalAmount: 410000,
    patternsCount: 32,
    evidenceCount: 14,
    findingsCount: 5,
  };

  const targetSnap = targetReport.snapshot || {
    totalAccounts: 14,
    totalTransactions: 2150,
    totalIncomingAmount: 5400000,
    totalOutgoingAmount: 5120000,
    totalWithdrawalAmount: 480000,
    patternsCount: 38,
    evidenceCount: 18,
    findingsCount: 6,
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <GitCompare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Report Version Comparison Engine</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  V1 vs V2 DIFF
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compare calculated metrics, new accounts, changed transactions, patterns, and findings across report snapshots.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Version Selection Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Base Report */}
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-500/40 space-y-2">
              <span className="text-[10px] font-mono font-bold text-blue-400 uppercase">Base Version (Report A)</span>
              <div className="font-bold text-slate-100">{baseReport.title}</div>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>ID: {baseReport.id}</span>
                <span>Dataset: {baseReport.datasetVersion}</span>
              </div>
            </div>

            {/* Target Report Selector */}
            <div className="bg-slate-950 p-4 rounded-xl border border-purple-500/40 space-y-2">
              <span className="text-[10px] font-mono font-bold text-purple-400 uppercase">Compare With (Report B)</span>
              <select
                value={targetReportId}
                onChange={(e) => setTargetReportId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-bold focus:outline-none"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} ({r.versionLabel}) — {r.datasetVersion}
                  </option>
                ))}
              </select>
              <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                <span>ID: {targetReport.id}</span>
                <span>Dataset: {targetReport.datasetVersion}</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Metrics Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <th className="p-3">Investigation Metric</th>
                  <th className="p-3 text-right">Base ({baseReport.versionLabel})</th>
                  <th className="p-3 text-right">Target ({targetReport.versionLabel})</th>
                  <th className="p-3 text-right">Variance / Net Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-200">Total Accounts Analyzed</td>
                  <td className="p-3 text-right font-mono">{baseSnap.totalAccounts}</td>
                  <td className="p-3 text-right font-mono text-purple-300">{targetSnap.totalAccounts}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    +{targetSnap.totalAccounts - baseSnap.totalAccounts} accounts
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-200">Transactions Analyzed</td>
                  <td className="p-3 text-right font-mono">{baseSnap.totalTransactions}</td>
                  <td className="p-3 text-right font-mono text-purple-300">{targetSnap.totalTransactions}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    +{targetSnap.totalTransactions - baseSnap.totalTransactions} records
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-200">Total Incoming Amount</td>
                  <td className="p-3 text-right font-mono">{formatCurrencyINR(baseSnap.totalIncomingAmount)}</td>
                  <td className="p-3 text-right font-mono text-purple-300">{formatCurrencyINR(targetSnap.totalIncomingAmount)}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    +{formatCurrencyINR(targetSnap.totalIncomingAmount - baseSnap.totalIncomingAmount)}
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-200">Detected Patterns</td>
                  <td className="p-3 text-right font-mono">{baseSnap.patternsCount}</td>
                  <td className="p-3 text-right font-mono text-purple-300">{targetSnap.patternsCount}</td>
                  <td className="p-3 text-right font-mono font-bold text-amber-400">
                    +{targetSnap.patternsCount - baseSnap.patternsCount} new patterns
                  </td>
                </tr>

                <tr className="hover:bg-slate-800/40">
                  <td className="p-3 font-semibold text-slate-200">Evidence Records Linked</td>
                  <td className="p-3 text-right font-mono">{baseSnap.evidenceCount}</td>
                  <td className="p-3 text-right font-mono text-purple-300">{targetSnap.evidenceCount}</td>
                  <td className="p-3 text-right font-mono font-bold text-emerald-400">
                    +{targetSnap.evidenceCount - baseSnap.evidenceCount} items
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
