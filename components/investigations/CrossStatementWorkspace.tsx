'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  FileSpreadsheet,
  ArrowRightLeft,
  Users,
  GitMerge,
  ShieldAlert,
  FolderSearch,
  Building2,
  Calendar,
  Filter,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  RefreshCw,
  GitCompare,
  ArrowRight,
  Info,
  Bookmark,
  Plus,
  Zap,
  Tag,
  Clock,
  Briefcase,
  FileText,
  TrendingUp,
  Award,
} from 'lucide-react';
import { Transaction, BankStatement } from '@/types/investigation';
import { Case } from '@/types/case';
import { EvidenceItem } from '@/types/evidence';
import {
  CrossStatement,
  AccountOverlap,
  CrossStatementMatch,
  PathFinderResult,
  TransactionCluster,
  CrossStatementPattern,
  CrossCaseObservation,
  SavedSearch,
  SearchFilterState,
  MatchStatus,
} from '@/types/crossStatement';
import {
  formatCrossStatements,
  detectAccountOverlaps,
  detectCrossStatementMatches,
  findMoneyFlowPaths,
  detectCrossStatementPatterns,
  clusterTransactions,
  getSavedSearches,
  saveSearch,
  saveMatchReview,
  getCrossCaseObservations,
  saveCrossCaseObservation,
  normalizeAccount,
  normalizeIdentifier,
  normalizeUpi,
} from '@/lib/crossStatementStorage';
import { formatCurrencyINR } from '@/lib/storage';
import { StatementDetailModal } from './StatementDetailModal';
import { MatchReviewModal } from './MatchReviewModal';
import { AdvancedSearchBuilderModal } from './AdvancedSearchBuilderModal';
import { CrossCaseObservationModal } from './CrossCaseObservationModal';

interface CrossStatementWorkspaceProps {
  initialQuery?: string;
  transactions: Transaction[];
  statements: BankStatement[];
  cases?: Case[];
  evidenceList?: EvidenceItem[];
  onOpenAccountIntelligence?: (accountId: string) => void;
}

