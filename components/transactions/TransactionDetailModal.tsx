'use client';

import React, { useState } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  FileSpreadsheet,
  Building2,
  Calendar,
  CreditCard,
  Layers,
  ShieldCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  ChevronRight,
  Send,
  UserCheck,
  GitMerge,
  StickyNote,
} from 'lucide-react';
import { Transaction, BankStatement } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { getTransactionContext } from '@/lib/intelligence';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  allTransactions: Transaction[];
  statements: BankStatement[];
  onClose: () => void;
  onSelectAccount?: (accountId: string) => void;
  onSelectTransaction?: (txn: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  allTransactions,
  statements,
  onClose,
  onSelectAccount,
  onSelectTransaction,
}) => {
  const [showRawSource, setShowRawSource] = useState(false);
  const [showNoteNotice, setShowNoteNotice] = useState(false);

  if (!transaction) return null;

  const context = getTransactionContext(transaction.id, allTransactions);
  const statement = statements.find((s) => s.id === transaction.statementId);

  const isCredit = transaction.creditAmount > 0;
  const isWithdrawal = transaction.transactionType === 'WITHDRAWAL' || transaction.channel === 'ATM';

  // Confidence calculation
  let confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'HIGH';
  let confidenceReason = 'Transaction possesses verifiable reference number, channel, and source mapping.';
  if (!transaction.utr && !transaction.transactionId) {
    confidenceLevel = 'MEDIUM';
    confidenceReason = 'Transaction mapped without explicit UTR/reference number in source statement.';
  }
  if (!transaction.beneficiary && !transaction.upiId) {
    confidenceLevel = 'LOW';
    confidenceReason = 'Counterparty identification limited due to generic source narration.';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold shrink-0 ${
                isCredit
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : isWithdrawal
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
              }`}
            >
              {isCredit ? 'IN' : isWithdrawal ? 'ATM' : 'OUT'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-slate-100">
                  {transaction.transactionId || transaction.utr || transaction.id}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {transaction.channel}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase rounded ${
                    isCredit
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : isWithdrawal
                      ? 'bg-purple-500/20 text-purple-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {transaction.transactionType}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Date: <span className="text-slate-200">{transaction.transactionDate}</span>
                {transaction.valueDate && ` | Value Date: ${transaction.valueDate}`}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowNoteNotice(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center space-x-1.5 border border-slate-700"
            >
              <StickyNote className="w-3.5 h-3.5 text-blue-400" />
              <span>Add Note</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showNoteNotice && (
          <div className="bg-blue-950/60 border-b border-blue-800/60 p-3 px-6 flex items-center justify-between text-xs text-blue-300">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>Investigation notes module will be available in a future update.</span>
            </div>
            <button onClick={() => setShowNoteNotice(false)} className="text-blue-400 hover:text-blue-200 text-xs">
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Key Metrics Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Transaction Amount
              </span>
              <span
                className={`text-xl font-bold mt-1 block ${
                  isCredit ? 'text-emerald-400' : 'text-slate-100'
                }`}
              >
                {formatCurrencyINR(Math.abs(transaction.amount), false)}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Credit / Debit Breakdown
              </span>
              <div className="mt-1 text-xs space-y-0.5">
                {transaction.creditAmount > 0 && (
                  <span className="text-emerald-400 font-semibold block">
                    Credit: +{formatCurrencyINR(transaction.creditAmount, false)}
                  </span>
                )}
                {transaction.debitAmount > 0 && (
                  <span className="text-amber-400 font-semibold block">
                    Debit: -{formatCurrencyINR(transaction.debitAmount, false)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Resulting Balance
              </span>
              <span className="text-sm font-semibold text-slate-200 mt-1 block">
                {transaction.balance !== undefined && transaction.balance !== 0
                  ? formatCurrencyINR(transaction.balance, false)
                  : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Data Confidence
              </span>
              <div className="mt-1 flex items-center space-x-1.5">
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    confidenceLevel === 'HIGH'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : confidenceLevel === 'MEDIUM'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}
                >
                  {confidenceLevel} CONFIDENCE
                </span>
              </div>
            </div>
          </div>

          {/* Transaction Sequential Context Chain */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Transaction Context Chain (Sequential Order)</span>
              </h4>
              <span className="text-[11px] text-slate-500">Immediate chronological preceding & succeeding events</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Previous */}
              <div
                onClick={() => context?.previous && onSelectTransaction?.(context.previous)}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  context?.previous
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-900/60 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <ArrowLeft className="w-3 h-3" />
                    <span>Previous Event</span>
                  </span>
                  <span>{context?.previous?.transactionDate || 'None'}</span>
                </div>
                {context?.previous ? (
                  <div>
                    <span
                      className={`font-bold block ${
                        context.previous.creditAmount > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {context.previous.creditAmount > 0 ? '+' : '-'}
                      {formatCurrencyINR(Math.abs(context.previous.amount), false)}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {context.previous.beneficiary || context.previous.narration}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 italic">No preceding transaction in statement</p>
                )}
              </div>

              {/* Current */}
              <div className="p-3 rounded-lg bg-blue-950/40 border-2 border-blue-500/50 text-xs shadow-md">
                <div className="flex items-center justify-between text-blue-400 mb-1">
                  <span className="font-bold text-[10px] uppercase tracking-wider">CURRENT TRANSACTION</span>
                  <span>{transaction.transactionDate}</span>
                </div>
                <span className="font-bold text-sm text-slate-100 block">
                  {formatCurrencyINR(Math.abs(transaction.amount), false)}
                </span>
                <p className="text-[11px] text-blue-200 truncate mt-0.5">
                  {transaction.beneficiary || transaction.upiId || 'Direct Statement Event'}
                </p>
              </div>

              {/* Next */}
              <div
                onClick={() => context?.next && onSelectTransaction?.(context.next)}
                className={`p-3 rounded-lg border text-xs transition-all ${
                  context?.next
                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer'
                    : 'bg-slate-950/40 border-slate-900/60 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span className="font-semibold text-[10px] uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                    <span>Next Event</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                  <span>{context?.next?.transactionDate || 'None'}</span>
                </div>
                {context?.next ? (
                  <div>
                    <span
                      className={`font-bold block ${
                        context.next.creditAmount > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {context.next.creditAmount > 0 ? '+' : '-'}
                      {formatCurrencyINR(Math.abs(context.next.amount), false)}
                    </span>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {context.next.beneficiary || context.next.narration}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-600 italic">No subsequent transaction in statement</p>
                )}
              </div>
            </div>
          </div>

          {/* Primary Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Transaction Identification & Parties */}
            <div className="space-y-4">
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  Transaction Identification
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Transaction ID / Ref:</span>
                    <span className="font-mono text-slate-200 font-semibold">{transaction.transactionId || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">UTR Reference:</span>
                    <span className="font-mono text-blue-400 font-bold">{transaction.utr || 'N/A'}</span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Transaction Channel:</span>
                    <span className="font-semibold text-slate-200">{transaction.channel}</span>
                  </div>

                  {transaction.chequeNumber && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Cheque Number:</span>
                      <span className="font-mono text-slate-200">{transaction.chequeNumber}</span>
                    </div>
                  )}

                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Processing Date:</span>
                    <span className="text-slate-200">{transaction.transactionDate}</span>
                  </div>
                </div>
              </div>

              {/* Counterparty / Accounts Information */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800/80 pb-2">
                  Entities & Counterparty
                </h4>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-900">
                    <span className="text-slate-400">Beneficiary / Payee:</span>
                    <span className="font-semibold text-slate-100">{transaction.beneficiary || 'N/A'}</span>
                  </div>

                  {transaction.upiId && (
                    <div className="flex justify-between items-center py-1 border-b border-slate-900">
                      <span className="text-slate-400">UPI Identifier:</span>
                      <span className="font-mono text-blue-400 font-semibold">{transaction.upiId}</span>
                    </div>
                  )}

                  {transaction.bankName && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">Bank Name:</span>
                      <span className="text-slate-200">{transaction.bankName}</span>
                    </div>
                  )}

                  {transaction.ifsc && (
                    <div className="flex justify-between py-1 border-b border-slate-900">
                      <span className="text-slate-400">IFSC Code:</span>
                      <span className="font-mono text-slate-200">{transaction.ifsc}</span>
                    </div>
                  )}

                  {transaction.accountNumber && (
                    <div className="flex justify-between items-center py-1">
                      <span className="text-slate-400">Counterparty Account:</span>
                      <button
                        onClick={() => onSelectAccount?.(transaction.accountNumber!)}
                        className="text-blue-400 hover:underline font-mono text-xs flex items-center space-x-1"
                      >
                        <span>{transaction.accountNumber}</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Narration, Source Traceability, Rationale */}
            <div className="space-y-4">
              {/* Narration */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Raw Statement Narration
                </h4>
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300 break-all leading-relaxed">
                  {transaction.narration}
                </div>
              </div>

              {/* Source Information & Traceability */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" />
                    <span>Source Statement Metadata</span>
                  </h4>
                  <button
                    onClick={() => setShowRawSource(!showRawSource)}
                    className="text-xs text-blue-400 hover:underline font-medium"
                  >
                    {showRawSource ? 'Hide Raw Row' : 'View Original Source Row'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Source Statement File:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[200px]">
                      {statement?.fileName || 'Uploaded Statement'}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">Source Sheet / Excel Tab:</span>
                    <span className="text-slate-200">{transaction.sourceSheet || 'Sheet1'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Source Row Number:</span>
                    <span className="font-mono text-slate-200">Row #{transaction.sourceRowNumber}</span>
                  </div>
                </div>

                {showRawSource && (
                  <div className="mt-3 p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                      Original Key-Value Pair Mapping (Row #{transaction.sourceRowNumber})
                    </span>
                    <pre className="text-[11px] font-mono text-emerald-300/90 overflow-x-auto whitespace-pre-wrap max-h-48">
                      {JSON.stringify(transaction.rawData, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              {/* Confidence Rationale Callout */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-start space-x-2.5 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-200 block">Confidence Assessment Rationale:</span>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-normal">{confidenceReason}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              disabled
              className="px-3 py-1.5 rounded-lg bg-slate-800/60 text-slate-500 text-xs font-medium cursor-not-allowed border border-slate-800 flex items-center space-x-1.5"
              title="Money Flow Graph Tracing will be available in Step 4"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Trace Money Flow (Step 4)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
