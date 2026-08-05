'use client';

import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileCode, FileText, ShieldCheck, CheckCircle2, History } from 'lucide-react';
import { ReportExportRecord } from '@/types/report';
import { getExportHistory } from '@/lib/reportStorage';

export const ExportHistoryPanel: React.FC = () => {
  const [history] = useState<ReportExportRecord[]>(() => getExportHistory());

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Report Export Audit History</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {history.length} EXPORTS RECORDED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Immutable log of generated PDF, CSV, XLSX, and JSON report exports with SHA-256 verification hashes.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <th className="p-3.5">Export ID</th>
                <th className="p-3.5">Report ID</th>
                <th className="p-3.5">Format</th>
                <th className="p-3.5">Dataset Version</th>
                <th className="p-3.5">Analysis Run</th>
                <th className="p-3.5">SHA-256 Hash</th>
                <th className="p-3.5">Export Timestamp</th>
                <th className="p-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500 text-xs">
                    No export events recorded yet. Generate or export a report to create audit history entries.
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-blue-400">{item.id}</td>
                    <td className="p-3.5 font-mono text-slate-300">{item.reportId}</td>
                    <td className="p-3.5 font-bold">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          item.format === 'PDF'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : item.format === 'CSV'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : item.format === 'XLSX'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        }`}
                      >
                        {item.format}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-400">{item.datasetVersion}</td>
                    <td className="p-3.5 font-mono text-slate-400">{item.analysisRun}</td>
                    <td className="p-3.5 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                      {item.hash}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px]">
                      {new Date(item.generatedAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 text-right">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
