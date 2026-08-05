'use client';

import React from 'react';
import { SheetData } from '@/types/investigation';
import { Layers, CheckCircle2, FileText, ChevronRight } from 'lucide-react';

interface SheetSelectorProps {
  sheets: SheetData[];
  selectedSheetName: string;
  onSelectSheet: (sheetName: string) => void;
  onContinue: () => void;
}

export const SheetSelector: React.FC<SheetSelectorProps> = ({
  sheets,
  selectedSheetName,
  onSelectSheet,
  onContinue,
}) => {
  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>Select Statement Sheet</span>
        </h3>
        <p className="text-xs text-slate-400">
          This Excel workbook contains multiple worksheets. Please select the sheet containing the transaction records.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {sheets.map((s) => {
          const isSelected = selectedSheetName === s.sheetName;
          return (
            <button
              key={s.sheetName}
              onClick={() => onSelectSheet(s.sheetName)}
              className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                isSelected
                  ? 'bg-blue-600/15 border-blue-500 text-slate-100 shadow-md shadow-blue-900/20'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="font-bold text-xs truncate max-w-[180px]">{s.sheetName}</div>
                  <div className="text-[11px] font-mono text-slate-400">
                    {s.rowCount.toLocaleString('en-IN')} transaction rows
                  </div>
                </div>
              </div>

              {isSelected && <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Selected sheet preview summary */}
      {selectedSheetName && (
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
          <div className="text-xs space-y-0.5">
            <span className="text-slate-400">Selected Sheet: </span>
            <span className="font-bold text-slate-200">{selectedSheetName}</span>
            <span className="text-slate-500 text-[11px] block font-mono">
              Headers detected: {sheets.find((s) => s.sheetName === selectedSheetName)?.headers.join(', ')}
            </span>
          </div>

          <button
            onClick={onContinue}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg text-xs transition-colors shrink-0"
          >
            <span>Continue to Mapping</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
