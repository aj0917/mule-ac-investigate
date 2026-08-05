'use client';

import React from 'react';
import { X, History, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { getStoredAnalysisRuns } from '@/lib/patternEngine';

interface AnalysisHistoryModalProps {
  onClose: () => void;
}

export const AnalysisHistoryModal: React.FC<AnalysisHistoryModalProps> = ({ onClose }) => {
  const runs = getStoredAnalysisRuns();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Analysis Run History & Audit Trail</h3>
              <p className="text-xs text-slate-400">Reproducible snapshots of prior financial pattern analysis runs</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History Table */}
        <div className="p-6 overflow-y-auto space-y-3">
          {runs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="text-slate-400 text-xs font-semibold">No historical analysis runs recorded yet.</p>
              <p className="text-[11px] text-slate-500">
                Run Pattern Analysis to create reproducible audit snapshots.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-xl overflow-hidden text-xs bg-slate-950">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Run ID</th>
                    <th className="p-3">Dataset Version</th>
                    <th className="p-3">Scope Analyzed</th>
                    <th className="p-3 text-center">Indicators Found</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-900/50">
                      <td className="p-3 font-mono font-bold text-blue-400">{r.id}</td>
                      <td className="p-3 font-mono text-slate-300">{r.datasetVersion}</td>
                      <td className="p-3 text-[11px] text-slate-400">
                        {r.scope.totalTransactionsCount.toLocaleString()} Txns, {r.scope.totalAccountsCount} Accounts
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-emerald-400">
                        {r.indicatorsCount} Indicators
                      </td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                          COMPLETED ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
