'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface ImportProgressProps {
  onComplete: () => void;
}

const STAGES = [
  'Reading statement file structure...',
  'Detecting statement column mapping...',
  'Normalizing transaction dates to standard ISO format...',
  'Cleaning financial debit/credit amounts...',
  'Categorizing UPI, IMPS, NEFT, ATM payment channels...',
  'Generating source traceability row metadata...',
  'Building account identity indices...',
];

export const ImportProgress: React.FC<ImportProgressProps> = ({ onComplete }) => {
  const [currentStage, setCurrentStage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStage((prev) => {
        if (prev >= STAGES.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 450);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="py-12 px-4 text-center space-y-6 max-w-md mx-auto">
      <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400 flex items-center justify-center mx-auto shadow-inner">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-bold text-slate-100">Importing Statement...</h3>
        <p className="text-xs text-slate-400">
          Normalizing financial transactions and indexing account entities
        </p>
      </div>

      {/* Checklist */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-2 text-xs font-mono">
        {STAGES.map((stageText, idx) => {
          const isDone = idx < currentStage;
          const isCurrent = idx === currentStage;

          return (
            <div key={idx} className="flex items-center space-x-3 transition-all">
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-blue-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span
                className={`${
                  isDone
                    ? 'text-slate-300'
                    : isCurrent
                    ? 'text-blue-300 font-semibold'
                    : 'text-slate-600'
                }`}
              >
                {stageText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
