'use client';

import React from 'react';
import { X, Send, ArrowUpRight, ArrowDownLeft, ShieldCheck, Info, Calendar, ArrowRight, ExternalLink } from 'lucide-react';
import { Transaction } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface UPIIntelligenceModalProps {
  upiId: string | null;
  allTransactions: Transaction[];
  onClose: () => void;
  onSelectTransaction?: (txn: Transaction) => void;
}

export const UPIIntelligenceModal: React.FC<UPIIntelligenceModalProps> = ({
  upiId,
  allTransactions,
  onClose,
  onSelectTransaction,
}) => {
  if (!upiId) return null;

  const upiTxns = allTransactions.filter(
    (t) => t.upiId?.toLowerCase() === upiId.toLowerCase() || t.narration.toLowerCase().includes(upiId.toLowerCase())
  ).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  let totalMoneyReceived = 0;
  let totalMoneySent = 0;
  const dates: string[] = [];
  const associatedAccounts = new Set<string>();

  upiTxns.forEach((t) => {
    if (t.creditAmount > 0) totalMoneyReceived += t.creditAmount;
    if (t.debitAmount > 0) totalMoneySent += t.debitAmount;
    if (t.transactionDate) dates.push(t.transactionDate);
    if (t.accountNumber) associatedAccounts.add(t.accountNumber);
    if (t.beneficiary) associatedAccounts.add(t.beneficiary);
  });

  dates.sort();
  const firstSeen = dates[0] || 'N/A';
  const lastSeen = dates[dates.length - 1] || 'N/A';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold font-mono text-blue-400">{upiId}</span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  UPI VPA IDENTIFIER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Virtual Payment Address Intelligence Profile
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Neutral Safeguard Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start space-x-3 text-xs">
            <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-slate-300 leading-normal">
              <span className="font-bold text-slate-200">Investigative Safeguard Note:</span> Do not infer the real-world identity of a person merely from a UPI identifier. Virtual Payment Addresses can be aliased or reassigned.
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Transactions
              </span>
              <span className="text-xl font-bold text-slate-100 mt-1 block">
                {upiTxns.length} Recorded
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Money Received
              </span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">
                {formatCurrencyINR(totalMoneyReceived, false)}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Money Sent
              </span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">
                {formatCurrencyINR(totalMoneySent, false)}
              </span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Associated Entities
              </span>
              <span className="text-xl font-bold text-blue-400 mt-1 block">
                {associatedAccounts.size} Accounts
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-center justify-between px-1">
            <span>First Observed: <strong className="text-slate-200">{firstSeen}</strong></span>
            <span>Last Observed: <strong className="text-slate-200">{lastSeen}</strong></span>
          </div>

          {/* Associated Transactions List */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Associated UPI Transactions ({upiTxns.length})
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40 max-h-72 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3">Amount</th>
                    <th className="py-2.5 px-3">UTR / Ref</th>
                    <th className="py-2.5 px-3">Narration / Payee</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {upiTxns.map((t) => {
                    const isCredit = t.creditAmount > 0;
                    return (
                      <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                        <td className="py-2 px-3 font-mono text-[11px] text-slate-400">{t.transactionDate}</td>
                        <td className="py-2 px-3">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                              isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}
                          >
                            {isCredit ? 'RECEIVED' : 'SENT'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-bold">
                          <span className={isCredit ? 'text-emerald-400' : 'text-slate-200'}>
                            {formatCurrencyINR(Math.abs(t.amount), false)}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-[11px] text-blue-400">{t.utr || t.transactionId || 'N/A'}</td>
                        <td className="py-2 px-3 max-w-[200px] truncate text-[11px] text-slate-300">
                          {t.beneficiary || t.narration}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => onSelectTransaction?.(t)}
                            className="p-1 rounded hover:bg-slate-800 text-blue-400 transition-colors"
                            title="View Full Details"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            Close UPI Intelligence
          </button>
        </div>
      </div>
    </div>
  );
};
