'use client';

import React from 'react';
import { formatCurrencyINR } from '@/lib/storage';
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft, FileSpreadsheet } from 'lucide-react';

interface ImportSummaryProps {
  fileName: string;
  selectedSheetName: string;
  totalRows: number;
  validRowsCount: number;
  reviewRowsCount: number;
  estimatedCredits: number;
  estimatedDebits: number;
  dateRangeStr: string;
  onConfirmImport: () => void;
  onBackToMapping: () => void;
}

export const ImportSummary: React.FC<ImportSummaryProps> = ({
  fileName,
  selectedSheetName,
  totalRows,
  validRowsCount,
  reviewRowsCount,
  estimatedCredits,
  estimatedDebits,
  dateRangeStr,
  onConfirmImport,
  onBackToMapping,
}) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span>Ready to Import Statement</span>
        </h3>
        <p className="text-xs text-slate-400">
          Review the normalized summary before committing transaction records to the investigation portal.
        </p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2 border-r border-slate-800/80 pr-4">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Source File:</span>
              <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                {fileName}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Selected Sheet:</span>
              <span className="font-semibold text-blue-400">{selectedSheetName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Rows Detected:</span>
              <span className="font-mono font-semibold text-slate-200">
                {totalRows.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Estimated Date Range:</span>
              <span className="font-mono text-slate-300">{dateRangeStr}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Valid Transactions:</span>
              <span className="font-mono font-bold text-emerald-400">
                {validRowsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Rows Requiring Review:</span>
              <span className={`font-mono font-bold ${reviewRowsCount > 0 ? 'text-amber-400' : 'text-slate-500'}`}>
                {reviewRowsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Estimated Money In (Credits):</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatCurrencyINR(estimatedCredits)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Estimated Money Out (Debits):</span>
              <span className="font-mono font-bold text-amber-400">
                {formatCurrencyINR(estimatedDebits)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          onClick={onBackToMapping}
          className="flex items-center space-x-1.5 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Mapping</span>
        </button>

        <button
          onClick={onConfirmImport}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-blue-900/30"
        >
          <span>Import Statement</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
