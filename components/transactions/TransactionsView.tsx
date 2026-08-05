'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Search,
  Filter,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  Send,
  Download,
} from 'lucide-react';
import { Transaction, BankStatement, TransactionChannel } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { TransactionDetailModal } from './TransactionDetailModal';
import { UPIIntelligenceModal } from './UPIIntelligenceModal';

interface TransactionsViewProps {
  transactions: Transaction[];
  statements: BankStatement[];
  onSelectAccount?: (accountId: string) => void;
  onOpenUpload?: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  statements,
  onSelectAccount,
  onOpenUpload,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatementId, setSelectedStatementId] = useState<string>('ALL');
  const [selectedChannel, setSelectedChannel] = useState<string>('ALL');
  const [selectedType, setSelectedType] = useState<'ALL' | 'CREDIT' | 'DEBIT' | 'WITHDRAWAL'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [inspectTxn, setInspectTxn] = useState<Transaction | null>(null);
  const [inspectUpi, setInspectUpi] = useState<string | null>(null);

  // Filter transactions
  const filteredTxns = transactions.filter((t) => {
    if (selectedStatementId !== 'ALL' && t.statementId !== selectedStatementId) return false;

    if (selectedType === 'CREDIT' && t.creditAmount <= 0) return false;
    if (selectedType === 'DEBIT' && (t.debitAmount <= 0 || t.transactionType === 'WITHDRAWAL')) return false;
    if (selectedType === 'WITHDRAWAL' && t.transactionType !== 'WITHDRAWAL' && t.channel !== 'ATM') return false;

    if (selectedChannel !== 'ALL' && t.channel !== selectedChannel) return false;

    if (dateFrom && t.transactionDate < dateFrom) return false;
    if (dateTo && t.transactionDate > dateTo) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchNarration = t.narration.toLowerCase().includes(q);
      const matchRef = (t.utr || t.transactionId || '').toLowerCase().includes(q);
      const matchBeneficiary = (t.beneficiary || '').toLowerCase().includes(q);
      const matchUpi = (t.upiId || '').toLowerCase().includes(q);
      const matchAcc = (t.accountNumber || '').toLowerCase().includes(q);
      if (!matchNarration && !matchRef && !matchBeneficiary && !matchUpi && !matchAcc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <ArrowRightLeft className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">Transaction Intelligence Hub</h2>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {transactions.length} Total Records
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unified search and analysis across all imported statement transactions
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import More Statements</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Universal Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search narration, UTR, Txn ID, UPI ID, beneficiary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Statement Select */}
          <select
            value={selectedStatementId}
            onChange={(e) => setSelectedStatementId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Statements ({statements.length})</option>
            {statements.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fileName} ({s.bankName})
              </option>
            ))}
          </select>

          {/* Channel Select */}
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="UPI">UPI</option>
            <option value="IMPS">IMPS</option>
            <option value="NEFT">NEFT</option>
            <option value="RTGS">RTGS</option>
            <option value="ATM">ATM / Cash WDL</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card</option>
          </select>
        </div>

        {/* Type Toggles */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            {(['ALL', 'CREDIT', 'DEBIT', 'WITHDRAWAL'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`px-3 py-1 rounded font-semibold text-[11px] transition-colors ${
                  selectedType === type ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All Types' : type === 'CREDIT' ? 'Credits' : type === 'DEBIT' ? 'Debits' : 'Cash/ATM'}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400">
            Showing <strong className="text-slate-200">{filteredTxns.length}</strong> of{' '}
            <strong className="text-slate-200">{transactions.length}</strong> transactions
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">Transaction ID / UTR</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Beneficiary / Payee</th>
                <th className="py-3 px-3">Channel</th>
                <th className="py-3 px-3">Account</th>
                <th className="py-3 px-3">Narration</th>
                <th className="py-3 px-3 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {filteredTxns.length > 0 ? (
                filteredTxns.map((t) => {
                  const isCredit = t.creditAmount > 0;
                  const isWithdrawal = t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM';

                  return (
                    <tr key={t.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {t.transactionDate}
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px] text-blue-400 font-semibold">
                        {t.utr || t.transactionId || 'N/A'}
                      </td>

                      <td className="py-2.5 px-3">
                        <span
                          className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                            isCredit
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : isWithdrawal
                              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {isCredit ? 'CREDIT' : isWithdrawal ? 'ATM WDL' : 'DEBIT'}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-bold text-slate-100 whitespace-nowrap">
                        {formatCurrencyINR(Math.abs(t.amount), false)}
                      </td>

                      <td className="py-2.5 px-3 max-w-[150px] truncate">
                        {t.upiId ? (
                          <button
                            onClick={() => setInspectUpi(t.upiId!)}
                            className="text-blue-400 hover:underline font-mono text-[11px]"
                          >
                            {t.upiId}
                          </button>
                        ) : (
                          t.beneficiary || 'N/A'
                        )}
                      </td>

                      <td className="py-2.5 px-3">
                        <span className="px-1.5 py-0.5 bg-slate-800 text-[10px] text-slate-300 rounded font-semibold border border-slate-700">
                          {t.channel}
                        </span>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-[11px]">
                        {t.accountNumber ? (
                          <button
                            onClick={() => onSelectAccount?.(t.accountNumber!)}
                            className="text-slate-300 hover:text-blue-400 hover:underline"
                          >
                            {t.accountNumber}
                          </button>
                        ) : (
                          'N/A'
                        )}
                      </td>

                      <td className="py-2.5 px-3 max-w-[220px] truncate text-slate-400 text-[11px]">
                        {t.narration}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setInspectTxn(t)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[11px] font-bold transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-xs text-slate-500">
                    No transactions match the selected search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {inspectTxn && (
        <TransactionDetailModal
          transaction={inspectTxn}
          allTransactions={transactions}
          statements={statements}
          onClose={() => setInspectTxn(null)}
          onSelectAccount={(accId) => onSelectAccount?.(accId)}
          onSelectTransaction={(t) => setInspectTxn(t)}
        />
      )}

      {inspectUpi && (
        <UPIIntelligenceModal
          upiId={inspectUpi}
          allTransactions={transactions}
          onClose={() => setInspectUpi(null)}
          onSelectTransaction={(t) => setInspectTxn(t)}
        />
      )}
    </div>
  );
};
