'use client';

import React, { useState } from 'react';
import {
  Search,
  Users,
  ArrowRightLeft,
  FileSpreadsheet,
  Building2,
  Filter,
  Send,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { Transaction, BankStatement } from '@/types/investigation';
import { searchInvestigationData, getAccountEntities } from '@/lib/intelligence';
import { formatCurrencyINR } from '@/lib/storage';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { UPIIntelligenceModal } from '../transactions/UPIIntelligenceModal';

interface InvestigationSearchWorkspaceProps {
  initialQuery?: string;
  transactions: Transaction[];
  statements: BankStatement[];
  onOpenAccountIntelligence: (accountId: string) => void;
}

export const InvestigationSearchWorkspace: React.FC<InvestigationSearchWorkspaceProps> = ({
  initialQuery = '',
  transactions,
  statements,
  onOpenAccountIntelligence,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'ALL' | 'ACCOUNTS' | 'TRANSACTIONS' | 'ENTITIES' | 'STATEMENTS'>('ALL');

  const [inspectTxn, setInspectTxn] = useState<Transaction | null>(null);
  const [inspectUpi, setInspectUpi] = useState<string | null>(null);

  const searchResults = searchInvestigationData(query, transactions, statements);
  const allAccounts = getAccountEntities(transactions, statements);

  // Quick preset suggest chips
  const sampleSuggestions = [
    { label: 'Sample Account', q: allAccounts[0]?.accountNumberMasked || '9821' },
    { label: 'UPI Query', q: transactions.find((t) => t.upiId)?.upiId || 'rohanpatil' },
    { label: 'UTR Reference', q: transactions.find((t) => t.utr)?.utr || 'UTR' },
    { label: 'Amount ₹50,000', q: '50000' },
    { label: 'IMPS Transfers', q: 'IMPS' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Search Hero Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              STEP 3 UNIVERSAL SEARCH
            </span>
            <span className="text-xs text-slate-400">Transaction & Account Intelligence Workspace</span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">Cyber Money Flow Investigation Search</h2>
          <p className="text-xs text-slate-400">
            Search account number, transaction ID, UTR, UPI ID, beneficiary, amount, narration, IFSC or bank
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative">
          <Search className="w-5 h-5 text-blue-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search account (XXXX 5821), TXN-238192, UTR, example@upi, ₹50,000 or narration..."
            className="w-full bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-xl pl-12 pr-28 py-3 text-sm text-slate-100 placeholder-slate-500 font-medium focus:outline-none transition-colors shadow-inner"
          />
          <button
            onClick={() => {}}
            className="absolute right-2 top-2 bottom-2 px-5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
          >
            Investigate
          </button>
        </div>

        {/* Instant Suggestions */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Suggestions:</span>
          {sampleSuggestions.map((s, idx) => (
            <button
              key={idx}
              onClick={() => setQuery(s.q)}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 font-medium transition-colors"
            >
              {s.label}: <strong className="text-blue-400 font-mono">{s.q}</strong>
            </button>
          ))}
        </div>
      </div>

      {/* Results Workspace Header */}
      {query.trim() && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-100">Investigation Results</h3>
                <span className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono text-xs font-bold">
                  Query: &quot;{query}&quot;
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Found <strong className="text-slate-200">{searchResults.accounts.length}</strong> Accounts,{' '}
                <strong className="text-slate-200">{searchResults.transactions.length}</strong> Transactions,{' '}
                <strong className="text-slate-200">{searchResults.connectedEntities.length}</strong> Connected Entities,{' '}
                <strong className="text-slate-200">{searchResults.statements.length}</strong> Statements
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-lg border border-slate-800 overflow-x-auto">
              {[
                { id: 'ALL', label: `All (${searchResults.totalMatches})` },
                { id: 'ACCOUNTS', label: `Accounts (${searchResults.accounts.length})` },
                { id: 'TRANSACTIONS', label: `Transactions (${searchResults.transactions.length})` },
                { id: 'ENTITIES', label: `Entities (${searchResults.connectedEntities.length})` },
                { id: 'STATEMENTS', label: `Statements (${searchResults.statements.length})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* RESULTS CATEGORIES */}

          {/* 1. Account Matches */}
          {(activeTab === 'ALL' || activeTab === 'ACCOUNTS') && searchResults.accounts.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Account Matches ({searchResults.accounts.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.accounts.map((acc) => (
                  <div
                    key={acc.id}
                    onClick={() => onOpenAccountIntelligence(acc.id)}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/60 transition-all cursor-pointer group space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {acc.accountNumberMasked}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        OPEN INTELLIGENCE →
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <div>
                        <span className="block text-[10px] uppercase text-slate-500">Bank / Branch</span>
                        <span className="font-medium text-slate-300 truncate block">{acc.bankName}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase text-slate-500">Total Activity</span>
                        <span className="font-bold text-slate-200 block">{acc.totalTransactions} Transactions</span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase text-slate-500">Money Received</span>
                        <span className="font-bold text-emerald-400 block">{formatCurrencyINR(acc.totalMoneyIn, true)}</span>
                      </div>

                      <div>
                        <span className="block text-[10px] uppercase text-slate-500">Money Sent</span>
                        <span className="font-bold text-amber-400 block">{formatCurrencyINR(acc.totalMoneyOut, true)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. Transaction Matches */}
          {(activeTab === 'ALL' || activeTab === 'TRANSACTIONS') && searchResults.transactions.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
                <span>Transaction Matches ({searchResults.transactions.length})</span>
              </h4>

              <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Transaction ID / UTR</th>
                      <th className="py-2.5 px-3">Direction</th>
                      <th className="py-2.5 px-3">Amount</th>
                      <th className="py-2.5 px-3">Beneficiary / Payee</th>
                      <th className="py-2.5 px-3">Channel</th>
                      <th className="py-2.5 px-3">Narration</th>
                      <th className="py-2.5 px-3 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-slate-300">
                    {searchResults.transactions.slice(0, 50).map((t) => {
                      const isCredit = t.creditAmount > 0;
                      return (
                        <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                          <td className="py-2 px-3 font-mono text-slate-400">{t.transactionDate}</td>
                          <td className="py-2 px-3 font-mono text-blue-400 font-semibold">{t.utr || t.transactionId || 'N/A'}</td>
                          <td className="py-2 px-3">
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${
                                isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                              }`}
                            >
                              {isCredit ? 'CREDIT' : 'DEBIT'}
                            </span>
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-100">
                            {formatCurrencyINR(Math.abs(t.amount), false)}
                          </td>
                          <td className="py-2 px-3 truncate max-w-[150px]">{t.beneficiary || t.upiId || 'N/A'}</td>
                          <td className="py-2 px-3">{t.channel}</td>
                          <td className="py-2 px-3 truncate max-w-[200px] text-slate-400">{t.narration}</td>
                          <td className="py-2 px-3 text-right">
                            <button
                              onClick={() => setInspectTxn(t)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-[11px] rounded font-semibold transition-colors"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. Connected Entities */}
          {(activeTab === 'ALL' || activeTab === 'ENTITIES') && searchResults.connectedEntities.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2 border-b border-slate-800 pb-2">
                <Users className="w-4 h-4 text-purple-400" />
                <span>Connected Entity Matches ({searchResults.connectedEntities.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {searchResults.connectedEntities.map((c) => (
                  <div key={c.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-xs">
                    <span className="font-bold text-slate-100 block truncate">{c.counterpartyName}</span>
                    <div className="flex justify-between text-slate-400">
                      <span>Transactions:</span>
                      <span className="font-mono font-bold text-slate-200">{c.transactionCount}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Total Transferred:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatCurrencyINR(c.totalAmount, true)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Matches Callout */}
          {searchResults.totalMatches === 0 && (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
              <Search className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-slate-200">No matching investigation records found</h4>
              <p className="text-xs text-slate-400">
                Try searching by different account numbers, UTR reference digits, UPI handles or narration keywords.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {inspectTxn && (
        <TransactionDetailModal
          transaction={inspectTxn}
          allTransactions={transactions}
          statements={statements}
          onClose={() => setInspectTxn(null)}
          onSelectAccount={(accId) => onOpenAccountIntelligence(accId)}
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
