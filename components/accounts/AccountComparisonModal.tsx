'use client';

import React, { useState } from 'react';
import { X, ArrowRightLeft, Building2, Users, ArrowRight, Shield, Calendar, DollarSign } from 'lucide-react';
import { Transaction, BankStatement, AccountEntity } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { getAccountEntities, compareAccounts } from '@/lib/intelligence';

interface AccountComparisonModalProps {
  initialAccountAId?: string;
  transactions: Transaction[];
  statements: BankStatement[];
  onClose: () => void;
  onSelectAccount: (accountId: string) => void;
}

export const AccountComparisonModal: React.FC<AccountComparisonModalProps> = ({
  initialAccountAId,
  transactions,
  statements,
  onClose,
  onSelectAccount,
}) => {
  const allAccounts = getAccountEntities(transactions, statements);

  const [accountAId, setAccountAId] = useState<string>(
    initialAccountAId || (allAccounts[0]?.id ?? '')
  );
  const [accountBId, setAccountBId] = useState<string>(
    allAccounts.find((a) => a.id !== initialAccountAId)?.id || (allAccounts[1]?.id ?? '')
  );

  const comparison = compareAccounts(accountAId, accountBId, transactions, statements);
  const accA = comparison.accountA;
  const accB = comparison.accountB;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Side-by-Side Account Intelligence Comparison</h3>
              <p className="text-xs text-slate-400">
                Compare financial profile, transaction volume, and direct transfers between two accounts
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Account Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-2">
                ACCOUNT A (Primary)
              </label>
              <select
                value={accountAId}
                onChange={(e) => setAccountAId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumberMasked} ({acc.bankName}) - {acc.totalTransactions} Txns
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-amber-400 uppercase tracking-wider block mb-2">
                ACCOUNT B (Comparative Target)
              </label>
              <select
                value={accountBId}
                onChange={(e) => setAccountBId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
              >
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumberMasked} ({acc.bankName}) - {acc.totalTransactions} Txns
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Direct Transfers Overview */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Direct Observed Transfers Between A & B
              </span>
              <span className="text-lg font-bold text-slate-100 mt-0.5 block">
                {comparison.directTransfersCount} Transactions Recorded
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Total Direct Transferred Volume
              </span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">
                {formatCurrencyINR(comparison.directTransfersTotal, false)}
              </span>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Metric / Property</th>
                  <th className="py-3 px-4 text-blue-400">Account A ({accA?.accountNumberMasked || 'N/A'})</th>
                  <th className="py-3 px-4 text-amber-400">Account B ({accB?.accountNumberMasked || 'N/A'})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Bank / Institution</td>
                  <td className="py-2.5 px-4 font-semibold">{accA?.bankName || 'N/A'}</td>
                  <td className="py-2.5 px-4 font-semibold">{accB?.bankName || 'N/A'}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Total Transactions</td>
                  <td className="py-2.5 px-4 font-bold text-slate-100">{accA?.totalTransactions ?? 0}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-100">{accB?.totalTransactions ?? 0}</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Money Received (Credits)</td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">
                    {formatCurrencyINR(accA?.totalMoneyIn ?? 0, false)} ({accA?.creditCount} credits)
                  </td>
                  <td className="py-2.5 px-4 text-emerald-400 font-bold">
                    {formatCurrencyINR(accB?.totalMoneyIn ?? 0, false)} ({accB?.creditCount} credits)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Money Sent (Debits)</td>
                  <td className="py-2.5 px-4 text-amber-400 font-bold">
                    {formatCurrencyINR(accA?.totalMoneyOut ?? 0, false)} ({accA?.debitCount} debits)
                  </td>
                  <td className="py-2.5 px-4 text-amber-400 font-bold">
                    {formatCurrencyINR(accB?.totalMoneyOut ?? 0, false)} ({accB?.debitCount} debits)
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">ATM / Cash Withdrawals</td>
                  <td className="py-2.5 px-4 text-purple-400 font-semibold">
                    {formatCurrencyINR(accA?.totalWithdrawals ?? 0, false)}
                  </td>
                  <td className="py-2.5 px-4 text-purple-400 font-semibold">
                    {formatCurrencyINR(accB?.totalWithdrawals ?? 0, false)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Net Flow</td>
                  <td className="py-2.5 px-4 font-bold">
                    {formatCurrencyINR(accA?.netFlow ?? 0, false)}
                  </td>
                  <td className="py-2.5 px-4 font-bold">
                    {formatCurrencyINR(accB?.netFlow ?? 0, false)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Largest Incoming Credit</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    {formatCurrencyINR(accA?.largestCredit ?? 0, false)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    {formatCurrencyINR(accB?.largestCredit ?? 0, false)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Largest Outgoing Debit</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    {formatCurrencyINR(accA?.largestDebit ?? 0, false)}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-200">
                    {formatCurrencyINR(accB?.largestDebit ?? 0, false)}
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Connected Accounts</td>
                  <td className="py-2.5 px-4 font-semibold text-blue-400">
                    {accA?.connectedAccountsCount ?? 0} entities
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-blue-400">
                    {accB?.connectedAccountsCount ?? 0} entities
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-4 font-medium text-slate-400">Active Period Observed</td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {accA?.firstSeen || 'N/A'} → {accA?.lastSeen || 'N/A'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-300">
                    {accB?.firstSeen || 'N/A'} → {accB?.lastSeen || 'N/A'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (accA) onSelectAccount(accA.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold"
            >
              Open Account A Workspace
            </button>
            <button
              onClick={() => {
                if (accB) onSelectAccount(accB.id);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold"
            >
              Open Account B Workspace
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
