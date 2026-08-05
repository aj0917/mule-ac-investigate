'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Transaction } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { parseTransactionTimestamp } from '@/lib/timelineAnalytics';

interface TransactionTimelineTabProps {
  transactions: Transaction[];
  onSelectTransaction?: (txn: Transaction) => void;
  onOpenAccountIntelligence?: (accId: string) => void;
}

export const TransactionTimelineTab: React.FC<TransactionTimelineTabProps> = ({
  transactions,
  onSelectTransaction,
  onOpenAccountIntelligence,
}) => {
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Sort transactions strictly chronologically ascending
  const sortedTxns = [...transactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  const filtered = sortedTxns.filter((t) => {
    if (channelFilter !== 'ALL' && t.channel !== channelFilter) return false;
    if (typeFilter !== 'ALL' && t.transactionType !== typeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchNarration = t.narration.toLowerCase().includes(q);
      const matchAcc = (t.accountNumber || '').toLowerCase().includes(q) || (t.senderAccount || '').toLowerCase().includes(q) || (t.receiverAccount || '').toLowerCase().includes(q);
      const matchId = (t.transactionId || t.utr || t.id).toLowerCase().includes(q);
      if (!matchNarration && !matchAcc && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Search & Channel Filters */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by narration, account, UTR, or transaction ID..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Channels</option>
            <option value="UPI">UPI</option>
            <option value="IMPS">IMPS</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="ATM">ATM</option>
            <option value="CASH">CASH</option>
            <option value="CHEQUE">CHEQUE</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="CREDIT">CREDIT</option>
            <option value="DEBIT">DEBIT</option>
            <option value="WITHDRAWAL">WITHDRAWAL</option>
            <option value="DEPOSIT">DEPOSIT</option>
          </select>

          <span className="text-xs text-slate-400 font-mono">
            Showing <strong className="text-slate-200">{filtered.length}</strong> / {transactions.length}
          </span>
        </div>
      </div>

      {/* Sequential Transaction List */}
      {filtered.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
          <ArrowRightLeft className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No transactions match the selected filters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t, idx) => {
            const parsed = parseTransactionTimestamp(t);
            const isCredit = t.creditAmount > 0;
            const amount = isCredit ? t.creditAmount : t.debitAmount;

            // Calculate sequence gap with previous transaction in sorted order
            let sequenceGapText = '';
            if (idx > 0) {
              const prevParsed = parseTransactionTimestamp(filtered[idx - 1]);
              const ms1 = new Date(prevParsed.timestamp).getTime();
              const ms2 = new Date(parsed.timestamp).getTime();
              if (!isNaN(ms1) && !isNaN(ms2) && ms2 >= ms1) {
                const diffMins = Math.round((ms2 - ms1) / (1000 * 60));
                if (diffMins >= 60) {
                  const hrs = Math.floor(diffMins / 60);
                  const mins = diffMins % 60;
                  sequenceGapText = `${hrs}h ${mins}m gap`;
                } else {
                  sequenceGapText = `${diffMins}m gap`;
                }
              }
            }

            return (
              <div key={t.id} className="space-y-2">
                {/* Sequence Gap Visual Divider */}
                {sequenceGapText && (
                  <div className="flex items-center justify-center space-x-2 py-1">
                    <div className="h-px bg-slate-800 flex-1" />
                    <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-blue-400" />
                      <span>{sequenceGapText} since previous transaction</span>
                    </span>
                    <div className="h-px bg-slate-800 flex-1" />
                  </div>
                )}

                {/* Transaction Item Row */}
                <div
                  onClick={() => onSelectTransaction && onSelectTransaction(t)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all cursor-pointer flex items-center justify-between flex-wrap gap-4"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-400 shrink-0">
                      #{idx + 1}
                    </span>

                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredit
                          ? 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
                          : 'bg-rose-950/50 border-rose-500/40 text-rose-400'
                      }`}
                    >
                      {isCredit ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-100 font-mono">
                          {t.utr || t.transactionId || t.id}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                          {t.channel}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{parsed.date}</span>
                        <span className="text-[10px] text-slate-300 font-mono font-semibold">{parsed.timeFormatted}</span>
                      </div>
                      <p className="text-xs text-slate-400 font-mono truncate mt-0.5 max-w-xl">
                        {t.narration}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isCredit ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isCredit ? '+' : '-'}{formatCurrencyINR(amount, false)}
                    </span>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      Bal: {t.balance !== undefined ? formatCurrencyINR(t.balance, false) : 'Reported Flow'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