export const CrossStatementWorkspace: React.FC<CrossStatementWorkspaceProps> = ({
  initialQuery = '',
  transactions,
  statements,
  cases = [],
  evidenceList = [],
  onOpenAccountIntelligence,
}) => {
  // Navigation sub-tabs
  const [activeTab, setActiveTab] = useState<
    'SEARCH' | 'OVERLAPS' | 'RELATIONSHIPS' | 'MONEY_FLOW' | 'CLUSTERS_PATTERNS' | 'DIRECTORY' | 'CROSS_CASE'
  >('SEARCH');

  // Query & Filters
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<'ALL' | 'EXACT' | 'PARTIAL'>('ALL');
  const [selectedStatementIds, setSelectedStatementIds] = useState<string[]>([]);
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);

  // Modals & Drawer inspect states
  const [selectedStatementForDetail, setSelectedStatementForDetail] = useState<CrossStatement | null>(null);
  const [selectedMatchForReview, setSelectedMatchForReview] = useState<CrossStatementMatch | null>(null);
  const [isCrossCaseModalOpen, setIsCrossCaseModalOpen] = useState(false);

  // Path Finder input controls
  const [fromAccountQuery, setFromAccountQuery] = useState('');
  const [toAccountQuery, setToAccountQuery] = useState('');
  const [maxHops, setMaxHops] = useState(3);
  const [minAmount, setMinAmount] = useState(0);

  // Clustering option
  const [clusterBy, setClusterBy] = useState<'UTR' | 'ACCOUNT' | 'COUNTERPARTY' | 'AMOUNT_DATE' | 'UPI'>('UTR');

  // Formatted data & computations
  const crossStatements = useMemo(() => formatCrossStatements(statements, cases), [statements, cases]);

  const accountOverlaps = useMemo(
    () => detectAccountOverlaps(transactions, statements, cases),
    [transactions, statements, cases]
  );

  const crossMatches = useMemo(
    () => detectCrossStatementMatches(transactions, statements),
    [transactions, statements]
  );

  const crossPatterns = useMemo(
    () => detectCrossStatementPatterns(transactions, statements),
    [transactions, statements]
  );

  const clusters = useMemo(
    () => clusterTransactions(transactions, statements, clusterBy),
    [transactions, statements, clusterBy]
  );

  const [observations, setObservations] = useState<CrossCaseObservation[]>(() => getCrossCaseObservations());

  // Saved Searches state
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>(() => getSavedSearches());

  // Path finder search results
  const pathResults = useMemo(() => {
    if (!fromAccountQuery || !toAccountQuery) return [];
    return findMoneyFlowPaths(fromAccountQuery, toAccountQuery, transactions, statements, maxHops, minAmount);
  }, [fromAccountQuery, toAccountQuery, transactions, statements, maxHops, minAmount]);

  // Global Search Filtered Results
  const filteredSearchResults = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) {
      return {
        accounts: accountOverlaps.slice(0, 10),
        transactions: transactions.slice(0, 20),
        statements: crossStatements,
        matches: crossMatches.slice(0, 10),
        patterns: crossPatterns.slice(0, 10),
      };
    }

    const normQ = q.toLowerCase();
    const exactQ = normalizeIdentifier(q);

    const matchesAccount = (acc: string) =>
      searchType === 'EXACT' ? normalizeAccount(acc) === exactQ : acc.toLowerCase().includes(normQ);

    const matchTxn = (t: Transaction) => {
      if (searchType === 'EXACT') {
        return (
          t.id === q ||
          (t.utr && normalizeIdentifier(t.utr) === exactQ) ||
          (t.accountNumber && normalizeAccount(t.accountNumber) === exactQ) ||
          (t.upiId && normalizeUpi(t.upiId) === normQ)
        );
      }
      return (
        t.id.toLowerCase().includes(normQ) ||
        (t.utr && t.utr.toLowerCase().includes(normQ)) ||
        (t.narration && t.narration.toLowerCase().includes(normQ)) ||
        (t.beneficiary && t.beneficiary.toLowerCase().includes(normQ)) ||
        (t.accountNumber && t.accountNumber.toLowerCase().includes(normQ)) ||
        (t.upiId && t.upiId.toLowerCase().includes(normQ)) ||
        t.amount.toString().includes(normQ)
      );
    };

    return {
      accounts: accountOverlaps.filter((a) => matchesAccount(a.accountNumber) || a.bankNames.some((b) => b.toLowerCase().includes(normQ))),
      transactions: transactions.filter(matchTxn),
      statements: crossStatements.filter((s) => s.fileName.toLowerCase().includes(normQ) || s.bankName.toLowerCase().includes(normQ) || s.id.toLowerCase().includes(normQ)),
      matches: crossMatches.filter((m) => m.explanation.toLowerCase().includes(normQ) || m.id.toLowerCase().includes(normQ)),
      patterns: crossPatterns.filter((p) => p.title.toLowerCase().includes(normQ) || p.description.toLowerCase().includes(normQ)),
    };
  }, [searchQuery, searchType, transactions, accountOverlaps, crossStatements, crossMatches, crossPatterns]);

  // Handle Match Review
  const handleSaveMatchReview = (matchId: string, status: MatchStatus, notes: string) => {
    saveMatchReview(matchId, status, notes);
  };

  // Handle Save Search
  const handleSaveCurrentSearch = () => {
    if (!searchQuery.trim()) return;
    const newSearch = saveSearch({
      name: `Search: ${searchQuery}`,
      query: searchQuery,
      filters: {
        query: searchQuery,
        searchType,
        statementIds: selectedStatementIds,
        caseIds: [],
      },
      resultCount: filteredSearchResults.transactions.length + filteredSearchResults.accounts.length,
    });
    setSavedSearches([newSearch, ...savedSearches]);
  };

  // Handle Save Cross Case Observation
  const handleSaveObservation = (obs: Omit<CrossCaseObservation, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = saveCrossCaseObservation(obs);
    setObservations([created, ...observations]);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                STEP 13 GLOBAL SEARCH & INTELLIGENCE
              </span>
              <span className="text-xs text-slate-400">Cross-Statement Money Flow Correlation Engine</span>
            </div>
            <h2 className="text-xl font-bold text-slate-100 mt-1 flex items-center gap-2">
              <FolderSearch className="w-5 h-5 text-blue-400" />
              Satara Police Global Investigation & Cross-Statement Portal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Unified query engine connecting Bank Statements, Accounts, UTRs, Money Flow Hops, and Case Overlaps
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdvancedSearchOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-400" />
              Advanced Query Builder
            </button>
            <button
              onClick={() => setIsCrossCaseModalOpen(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <GitCompare className="w-4 h-4" />
              Cross-Case Observation
            </button>
          </div>
        </div>

        {/* Persistent Global Search Bar */}
        <div className="relative">
          <Search className="w-5 h-5 text-blue-400 absolute left-4 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search account (XXXX5821), UTR, UPI ID (abc@upi), TXN-ID, beneficiary, amount or bank..."
            className="w-full bg-slate-950 border-2 border-slate-700 hover:border-slate-600 focus:border-blue-500 rounded-xl pl-12 pr-36 py-3 text-sm text-slate-100 placeholder-slate-500 font-medium focus:outline-none transition-colors shadow-inner font-mono"
          />
          <div className="absolute right-2 top-2 bottom-2 flex items-center space-x-1">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="h-full bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-bold rounded-lg px-2 focus:outline-none"
            >
              <option value="ALL">All Modes</option>
              <option value="EXACT">Exact Match</option>
              <option value="PARTIAL">Partial Match</option>
            </select>
            {searchQuery && (
              <button
                onClick={handleSaveCurrentSearch}
                title="Save this search filter"
                className="h-full px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold rounded-lg transition-colors border border-slate-700"
              >
                <Bookmark className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Quick Presets:</span>
          <button
            onClick={() => setSearchQuery('UPI')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors text-[11px]"
          >
            UPI Transactions
          </button>
          <button
            onClick={() => setSearchQuery('IMPS')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors text-[11px]"
          >
            IMPS Transfers
          </button>
          <button
            onClick={() => setSearchQuery('ATM CASH')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors text-[11px]"
          >
            Cash Withdrawals
          </button>
          <button
            onClick={() => setSearchQuery('50000')}
            className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:border-blue-500 hover:text-blue-400 transition-colors text-[11px]"
          >
            ₹50,000+ Transferred
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto no-scrollbar border-b border-slate-800 bg-slate-900/60 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('SEARCH')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'SEARCH' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          Global Results ({filteredSearchResults.transactions.length + filteredSearchResults.accounts.length})
        </button>
        <button
          onClick={() => setActiveTab('OVERLAPS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'OVERLAPS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          Account Overlaps ({accountOverlaps.length})
        </button>
        <button
          onClick={() => setActiveTab('RELATIONSHIPS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'RELATIONSHIPS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Cross-Statement Matches ({crossMatches.length})
        </button>
        <button
          onClick={() => setActiveTab('MONEY_FLOW')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'MONEY_FLOW' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitMerge className="w-3.5 h-3.5" />
          Money Flow & Path Finder
        </button>
        <button
          onClick={() => setActiveTab('CLUSTERS_PATTERNS')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CLUSTERS_PATTERNS' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Clusters & Patterns ({crossPatterns.length})
        </button>
        <button
          onClick={() => setActiveTab('DIRECTORY')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'DIRECTORY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-3.5 h-3.5" />
          Statement Directory ({crossStatements.length})
        </button>
        <button
          onClick={() => setActiveTab('CROSS_CASE')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'CROSS_CASE' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-3.5 h-3.5" />
          Cross-Case Observations ({observations.length})
        </button>
      </div>

      {/* TAB 1: GLOBAL RESULTS & EXPLORER */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-6">
          {/* Group 1: Account Search Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" />
              Matched Account Entities ({filteredSearchResults.accounts.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredSearchResults.accounts.map((acc) => (
                <div
                  key={acc.id}
                  className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-bold text-blue-300">{acc.accountNumber}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
                      {acc.matchConfidence}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-1">
                    <p className="flex items-center gap-1 text-slate-300 font-medium">
                      <Building2 className="w-3.5 h-3.5 text-slate-500" />
                      {acc.bankNames.join(', ')}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Statements: {acc.statementIds.join(', ')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[11px]">
                    <span className="text-slate-500">{acc.transactionCount} transactions</span>
                    {onOpenAccountIntelligence && (
                      <button
                        onClick={() => onOpenAccountIntelligence(acc.normalizedAccount)}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      >
                        Intel Profile <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group 2: Transaction Results */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              Matched Transactions ({filteredSearchResults.transactions.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Statement</th>
                    <th className="px-3 py-2.5">Account / Bank</th>
                    <th className="px-3 py-2.5">Amount & Type</th>
                    <th className="px-3 py-2.5">Narration / Beneficiary</th>
                    <th className="px-3 py-2.5">UTR / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {filteredSearchResults.transactions.slice(0, 30).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-950/60 transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">{t.transactionDate}</td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-blue-300">
                          {t.statementId.slice(0, 12)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-slate-200 font-bold">{t.accountNumber || t.senderAccount || 'Acc'}</span>
                        <span className="text-[10px] block text-slate-400 font-sans">{t.bankName || 'Bank'}</span>
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap font-bold">
                        <span className={t.transactionType === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}>
                          {t.transactionType === 'CREDIT' ? '+' : '-'} {formatCurrencyINR(t.amount)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 max-w-xs truncate font-sans text-slate-300" title={t.narration}>
                        {t.narration}
                        {t.beneficiary && <span className="block text-[10px] text-blue-400">To: {t.beneficiary}</span>}
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap text-slate-300">{t.utr || t.referenceNumber || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNT OVERLAPS */}
      {activeTab === 'OVERLAPS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-400" />
              Cross-Statement Account Overlap Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Detects identical account numbers observed across multiple independent bank statement uploads
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Overlap Ref</th>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">Normalized Value</th>
                  <th className="px-4 py-3">Banks Observed</th>
                  <th className="px-4 py-3">Source Statements</th>
                  <th className="px-4 py-3">Confidence</th>
                  <th className="px-4 py-3">Total Inflow</th>
                  <th className="px-4 py-3">Total Outflow</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {accountOverlaps.map((ovl) => (
                  <tr key={ovl.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-400">{ovl.id}</td>
                    <td className="px-4 py-3 font-bold text-blue-300">{ovl.accountNumber}</td>
                    <td className="px-4 py-3 text-slate-400">{ovl.normalizedAccount}</td>
                    <td className="px-4 py-3 font-sans text-slate-200">{ovl.bankNames.join(', ')}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ovl.statementIds.map((sId, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 text-[10px]">
                            {sId}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        ovl.matchConfidence === 'EXACT'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-blue-950 text-blue-400 border border-blue-800'
                      }`}>
                        {ovl.matchConfidence}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">{formatCurrencyINR(ovl.totalMoneyIn)}</td>
                    <td className="px-4 py-3 text-rose-400 font-bold">{formatCurrencyINR(ovl.totalMoneyOut)}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      {onOpenAccountIntelligence && (
                        <button
                          onClick={() => onOpenAccountIntelligence(ovl.normalizedAccount)}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-semibold rounded-lg transition-colors"
                        >
                          View Intel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CROSS-STATEMENT MATCHES */}
      {activeTab === 'RELATIONSHIPS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-purple-400" />
                Cross-Statement Transaction Match Review Queue
              </h3>
              <p className="text-xs text-slate-400">
                Correlates UTRs, Mirror transfers, and UPI IDs across different bank statement files
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {crossMatches.map((match) => (
              <div
                key={match.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      {match.id}
                    </span>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {match.matchType.replace('_', ' ')}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800">
                      Match Score: {match.matchScore}%
                    </span>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                    match.status === 'CONFIRMED'
                      ? 'bg-emerald-950/60 border-emerald-600/60 text-emerald-300'
                      : match.status === 'REJECTED'
                      ? 'bg-rose-950/60 border-rose-600/60 text-rose-300'
                      : 'bg-amber-950/60 border-amber-600/60 text-amber-300'
                  }`}>
                    Status: {match.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">{match.explanation}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-blue-400 uppercase font-bold block mb-1">
                      Record A ({match.recordA.statementId} - {match.recordA.bank})
                    </span>
                    <p className="text-slate-200">Acc: {match.recordA.account}</p>
                    <p className="text-slate-300">{match.recordA.date} • {match.recordA.direction} {formatCurrencyINR(match.recordA.amount)}</p>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-purple-400 uppercase font-bold block mb-1">
                      Record B ({match.recordB.statementId} - {match.recordB.bank})
                    </span>
                    <p className="text-slate-200">Acc: {match.recordB.account}</p>
                    <p className="text-slate-300">{match.recordB.date} • {match.recordB.direction} {formatCurrencyINR(match.recordB.amount)}</p>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => setSelectedMatchForReview(match)}
                    className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    Inspect & Verify Relationship
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MONEY FLOW & PATH FINDER */}
      {activeTab === 'MONEY_FLOW' && (
        <div className="space-y-6">
          {/* Path Finder Query Control */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-blue-400" />
                Cross-Statement Shortest Path Finder
              </h3>
              <p className="text-xs text-slate-400">
                Trace multi-hop fund routes between source Account A and destination Account B across all bank statements
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">From Account A</label>
                <input
                  type="text"
                  value={fromAccountQuery}
                  onChange={(e) => setFromAccountQuery(e.target.value)}
                  placeholder="e.g. 9821"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">To Account B</label>
                <input
                  type="text"
                  value={toAccountQuery}
                  onChange={(e) => setToAccountQuery(e.target.value)}
                  placeholder="e.g. 5821"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Max Hop Depth</label>
                <select
                  value={maxHops}
                  onChange={(e) => setMaxHops(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value={1}>1 Hop (Direct)</option>
                  <option value={2}>2 Hops (1 Intermediate)</option>
                  <option value={3}>3 Hops (2 Intermediaries)</option>
                  <option value={4}>4 Hops (Deep Path)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">Min Amount (₹)</label>
                <input
                  type="number"
                  value={minAmount || ''}
                  onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                  placeholder="Min threshold..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Path Search Results */}
            {pathResults.length > 0 ? (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Discovered Money Hops ({pathResults.length} Paths)
                </h4>
                {pathResults.map((path) => (
                  <div key={path.pathId} className="bg-slate-950 border border-emerald-900/40 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-emerald-300">{path.pathId} • {path.pathType}</span>
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        Total Volume: {formatCurrencyINR(path.totalFlowAmount)}
                      </span>
                    </div>

                    {/* Nodes Step Visualization */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs">
                      {path.edges.map((edge, idx) => (
                        <React.Fragment key={idx}>
                          <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200">
                            <span className="text-[10px] text-slate-400 block">{edge.statementId}</span>
                            <span className="font-bold text-blue-300">{edge.fromAccount}</span>
                          </div>

                          <div className="flex flex-col items-center px-2 text-[11px] text-emerald-400 font-bold">
                            <span>➔ {formatCurrencyINR(edge.amount)} ➔</span>
                            <span className="text-[9px] text-slate-400">{edge.channel} ({edge.date})</span>
                          </div>

                          {idx === path.edges.length - 1 && (
                            <div className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-slate-200">
                              <span className="text-[10px] text-slate-400 block">Target</span>
                              <span className="font-bold text-purple-300">{edge.toAccount}</span>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (fromAccountQuery && toAccountQuery) ? (
              <div className="text-xs text-amber-400 bg-amber-950/40 p-3 rounded-lg border border-amber-800">
                No money flow path discovered between &quot;{fromAccountQuery}&quot; and &quot;{toAccountQuery}&quot; under {maxHops} hop constraints.
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 5: CLUSTERS & PATTERNS */}
      {activeTab === 'CLUSTERS_PATTERNS' && (
        <div className="space-y-6">
          {/* Pattern Engine Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Cross-Statement Pattern Intelligence Alerts ({crossPatterns.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {crossPatterns.map((pat) => (
                <div
                  key={pat.patternId}
                  className={`bg-slate-950 border rounded-xl p-4 space-y-2 ${
                    pat.severity === 'HIGH' ? 'border-rose-900/60' : 'border-amber-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-amber-400">{pat.patternId}</span>
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                      pat.severity === 'HIGH' ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {pat.type.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">{pat.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{pat.description}</p>

                  <div className="pt-2 flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Statements: {pat.sourceStatements.join(', ')}</span>
                    <span>Rule: {pat.details.ruleName || 'R-01'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Clustering */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                Cross-Statement Transaction Clusters ({clusters.length})
              </h3>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400 font-medium">Cluster By:</span>
                <select
                  value={clusterBy}
                  onChange={(e) => setClusterBy(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs font-bold rounded-lg p-1.5 focus:outline-none"
                >
                  <option value="UTR">UTR Reference</option>
                  <option value="ACCOUNT">Account Number</option>
                  <option value="COUNTERPARTY">Counterparty Name</option>
                  <option value="UPI">UPI ID</option>
                  <option value="AMOUNT_DATE">Same Amount & Date</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clusters.map((c) => (
                <div key={c.clusterId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-xs font-bold text-blue-300">{c.clusterId}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{formatCurrencyINR(c.totalAmount)}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{c.name}</h4>
                  <div className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <p>Transactions Count: {c.transactionIds.length}</p>
                    <p>Source Statements: {c.statementIds.join(', ')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: STATEMENT DIRECTORY */}
      {activeTab === 'DIRECTORY' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-400" />
                Imported Bank Statement Dataset Directory
              </h3>
              <p className="text-xs text-slate-400">
                Formal directory listing dataset version, cryptographic hashes, and quality ratings
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Statement Ref</th>
                  <th className="px-4 py-3">Bank Name</th>
                  <th className="px-4 py-3">Account Number</th>
                  <th className="px-4 py-3">File Name</th>
                  <th className="px-4 py-3">Row Count</th>
                  <th className="px-4 py-3">Quality</th>
                  <th className="px-4 py-3">Import Date</th>
                  <th className="px-4 py-3 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {crossStatements.map((stmt) => (
                  <tr key={stmt.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-blue-400">{stmt.id}</td>
                    <td className="px-4 py-3 font-sans font-semibold text-slate-200">{stmt.bankName}</td>
                    <td className="px-4 py-3 font-bold text-slate-300">{stmt.accountNumberMasked}</td>
                    <td className="px-4 py-3 font-sans text-slate-300 truncate max-w-[180px]">{stmt.fileName}</td>
                    <td className="px-4 py-3 font-bold">{stmt.rowCount}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        stmt.qualityRating === 'HIGH' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}>
                        {stmt.qualityRating}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(stmt.importedAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedStatementForDetail(stmt)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors"
                      >
                        Metadata
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: CROSS-CASE OBSERVATIONS */}
      {activeTab === 'CROSS_CASE' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                Cross-Case Intelligence & Observations
              </h3>
              <p className="text-xs text-slate-400">
                Documented analytical overlaps between independent police investigation files
              </p>
            </div>
            <button
              onClick={() => setIsCrossCaseModalOpen(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Observation
            </button>
          </div>

          <div className="space-y-3">
            {observations.map((obs) => (
              <div key={obs.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-indigo-300">{obs.id} • {obs.sharedEntityType}</span>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {obs.status}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-slate-100">{obs.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{obs.description}</p>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Case A:</span>
                    <span className="text-blue-300 font-bold">{obs.caseA.name} ({obs.caseA.id})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Case B:</span>
                    <span className="text-purple-300 font-bold">{obs.caseB.name} ({obs.caseB.id})</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <StatementDetailModal
        statement={selectedStatementForDetail}
        onClose={() => setSelectedStatementForDetail(null)}
      />

      <MatchReviewModal
        match={selectedMatchForReview}
        onClose={() => setSelectedMatchForReview(null)}
        onSaveReview={handleSaveMatchReview}
      />

      <AdvancedSearchBuilderModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        onApplyFilters={(f) => {
          setSearchQuery(f.query);
        }}
        initialFilters={{
          query: searchQuery,
          searchType,
          statementIds: selectedStatementIds,
          caseIds: [],
        }}
        statements={crossStatements}
      />

      <CrossCaseObservationModal
        isOpen={isCrossCaseModalOpen}
        onClose={() => setIsCrossCaseModalOpen(false)}
        onSave={handleSaveObservation}
        cases={cases.length > 0 ? cases.map((c) => ({ id: c.id, name: c.title })) : [
          { id: 'INV-2026-SATARA-01', name: 'Cyber Investment Fraud - Shirwal' },
          { id: 'INV-2026-SATARA-02', name: 'Mule Account Syndicate - Karad' },
        ]}
      />
    </div>
  );
};
