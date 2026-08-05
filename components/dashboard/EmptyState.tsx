'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, ShieldAlert, ArrowRight, Check, Database } from 'lucide-react';

interface EmptyStateProps {
  onOpenUpload: () => void;
  onLoadDemoFixture?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onOpenUpload,
  onLoadDemoFixture,
}) => {
  const [showFormatsModal, setShowFormatsModal] = useState(false);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
      {/* Background radial highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-xl mx-auto space-y-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
          <FileSpreadsheet className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold tracking-wider text-blue-400 uppercase bg-blue-950/60 border border-blue-900/50 px-3 py-1 rounded-full">
            Satara Cyber Crime Investigation Portal
          </span>
          <h2 className="text-2xl font-bold text-slate-100 tracking-tight">
            Start Your Investigation
          </h2>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed max-w-md mx-auto">
            Upload a bank statement to begin analyzing transaction activity, identifying unique accounts, and mapping money movement.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenUpload}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl text-xs transition-all shadow-lg shadow-blue-900/40 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Upload Bank Statement</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowFormatsModal(true)}
            className="w-full sm:w-auto text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-3 rounded-xl transition-colors font-medium"
          >
            View Supported Formats
          </button>
        </div>

        {/* Demo Data Option */}
        {onLoadDemoFixture && (
          <div className="pt-4 border-t border-slate-800/80 max-w-sm mx-auto">
            <button
              onClick={onLoadDemoFixture}
              className="w-full flex items-center justify-center space-x-2 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-4 py-2.5 rounded-xl text-xs transition-colors font-medium"
            >
              <Database className="w-4 h-4" />
              <span>Load Sample Synthetic Statement (Demo Data)</span>
            </button>
            <span className="text-[10px] text-amber-500/80 mt-1 block font-mono uppercase tracking-wider">
              DEMO DATA • NOT REAL INVESTIGATION DATA
            </span>
          </div>
        )}

        {/* Supported Format Pills */}
        <div className="pt-2 flex items-center justify-center space-x-3 text-xs text-slate-400 font-mono">
          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            CSV
          </span>
          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            XLSX
          </span>
          <span className="bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-md text-slate-300">
            XLS
          </span>
        </div>
      </div>

      {/* Formats Info Modal */}
      {showFormatsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-100 text-sm">Supported Bank Statement Formats</h3>
              <button
                onClick={() => setShowFormatsModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start space-x-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Comma-Separated Values (.csv)</div>
                  <p className="text-slate-400 text-[11px]">
                    Standard bank exported CSV statements. Multi-column date, narration, debit, credit, balance headers supported.
                  </p>
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-start space-x-3">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-200">Excel Spreadsheets (.xlsx, .xls)</div>
                  <p className="text-slate-400 text-[11px]">
                    Supports multi-sheet workbooks (e.g. HDFC, SBI, ICICI, Axis). The portal lets you select the exact statement worksheet.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowFormatsModal(false)}
                className="bg-blue-600 text-white font-medium py-1.5 px-4 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
