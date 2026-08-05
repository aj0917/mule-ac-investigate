'use client';

import React, { useState } from 'react';
import { X, GitCompare, Shield, ArrowRight, Layers, ArrowRightLeft, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { InvestigationCase } from '@/types/case';
import { Transaction, BankStatement } from '@/types/investigation';
import { getStoredCases } from '@/lib/caseStorage';
import { formatCurrencyINR } from '@/lib/storage';

interface CaseComparisonModalProps {
  currentCase: InvestigationCase;
  allTransactions: Transaction[];
  allStatements: BankStatement[];
  onClose: () => void;
  onOpenAccount: (accId: string) => void;
}

export const CaseComparisonModal: React.FC<CaseComparisonModalProps> = ({
  currentCase,
  allTransactions,
  allStatements,
  onClose,
  onOpenAccount,
}) => {
  const allCases = getStoredCases();
  const otherCases = allCases.filter((c) => c.id !== currentCase.id);

  const [targetCaseId, setTargetCaseId] = useState<string>(otherCases[0]?.id || '');
  const targetCase = otherCases.find((c) => c.id === targetCaseId) || otherCases[0];

  if (!targetCase) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-100">No Other Cases Available</h3>
          <p className="text-xs text-slate-400">
            Create at least two investigation cases to run multi-case comparative analysis and detect shared accounts or counterparties.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-semibold rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Derive Account Numbers for case A and case B
  const caseAAccs = currentCase.accounts.map((a) => a.accountId);
  const caseBAccs = targetCase.accounts.map((a) => a.accountId);

  // Shared Accounts
  const sharedAccounts = caseAAccs.filter((acc) => caseBAccs.includes(acc));

  // Case A & Case B transactions
  const txnsA = allTransactions.filter(
    (t) =>
      currentCase.transactions.some((ct) => ct.transactionId === t.id || ct.transactionId === t.transactionId) ||
      caseAAccs.includes(t.accountNumber || '') ||
      caseAAccs.includes(t.senderAccount || '') ||
      caseAAccs.includes(t.receiverAccount || '')
  );

  const txnsB = allTransactions.filter(
    (t) =>
      targetCase.transactions.some((ct) => ct.transactionId === t.id || ct.transactionId === t.transactionId) ||
      caseBAccs.includes(t.accountNumber || '') ||
      caseBAccs.includes(t.senderAccount || '') ||
      caseBAccs.includes(t.receiverAccount || '')
  );

  // Counterparties for case A and case B
  const counterpartiesA = Array.from(
    new Set(txnsA.map((t) => t.beneficiary || t.receiverAccount || t.senderAccount).filter(Boolean))
  );
  const counterpartiesB = Array.from(
    new Set(txnsB.map((t) => t.beneficiary || t.receiverAccount || t.senderAccount).filter(Boolean))
  );

  // Shared Counterparties
  const sharedCounterparties = counterpartiesA.filter((cp) => counterpartiesB.includes(cp));

  const moneyInA = txnsA.reduce((sum, t) => sum + (t.creditAmount || 0), 0);
  const moneyOutA = txnsA.reduce((sum, t) => sum + (t.debitAmount || 0), 0);

  const moneyInB = txnsB.reduce((sum, t) => sum + (t.creditAmount || 0), 0);
  const moneyOutB = txnsB.reduce((sum, t) => sum + (t.debitAmount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>Multi-Case Comparative Analysis</span>
                <span className="text-[10px] font-semibold text-purple-400 px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30">
                  Step 10
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Compare accounts, transactions, shared counterparties, and network overlap across cases.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Target Selector */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Compare Current Case ({currentCase.caseNumber}) with:
              </span>
            </div>
            <select
              value={targetCaseId}
              onChange={(e) => setTargetCaseId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-semibold focus:outline-none focus:border-purple-500"
            >
              {otherCases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {/* Side by side comparison metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Case A */}
            <div className="bg-slate-950 border border-blue-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    PRIMARY INVESTIGATION (CASE A)
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-100 font-mono mt-0.5">
                    {currentCase.caseNumber}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium truncate max-w-xs">{currentCase.title}</p>
                </div>
                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {currentCase.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Accounts</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{caseAAccs.length}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Transactions</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{txnsA.length}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Money In</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatCurrencyINR(moneyInA)}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-rose-400 block uppercase font-bold">Money Out</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{formatCurrencyINR(moneyOutA)}</span>
                </div>
              </div>
            </div>

            {/* Case B */}
            <div className="bg-slate-950 border border-purple-500/30 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                    TARGET COMPARISON (CASE B)
                  </span>
                  <h3 className="text-sm font-extrabold text-slate-100 font-mono mt-0.5">
                    {targetCase.caseNumber}
                  </h3>
                  <p className="text-xs text-slate-300 font-medium truncate max-w-xs">{targetCase.title}</p>
                </div>
                <span className="px-2 py-1 text-[10px] font-bold uppercase rounded bg-purple-500/10 text-purple-400 border border-purple-500/30">
                  {targetCase.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Linked Accounts</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{caseBAccs.length}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase font-bold">Transactions</span>
                  <span className="font-mono font-bold text-slate-100 text-sm">{txnsB.length}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-emerald-400 block uppercase font-bold">Money In</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{formatCurrencyINR(moneyInB)}</span>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-rose-400 block uppercase font-bold">Money Out</span>
                  <span className="font-mono font-bold text-rose-400 text-sm">{formatCurrencyINR(moneyOutB)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overlap Summary */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-amber-400" />
              <span>Observed Overlap & Shared Entities</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Shared Accounts */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Shared Accounts</span>
                  <span className="font-mono font-bold text-amber-400 text-xs">{sharedAccounts.length} Observed</span>
                </div>
                {sharedAccounts.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No direct account overlap between Case A & Case B.</p>
                ) : (
                  <div className="space-y-2">
                    {sharedAccounts.map((acc) => (
                      <div
                        key={acc}
                        className="bg-slate-900 p-2.5 rounded-lg border border-amber-500/30 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-amber-400">{acc}</span>
                        <button
                          onClick={() => {
                            onClose();
                            onOpenAccount(acc);
                          }}
                          className="text-[11px] text-blue-400 hover:underline font-semibold"
                        >
                          Account Intelligence &rarr;
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Shared Counterparties */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">Shared Counterparties</span>
                  <span className="font-mono font-bold text-purple-400 text-xs">
                    {sharedCounterparties.length} Observed
                  </span>
                </div>
                {sharedCounterparties.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No shared counterparties identified in current dataset.</p>
                ) : (
                  <div className="space-y-2">
                    {sharedCounterparties.map((cp) => (
                      <div
                        key={cp}
                        className="bg-slate-900 p-2.5 rounded-lg border border-purple-500/30 flex items-center justify-between text-xs"
                      >
                        <span className="font-mono font-bold text-purple-300 truncate max-w-xs">{cp}</span>
                        <span className="text-[10px] text-slate-400 font-semibold uppercase">Observed Link</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/90 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition-colors"
          >
            Close Comparative Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
