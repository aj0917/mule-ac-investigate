'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Play,
  Sliders,
  History,
  Search,
  RotateCcw,
  Clock,
  Building2,
  FileSpreadsheet,
  Activity,
  Award,
  BarChart3,
  ArrowUpRight,
  GitMerge,
  Layers,
  Zap,
  TrendingUp,
  ArrowRightLeft,
} from 'lucide-react';
import {
  Transaction,
  BankStatement,
  PatternIndicator,
  PatternStatus,
  DismissReason,
} from '@/types/investigation';
import {
  runPatternAnalysis,
  getStoredIndicatorStatuses,
  saveIndicatorStatus,
  getCustomRules,
  saveAnalysisRun,
} from '@/lib/patternEngine';
import { IndicatorCard } from './IndicatorCard';
import { IndicatorDetailsModal } from './IndicatorDetailsModal';
import { CustomRuleBuilderModal } from './CustomRuleBuilderModal';
import { RunAnalysisModal } from './RunAnalysisModal';
import { AnalysisHistoryModal } from './AnalysisHistoryModal';
import { formatCurrencyINR } from '@/lib/storage';

interface PatternsWorkspaceProps {
  transactions: Transaction[];
  statements: BankStatement[];
  onSelectTransaction?: (txn: Transaction) => void;
  onOpenAccount?: (accId: string) => void;
  onShowOnGraph?: (accId: string) => void;
}

