'use client';

import React, { useState, useEffect } from 'react';
import { X, Play, ShieldCheck, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';
import { PatternAnalysisScope, PatternIndicator, Transaction, BankStatement } from '@/types/investigation';
import { runPatternAnalysis, saveAnalysisRun } from '@/lib/patternEngine';

interface RunAnalysisModalProps {
  transactions: Transaction[];
  statements: BankStatement[];
  onClose: () => void;
  onAnalysisCompleted: (indicators: PatternIndicator[]) => void;
}

const ANALYSIS_STEPS = [
  'Preparing data structure...',
  'Analyzing normalized transactions...',
  'Building entity relationship graph...',
  'Checking rapid money movement patterns...',
  'Checking split flows & fan-out branches...',
  'Checking consolidation & fan-in aggregation...',
  'Checking circular transaction cycles...',
  'Comparing activity baselines & surges...',
  'Generating explainable indicators...',
  'Analysis Complete',
];

export const RunAnalysisModal: React.FC<RunAnalysisModalProps> = ({
  transactions,
  statements,
  onClose,
  onAnalysisCompleted,
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [resultCount, setResultCount] = useState<number>(0);

  const scope: PatternAnalysisScope = {
    selectedStatementIds: statements.map((s) => s.id),
    totalStatementsCount: statements.length,
    totalTransactionsCount: transactions.length,
    totalAccountsCount: new Set(transactions.map((t) => t.accountNumber || t.senderAccount).filter(Boolean)).size,
    channels: ['UPI', 'NEFT', 'RTGS', 'IMPS', 'ATM', 'OTHER'],
  };

  const handleStartAnalysis = () => {
    setIsRunning(true);
    setCurrentStepIdx(0);

    let step = 0;
    const interval = setInterval(() => {
      step++;
      if (step < ANALYSIS_STEPS.length - 1) {
        setCurrentStepIdx(step);
      } else {
        clearInterval(interval);
        setCurrentStepIdx(ANALYSIS_STEPS.length - 1);

        // Run detection logic
        const indicators = runPatternAnalysis(transactions, statements, [], scope);
        setResultCount(indicators.length);

        // Save analysis run metadata
        saveAnalysisRun({
          id: `RUN-${Date.now().toString().slice(-6)}`,
          datasetVersion: 'V1.0',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: 'COMPLETED',
          scope,
          indicatorsCount: indicators.length,
          priorityBreakdown: {
            high: indicators.filter((i) => i.priority === 'HIGH').length,
            medium: indicators.filter((i) => i.priority === 'MEDIUM').length,
            low: indicators.filter((i) => i.priority === 'LOW').length,
          },
        });

        setIsRunning(false);
        setIsFinished(true);

        setTimeout(() => {
          onAnalysisCompleted(indicators);
        }, 1200);
      }
    }, 280);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Financial Pattern Analysis Scope</h3>
              <p className="text-xs text-slate-400">Configure parameters and initiate pattern analysis engine</p>
            </div>
          </div>

          {!isRunning && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scope Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Scope Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <span className="text-[10px] uppercase font-bold text-blue-400 block tracking-wider">
              ANALYSIS DATASET SCOPE
            </span>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Bank Statements</span>
                <span className="font-mono font-bold text-slate-200">{scope.totalStatementsCount} Selected</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Normalized Transactions</span>
                <span className="font-mono font-bold text-slate-200">{scope.totalTransactionsCount.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Identified Accounts</span>
                <span className="font-mono font-bold text-slate-200">{scope.totalAccountsCount.toLocaleString()}</span>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Transaction Channels</span>
                <span className="font-mono font-bold text-slate-200">ALL (UPI, NEFT, RTGS, IMPS, ATM)</span>
              </div>
            </div>
          </div>

          {/* Progress / Running State */}
          {isRunning && (
            <div className="space-y-3 bg-blue-600/10 border border-blue-500/30 p-4 rounded-xl animate-in fade-in">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-400 flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4 animate-spin" />
                  <span>{ANALYSIS_STEPS[currentStepIdx]}</span>
                </span>
                <span className="font-mono font-bold text-blue-400">
                  {Math.round(((currentStepIdx + 1) / ANALYSIS_STEPS.length) * 100)}%
                </span>
              </div>

              <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${((currentStepIdx + 1) / ANALYSIS_STEPS.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {isFinished && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-xs">Analysis Complete!</h4>
                <p className="text-[11px] text-slate-300">
                  Identified <strong>{resultCount}</strong> explainable pattern indicators for investigator review.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          {!isFinished && !isRunning && (
            <button
              onClick={handleStartAnalysis}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-2 shadow-lg"
            >
              <Play className="w-4 h-4" />
              <span>Run Pattern Analysis</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
