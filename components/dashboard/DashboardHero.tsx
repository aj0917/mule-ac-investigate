'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FolderSearch, Info, Database, Trash2 } from 'lucide-react';

interface DashboardHeroProps {
  hasData: boolean;
  statementsCount: number;
  onOpenUpload: () => void;
  onLoadDemoFixture?: () => void;
  onClearData?: () => void;
  onOpenTransactions?: () => void;
}

export const DashboardHero: React.FC<DashboardHeroProps> = ({
  hasData,
  statementsCount,
  onOpenUpload,
  onLoadDemoFixture,
  onClearData,
  onOpenTransactions,
}) => {
  const [showNoInvestigationTooltip, setShowNoInvestigationTooltip] = useState(false);

  const handleOpenInvestigationClick = () => {
    if (!hasData) {
      setShowNoInvestigationTooltip(true);
      setTimeout(() => setShowNoInvestigationTooltip(false), 4000);
    } else if (onOpenTransactions) {
      onOpenTransactions();
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 md:p-6 shadow-xl relative overflow-hidden">
      {/* Background visual accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Satara Cyber Money Flow Investigation Portal</span>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">
            Investigation Dashboard
          </h1>
          <p className="text-xs md:text-sm text-slate-400 leading-relaxed">
            Analyze bank transactions, trace money movement, and organize financial investigation data.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenUpload}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2.5 rounded-lg text-xs transition-all shadow-md shadow-blue-900/30 active:scale-95"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>+ Upload Bank Statement</span>
          </button>

          <div className="relative">
            <button
              onClick={handleOpenInvestigationClick}
              className={`flex items-center space-x-2 border font-medium px-4 py-2.5 rounded-lg text-xs transition-colors ${
                hasData
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-950/60 text-slate-500 border-slate-800 hover:border-slate-700'
              }`}
            >
              <FolderSearch className="w-4 h-4 text-slate-400" />
              <span>{hasData ? 'View Active Transactions' : 'Open Investigation'}</span>
            </button>

            {showNoInvestigationTooltip && !hasData && (
              <div className="absolute right-0 top-12 w-64 bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs shadow-2xl z-30 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-1">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>No Active Investigation</span>
                </div>
                <p className="text-slate-400 leading-normal">
                  No bank statements imported yet. Please upload a statement or load demo fixture to begin.
                </p>
              </div>
            )}
          </div>

          {/* Quick Demo Fixture Button */}
          {onLoadDemoFixture && !hasData && (
            <button
              onClick={onLoadDemoFixture}
              className="flex items-center space-x-1.5 bg-slate-950 hover:bg-slate-800 text-amber-300 border border-amber-500/30 px-3 py-2.5 rounded-lg text-xs transition-colors"
              title="Load demo statement with synthetic data"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Load Demo Statement</span>
            </button>
          )}

          {hasData && onClearData && (
            <button
              onClick={onClearData}
              className="p-2.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg border border-transparent hover:border-rose-900/50 transition-colors"
              title="Reset / Reset Workspace Data"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
