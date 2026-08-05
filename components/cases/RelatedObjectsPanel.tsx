'use client';

import React from 'react';
import { X, Layers, Users, ArrowRightLeft, Shield, FileText, ChevronRight } from 'lucide-react';
import { InvestigationCase } from '@/types/case';
import { Transaction } from '@/types/investigation';

interface RelatedObjectsPanelProps {
  isOpen: boolean;
  selectedEntity: {
    type: 'Account' | 'Transaction' | 'Pattern' | 'Evidence' | 'Finding';
    id: string;
    title: string;
  } | null;
  caseObj: InvestigationCase;
  allTransactions: Transaction[];
  onClose: () => void;
  onOpenAccount: (accId: string) => void;
}

export const RelatedObjectsPanel: React.FC<RelatedObjectsPanelProps> = ({
  isOpen,
  selectedEntity,
  caseObj,
  allTransactions,
  onClose,
  onOpenAccount,
}) => {
  if (!isOpen || !selectedEntity) return null;

  // Compute related entities based on selectedEntity
  const relatedAccounts = caseObj.accounts;
  const relatedTransactions = allTransactions.slice(0, 5);
  const relatedEvidence = caseObj.evidenceItems;
  const relatedFindings = caseObj.findings;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-400" />
            <div>
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                Related Objects Matrix
              </h3>
              <span className="text-[10px] text-blue-400 font-mono">
                {selectedEntity.type}: {selectedEntity.title}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Related Accounts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Related Accounts ({relatedAccounts.length})</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {relatedAccounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => onOpenAccount(acc.accountId)}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-blue-500/40 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div>
                    <span className="font-mono font-bold text-blue-400 block">{acc.accountId}</span>
                    <span className="text-[10px] text-slate-400">{acc.relationshipRole}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                </div>
              ))}
            </div>
          </div>

          {/* Related Transactions */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <ArrowRightLeft className="w-3.5 h-3.5 text-emerald-400" />
                <span>Related Transactions ({relatedTransactions.length})</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {relatedTransactions.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex justify-between font-mono">
                    <span className="text-slate-300 font-bold">{t.transactionId}</span>
                    <span
                      className={`font-bold ${
                        t.transactionType === 'DEBIT' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      ₹{t.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block truncate">{t.narration}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Evidence */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Related Evidence ({relatedEvidence.length})</span>
              </span>
            </div>
            <div className="space-y-1.5">
              {relatedEvidence.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">{ev.title}</span>
                    <span className="text-[9px] font-bold text-purple-400 uppercase px-1.5 py-0.5 rounded bg-purple-500/10">
                      {ev.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono block">Hash: {ev.hash.slice(0, 16)}...</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-slate-800 bg-slate-900/90 text-[10px] text-slate-500 text-center">
          Traceable Investigation Relationships Panel
        </div>
      </div>
    </div>
  );
};
