'use client';

import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { BankStatement } from '@/types/investigation';

interface DuplicateWarningModalProps {
  existingStatement: BankStatement;
  onClose: () => void;
  onImportAnyway: () => void;
  onReviewExisting: () => void;
}

export const DuplicateWarningModal: React.FC<DuplicateWarningModalProps> = ({
  existingStatement,
  onClose,
  onImportAnyway,
  onReviewExisting,
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-amber-500/40 rounded-xl max-w-md w-full p-6 text-left shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="w-5 h-5" />
            <h3>Possible Duplicate Statement</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          A bank statement with a matching file name and transaction count is already imported in this workspace.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-slate-400">File Name:</span>
            <span className="text-slate-200 font-bold truncate max-w-[180px]">
              {existingStatement.fileName}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Bank:</span>
            <span className="text-slate-200">{existingStatement.bankName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Account:</span>
            <span className="text-slate-200">{existingStatement.accountNumberMasked}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Transactions:</span>
            <span className="text-emerald-400 font-bold">
              {existingStatement.rowCount.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Imported On:</span>
            <span className="text-slate-400">
              {new Date(existingStatement.importedAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400">
          Importing this file again may result in duplicate transaction records in your statistics.
        </p>

        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
          <button
            onClick={onReviewExisting}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium py-2 px-3.5 rounded-lg transition-colors"
          >
            Review Existing Statement
          </button>
          <button
            onClick={onImportAnyway}
            className="text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Import Anyway
          </button>
        </div>
      </div>
    </div>
  );
};