export const PatternsWorkspace: React.FC<PatternsWorkspaceProps> = ({
  transactions,
  statements,
  onSelectTransaction,
  onOpenAccount,
  onShowOnGraph,
}) => {
  // Initial indicators load
  const [indicators, setIndicators] = useState<PatternIndicator[]>(() => {
    if (!transactions || transactions.length === 0) return [];
    const generated = runPatternAnalysis(transactions, statements);
    const savedStatuses = getStoredIndicatorStatuses();
    return generated.map((ind) => {
      if (savedStatuses[ind.id]) {
        return {
          ...ind,
          status: savedStatuses[ind.id].status,
          dismissReason: savedStatuses[ind.id].reason,
          dismissNotes: savedStatuses[ind.id].notes,
        };
      }
      return ind;
    });
  });

  // Active Sub-Navigation Tab (14 Tabs)
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Filter & UI State
  const [datasetVersion, setDatasetVersion] = useState<string>('V04');
  const [selectedCase, setSelectedCase] = useState<string>('INV-2026-SATARA');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minAmountFilter, setMinAmountFilter] = useState<string>('');
  const [maxAmountFilter, setMaxAmountFilter] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Modals
  const [selectedIndicator, setSelectedIndicator] = useState<PatternIndicator | null>(null);
  const [showRunModal, setShowRunModal] = useState<boolean>(false);
  const [showRuleModal, setShowRuleModal] = useState<boolean>(false);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);

  const handleUpdateStatus = (
    indId: string,
    newStatus: PatternStatus,
    reason?: DismissReason,
    notes?: string
  ) => {
    saveIndicatorStatus(indId, newStatus, reason, notes);
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === indId
          ? {
              ...ind,
              status: newStatus,
              dismissReason: reason || ind.dismissReason,
              dismissNotes: notes || ind.dismissNotes,
            }
          : ind
      )
    );
  };

  const handleAnalysisCompleted = (newIndicators: PatternIndicator[]) => {
    setIndicators(newIndicators);
    setShowRunModal(false);
  };

  const handleResetFilters = () => {
    setPriorityFilter('ALL');
    setStatusFilter('ALL');
    setSearchQuery('');
    setMinAmountFilter('');
    setMaxAmountFilter('');
    setDateFrom('');
    setDateTo('');
  };

  const handleSaveAnalysisRun = () => {
    const newRun = {
      id: `RUN-${Math.floor(10000 + Math.random() * 90000)}`,
      datasetVersion,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'COMPLETED' as const,
      scope: {
        selectedStatementIds: statements.map((s) => s.id),
        totalStatementsCount: statements.length,
        totalTransactionsCount: transactions.length,
        totalAccountsCount: new Set(transactions.map((t) => t.accountNumber || t.senderAccount).filter(Boolean)).size,
        channels: Array.from(new Set(transactions.map((t) => t.channel))),
      },
      indicatorsCount: indicators.length,
      priorityBreakdown: {
        high: indicators.filter((i) => i.priority === 'HIGH').length,
        medium: indicators.filter((i) => i.priority === 'MEDIUM').length,
        low: indicators.filter((i) => i.priority === 'LOW').length,
      },
      warnings: ['18% of transactions have date-only timestamps', '7% contain incomplete counterparty identifiers'],
    };
    saveAnalysisRun(newRun);
    alert(`Analysis Run ${newRun.id} saved successfully!`);
  };

  // Filtered indicators
  const filteredIndicators = useMemo(() => {
    return indicators.filter((ind) => {
      if (priorityFilter !== 'ALL' && ind.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && ind.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = ind.title.toLowerCase().includes(q);
        const mSubtitle = ind.subtitle.toLowerCase().includes(q);
        const mAccount = ind.rootAccountLabel.toLowerCase().includes(q);
        const mExplanation = ind.explanation.toLowerCase().includes(q);
        if (!mTitle && !mSubtitle && !mAccount && !mExplanation) return false;
      }

      if (minAmountFilter.trim()) {
        const minVal = parseFloat(minAmountFilter);
        if (!isNaN(minVal) && ind.totalAmount < minVal) return false;
      }

      if (maxAmountFilter.trim()) {
        const maxVal = parseFloat(maxAmountFilter);
        if (!isNaN(maxVal) && ind.totalAmount > maxVal) return false;
      }

      if (dateFrom && ind.startDate < dateFrom) return false;
      if (dateTo && ind.endDate > dateTo) return false;

      return true;
    });
  }, [indicators, priorityFilter, statusFilter, searchQuery, minAmountFilter, maxAmountFilter, dateFrom, dateTo]);

  // Derived metrics with "Observed" wording
  const totalMoneyIn = useMemo(
    () => transactions.reduce((sum, t) => sum + t.creditAmount, 0),
    [transactions]
  );
  const totalMoneyOut = useMemo(
    () => transactions.reduce((sum, t) => sum + t.debitAmount, 0),
    [transactions]
  );
  const totalWithdrawals = useMemo(
    () =>
      transactions
        .filter((t) => t.channel === 'ATM' || t.transactionType === 'WITHDRAWAL')
        .reduce((sum, t) => sum + Math.max(t.debitAmount, Math.abs(t.amount)), 0),
    [transactions]
  );
  const uniqueAccountsCount = useMemo(
    () => new Set(transactions.map((t) => t.accountNumber || t.senderAccount).filter(Boolean)).size,
    [transactions]
  );

  const subNavItems = [
    { id: 'overview', label: 'Intelligence Overview', icon: Activity },
    { id: 'explorer', label: 'Pattern Explorer', icon: ShieldCheck },
    { id: 'transaction', label: 'Transaction Patterns', icon: ArrowRightLeft },
    { id: 'amount', label: 'Amount Patterns', icon: BarChart3 },
    { id: 'time', label: 'Time Patterns', icon: Clock },
    { id: 'flow', label: 'Flow Patterns', icon: GitMerge },
    { id: 'counterparty', label: 'Counterparty Patterns', icon: Layers },
    { id: 'network', label: 'Network Patterns', icon: Zap },
    { id: 'withdrawal', label: 'Withdrawal Patterns', icon: ArrowUpRight },
    { id: 'sequence', label: 'Sequence Patterns', icon: TrendingUp },
    { id: 'multi_account', label: 'Multi-Account Patterns', icon: Building2 },
    { id: 'indicators', label: 'Indicators', icon: Award },
    { id: 'history', label: 'Pattern History', icon: History },
    { id: 'runs', label: 'Analysis Runs', icon: FileSpreadsheet },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto text-slate-100">
      {/* Top Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                  Transaction Intelligence Engine
                </h1>
                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  STEP 9 ENGINE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Pattern detection pipeline & explainable evidence indicators for authorized Cyber Cell review.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleSaveAnalysisRun}
              className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-400" />
              <span>Save Analysis</span>
            </button>

            <button
              onClick={() => setShowRuleModal(true)}
              className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-2"
            >
              <Sliders className="w-4 h-4 text-slate-400" />
              <span>Configured Rules ({getCustomRules().length})</span>
            </button>

            <button
              onClick={() => setShowRunModal(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-blue-900/30"
            >
              <Play className="w-4 h-4" />
              <span>Run Analysis</span>
            </button>
          </div>
        </div>

        {/* Filters Grid Controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Case ID</label>
            <select
              value={selectedCase}
              onChange={(e) => setSelectedCase(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="INV-2026-SATARA">INV-2026-SATARA</option>
              <option value="CASE-0012">CASE-0012 (Digital Fraud)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Dataset Version</label>
            <select
              value={datasetVersion}
              onChange={(e) => setDatasetVersion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="V04">Dataset V04 (Current)</option>
              <option value="V03">Dataset V03 (Archived)</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-medium focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="REVIEWED">Reviewed</option>
              <option value="IMPORTANT">Important</option>
              <option value="DISMISSED">Dismissed / Not Relevant</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Min Amount (₹)</label>
            <input
              type="number"
              value={minAmountFilter}
              onChange={(e) => setMinAmountFilter(e.target.value)}
              placeholder="e.g. 50000"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Account, Title..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs Bar (14 Sub-Tabs) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center space-x-1 overflow-x-auto text-xs shadow-lg">
        {subNavItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl font-bold transition-all whitespace-nowrap flex items-center space-x-2 shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Summary Metrics Cards (Observed Terminology) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Transactions</span>
          <span className="text-base font-mono font-bold text-slate-100">
            {transactions.length.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-500 block">Analyzed</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Accounts</span>
          <span className="text-base font-mono font-bold text-slate-100">{uniqueAccountsCount}</span>
          <span className="text-[10px] text-slate-500 block">Scope</span>
        </div>

        <div className="bg-slate-900 border border-emerald-500/20 bg-emerald-500/5 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Money In</span>
          <span className="text-sm font-mono font-bold text-emerald-400 truncate block">
            {formatCurrencyINR(totalMoneyIn)}
          </span>
          <span className="text-[10px] text-emerald-500/70 block">Observed In</span>
        </div>

        <div className="bg-slate-900 border border-rose-500/20 bg-rose-500/5 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Money Out</span>
          <span className="text-sm font-mono font-bold text-rose-400 truncate block">
            {formatCurrencyINR(totalMoneyOut)}
          </span>
          <span className="text-[10px] text-rose-500/70 block">Observed Out</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/20 bg-amber-500/5 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-400 block">Withdrawals</span>
          <span className="text-sm font-mono font-bold text-amber-400 truncate block">
            {formatCurrencyINR(totalWithdrawals)}
          </span>
          <span className="text-[10px] text-amber-500/70 block">Cash / ATM</span>
        </div>

        <div className="bg-slate-900 border border-blue-500/20 bg-blue-500/5 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-blue-400 block">Patterns</span>
          <span className="text-base font-mono font-bold text-blue-400">{indicators.length}</span>
          <span className="text-[10px] text-blue-500/70 block">Detected</span>
        </div>

        <div className="bg-slate-900 border border-purple-500/20 bg-purple-500/5 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-400 block">Indicators</span>
          <span className="text-base font-mono font-bold text-purple-400">{filteredIndicators.length}</span>
          <span className="text-[10px] text-purple-500/70 block">Filtered</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Analysis Runs</span>
          <span className="text-base font-mono font-bold text-slate-200">RUN-00042</span>
          <span className="text-[10px] text-slate-500 block">Dataset V04</span>
        </div>
      </div>

      {/* RENDER ACTIVE TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Analysis Status & Quality Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Analysis Status Log</span>
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold">
                  RUN-00042
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Dataset Version</span>
                  <span className="font-bold text-blue-400">{datasetVersion}</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Rule Engine</span>
                  <span className="font-bold text-slate-200">Default V1.2</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Started At</span>
                  <span className="text-slate-300">05 Aug 2026 22:15</span>
                </div>
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-500 uppercase block font-sans">Completed At</span>
                  <span className="text-slate-300">05 Aug 2026 22:18</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Dataset Field Coverage & Quality</span>
                </h3>
                <span className="text-[11px] font-bold text-slate-400">Component Verification</span>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { name: 'Timestamp Coverage', pct: 100 },
                  { name: 'Account Identifier Coverage', pct: 96 },
                  { name: 'Amount Coverage', pct: 100 },
                  { name: 'Channel Classification', pct: 94 },
                  { name: 'Bank / IFSC Identifier', pct: 88 },
                ].map((item) => (
                  <div key={item.name} className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-300">{item.name}</span>
                      <span className="font-mono font-bold text-slate-200">{item.pct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Patterns List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Surfaced Pattern Indicators ({filteredIndicators.length})</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredIndicators.map((ind) => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  onOpenDetails={(i) => setSelectedIndicator(i)}
                  onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
                  onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PATTERN EXPLORER TAB */}
      {activeTab === 'explorer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Pattern Explorer Table</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Total {filteredIndicators.length} Pattern Entities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950 text-slate-400 uppercase font-bold text-[10px]">
                  <th className="p-3">Pattern ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Primary Account</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date Range</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredIndicators.map((ind) => (
                  <tr key={ind.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-blue-400">{ind.id}</td>
                    <td className="p-3 font-sans font-semibold text-slate-200">
                      {ind.category.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3 text-slate-300">{ind.rootAccountLabel}</td>
                    <td className="p-3 text-slate-100 font-bold">{formatCurrencyINR(ind.totalAmount)}</td>
                    <td className="p-3 text-slate-400 text-[11px]">
                      {ind.startDate} - {ind.endDate}
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ind.priority === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {ind.priority}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300">
                        {ind.status}
                      </span>
                    </td>
                    <td className="p-3 text-right font-sans">
                      <button
                        onClick={() => setSelectedIndicator(ind)}
                        className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
                      >
                        Inspect Pattern
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AMOUNT PATTERNS TAB */}
      {activeTab === 'amount' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-emerald-400" />
              <span>Observed Amount Concentration Brackets</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">₹10K – ₹50K Bracket</span>
                <span className="text-base font-bold text-slate-100">68 Transactions</span>
                <span className="text-xs text-emerald-400 block">₹21.4 Lakhs total</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">₹50K – ₹1L Bracket</span>
                <span className="text-base font-bold text-slate-100">32 Transactions</span>
                <span className="text-xs text-emerald-400 block">₹25.6 Lakhs total</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">₹1L – ₹5L Bracket</span>
                <span className="text-base font-bold text-slate-100">18 Transactions</span>
                <span className="text-xs text-emerald-400 block">₹42.0 Lakhs total</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block font-sans">₹5L+ High-Value</span>
                <span className="text-base font-bold text-rose-400">12 Transactions</span>
                <span className="text-xs text-rose-400 block">₹1.85 Crores total</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIndicators
              .filter((i) => ['REPEATED_TRANSACTION', 'ROUND_AMOUNT', 'HIGH_VALUE'].includes(i.category))
              .map((ind) => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  onOpenDetails={(i) => setSelectedIndicator(i)}
                  onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
                  onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
          </div>
        </div>
      )}

      {/* TIME PATTERNS TAB */}
      {activeTab === 'time' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Time-of-Day & Day-of-Week Distribution</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans uppercase">00:00 - 06:00 Hrs</span>
                <span className="text-base font-bold text-slate-300">2.4%</span>
                <span className="text-[10px] text-slate-500 block">Night Window</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans uppercase">06:00 - 12:00 Hrs</span>
                <span className="text-base font-bold text-slate-200">18.6%</span>
                <span className="text-[10px] text-slate-500 block">Morning Window</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans uppercase">12:00 - 18:00 Hrs</span>
                <span className="text-base font-bold text-purple-400">62.1%</span>
                <span className="text-[10px] text-purple-400 block font-bold">Peak Concentration</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-500 block font-sans uppercase">18:00 - 24:00 Hrs</span>
                <span className="text-base font-bold text-slate-200">16.9%</span>
                <span className="text-[10px] text-slate-500 block">Evening Window</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIndicators
              .filter((i) => ['TRANSACTION_BURST', 'RAPID_MOVEMENT'].includes(i.category))
              .map((ind) => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  onOpenDetails={(i) => setSelectedIndicator(i)}
                  onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
                  onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
          </div>
        </div>
      )}

      {/* FLOW & SEQUENCE PATTERNS TAB */}
      {(activeTab === 'flow' || activeTab === 'sequence') && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span>Multi-Hop Sequence Chain & Path Retention</span>
            </h3>

            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Observed Hop 1 Retention</span>
                <span className="text-emerald-400 font-bold">100% (₹5,00,000)</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Observed Hop 2 Retention</span>
                <span className="text-amber-400 font-bold">96% (₹4,80,000)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Observed Hop 3 Retention</span>
                <span className="text-purple-400 font-bold">90% (₹4,50,000)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIndicators
              .filter((i) => ['SPLIT_FLOW', 'CONSOLIDATION', 'MULTI_HOP', 'CIRCULAR_FLOW'].includes(i.category))
              .map((ind) => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  onOpenDetails={(i) => setSelectedIndicator(i)}
                  onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
                  onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
          </div>
        </div>
      )}

      {/* WITHDRAWAL PATTERNS TAB */}
      {activeTab === 'withdrawal' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>Credit to Cash / ATM Withdrawal Traceability</span>
            </h3>
            <p className="text-xs text-slate-400">
              Surfaces physical cash liquidation events following incoming account credits.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIndicators
              .filter((i) => i.category === 'WITHDRAWAL_AFTER_CREDIT')
              .map((ind) => (
                <IndicatorCard
                  key={ind.id}
                  indicator={ind}
                  onOpenDetails={(i) => setSelectedIndicator(i)}
                  onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
                  onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
                  onUpdateStatus={handleUpdateStatus}
                />
              ))}
          </div>
        </div>
      )}

      {/* GENERIC / FALLBACK GRID FOR OTHER TABS */}
      {!['overview', 'explorer', 'amount', 'time', 'flow', 'sequence', 'withdrawal'].includes(activeTab) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredIndicators.map((ind) => (
            <IndicatorCard
              key={ind.id}
              indicator={ind}
              onOpenDetails={(i) => setSelectedIndicator(i)}
              onShowOnGraph={(accId) => onShowOnGraph && onShowOnGraph(accId)}
              onOpenAccount={(accId) => onOpenAccount && onOpenAccount(accId)}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      {/* MODALS */}
      {selectedIndicator && (
        <IndicatorDetailsModal
          indicator={selectedIndicator}
          statements={statements}
          onClose={() => setSelectedIndicator(null)}
          onShowOnGraph={(accId) => {
            setSelectedIndicator(null);
            if (onShowOnGraph) onShowOnGraph(accId);
          }}
          onOpenAccount={(accId) => {
            setSelectedIndicator(null);
            if (onOpenAccount) onOpenAccount(accId);
          }}
          onOpenTransaction={(txn) => {
            setSelectedIndicator(null);
            if (onSelectTransaction) onSelectTransaction(txn);
          }}
          onUpdateStatus={(id, st, reason, notes) => handleUpdateStatus(id, st, reason, notes)}
        />
      )}

      {showRunModal && (
        <RunAnalysisModal
          transactions={transactions}
          statements={statements}
          onClose={() => setShowRunModal(false)}
          onAnalysisCompleted={handleAnalysisCompleted}
        />
      )}

      {showRuleModal && (
        <CustomRuleBuilderModal
          onClose={() => setShowRuleModal(false)}
          onRuleSaved={() => {
            const reRun = runPatternAnalysis(transactions, statements);
            setIndicators(reRun);
          }}
        />
      )}

      {showHistoryModal && <AnalysisHistoryModal onClose={() => setShowHistoryModal(false)} />}
    </div>
  );
};

