'use client';

import React, { useState } from 'react';
import { Transaction } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import {
  ArrowRightLeft,
  Search,
  Filter,
  X,
  FileText,
  AlertCircle,
  Download,
  Info,
} from 'lucide-react';

interface TransactionTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  statementFilterId?: string;
}

export const TransactionTableModal: React.FC<TransactionTableModalProps> = ({
  isOpen,
  onClose,
  transactions,
  statementFilterId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'WITHDRAWAL'>('ALL');
  const [selectedTxnForInspect, setSelectedTxnForInspect] = useState<Transaction | null>(null);

  if (!isOpen) return null;

  let filtered = transactions;

  if (statementFilterId) {
    filtered = filtered.filter((t) => t.statementId === statementFilterId);
  }

  if (selectedChannel !== 'ALL') {
    filtered = filtered.filter((t) => t.channel === selectedChannel);
  }

  if (typeFilter === 'CREDIT') {
    filtered = filtered.filter((t) => t.creditAmount > 0);
  } else if (typeFilter === 'DEBIT') {
    filtered = filtered.filter((t) => t.debitAmount > 0 && t.transactionType !== 'WITHDRAWAL');
  } else if (typeFilter === 'WITHDRAWAL') {
    filtered = filtered.filter((t) => t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM');
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (t) =>
        t.narration.toLowerCase().includes(q) ||
        (t.transactionId && t.transactionId.toLowerCase().includes(q)) ||
        (t.utr && t.utr.toLowerCase().includes(q)) ||
        (t.upiId && t.upiId.toLowerCase().includes(q)) ||
        (t.beneficiary && t.beneficiary.toLowerCase().includes(q)) ||
        (t.accountNumber && t.accountNumber.toLowerCase().includes(q))
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      {/* Source Row Inspector Modal */}
      {selectedTxnForInspect && (
        <div className="fixed inset-0 z-60 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-lg w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
                <FileText className="w-4 h-4" />
                <h3>Source Traceability Record</h3>
              </div>
              <button
                onClick={() => setSelectedTxnForInspect(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Transaction ID:</span>
                <span className="text-slate-200 font-bold">{selectedTxnForInspect.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Sheet:</span>
                <span className="text-blue-400">{selectedTxnForInspect.sourceSheet}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Source Row Number:</span>
                <span className="text-emerald-400 font-bold">
                  Row {selectedTxnForInspect.sourceRowNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Normalized Date:</span>
                <span className="text-slate-200">{selectedTxnForInspect.transactionDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Inferred Channel:</span>
                <span className="text-purple-400 font-bold">{selectedTxnForInspect.channel}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Original Statement Raw Data:
              </span>
              <pre className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                {JSON.stringify(selectedTxnForInspect.rawData, null, 2)}
              </pre>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedTxnForInspect(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs"
              >
                Close Trace Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Modal */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl shadow-2xl flex flex-col h-[90vh] overflow-hidden my-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Normalized Transactions Table</h2>
              <p className="text-[11px] text-slate-400">
                Inspect detailed transaction records, source traceability, and payment details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter narration, UTR, UPI, payee, ref..."
              className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel Filter */}
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="ALL">All Channels</option>
              <option value="UPI">UPI Only</option>
              <option value="IMPS">IMPS Only</option>
              <option value="NEFT">NEFT Only</option>
              <option value="RTGS">RTGS Only</option>
              <option value="ATM">ATM Withdrawals</option>
              <option value="CASH">Cash Transactions</option>
              <option value="CHEQUE">Cheque / Clearing</option>
              <option value="CARD">Card / POS</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none"
            >
              <option value="ALL">All Directions</option>
              <option value="CREDIT">Money In (Credits)</option>
              <option value="DEBIT">Money Out (Debits)</option>
              <option value="WITHDRAWAL">Withdrawals (ATM/Cash)</option>
            </select>
          </div>

          <div className="font-mono text-slate-400 text-[11px]">
            Showing <span className="font-bold text-slate-200">{filtered.length}</span> of{' '}
            {transactions.length} records
          </div>
        </div>

        {/* Transactions Table Content */}
        <div className="flex-1 overflow-auto bg-slate-950">
          {filtered.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <p className="text-xs font-semibold text-slate-300">No matching transactions found</p>
              <p className="text-[11px] text-slate-500">Try adjusting your search query or channel filter.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 uppercase font-semibold text-slate-400 text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Narration / Particulars</th>
                  <th className="py-2.5 px-3">Channel</th>
                  <th className="py-2.5 px-3">Ref / UTR / UPI</th>
                  <th className="py-2.5 px-3 text-right">Debit (Money Out)</th>
                  <th className="py-2.5 px-3 text-right">Credit (Money In)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-3 text-center">Trace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {filtered.map((txn) => (
                  <tr
                    key={txn.id}
                    className={`hover:bg-slate-900/40 transition-colors ${
                      txn.hasReviewIssue ? 'bg-amber-950/10' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                      {txn.transactionDate}
                    </td>

                    <td className="py-2.5 px-3 max-w-xs md:max-w-md">
                      <div className="font-medium text-slate-100 truncate" title={txn.narration}>
                        {txn.narration}
                      </div>
                      {txn.beneficiary && (
                        <span className="text-[10px] text-blue-400 block font-mono">
                          Payee: {txn.beneficiary}
                        </span>
                      )}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-400">
                        {txn.channel}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 max-w-[160px] truncate">
                      {txn.upiId ? (
                        <span className="text-emerald-400 font-semibold">{txn.upiId}</span>
                      ) : (
                        txn.utr || txn.transactionId || '—'
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-amber-400 whitespace-nowrap">
                      {txn.debitAmount > 0 ? formatCurrencyINR(txn.debitAmount, false) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                      {txn.creditAmount > 0 ? formatCurrencyINR(txn.creditAmount, false) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono text-slate-400 whitespace-nowrap">
                      {txn.balance ? formatCurrencyINR(txn.balance, false) : '—'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedTxnForInspect(txn)}
                        className="p-1.5 rounded bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 transition-colors"
                        title="View Raw Source Row Traceability"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
