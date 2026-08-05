'use client';

import React, { useState, useMemo } from 'react';
import {
  Users,
  Building2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign,
  TrendingUp,
  Activity,
  Layers,
  Search,
  Filter,
  Eye,
  Clock,
  ArrowRightLeft,
  FileSpreadsheet,
  AlertCircle,
  GitMerge,
  Info,
  ShieldCheck,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  Zap,
  BarChart2,
  PieChart as PieChartIcon,
  StickyNote,
  Briefcase,
  FileText,
  CheckCircle2,
  Lock,
  Unlock,
  HelpCircle,
  Tag,
  Sliders,
  Database,
  MapPin,
  Hash,
  ShieldAlert,
  ListFilter,
  Plus,
  Share2,
  X,
  PlusCircle,
  Check,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { Transaction, BankStatement, TransactionChannel, AccountEntity, RapidMovementItem } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { runPatternAnalysis } from '@/lib/patternEngine';
import {
  getAccountEntities,
  getAccountDetails,
  getConnectedAccounts,
  getCounterpartyConcentration,
  getDailyAccountActivity,
  getMonthlyAccountActivity,
  detectRapidMovements,
  getAccountIndicators,
  getStatisticalSummary,
  getAmountDistribution,
  getRoundNumberAnalysis,
  getRepeatedAmountAnalysis,
  getRepeatedCounterpartyAmountAnalysis,
  getIntervalProfile,
  getFlowConversionEvents,
  getCreditWithdrawalEvents,
  getActivitySpikes,
  getDataQualityReport,
  AccountInvestigationNote,
  AccountClassificationRecord,
} from '@/lib/intelligence';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';
import { UPIIntelligenceModal } from '../transactions/UPIIntelligenceModal';
import { AccountComparisonModal } from './AccountComparisonModal';
import { MoneyFlowWorkspace } from '../money-flow/MoneyFlowWorkspace';
import { TimelineWorkspace } from '../timeline/TimelineWorkspace';
import { getStoredCases, saveCasesToStorage } from '@/lib/caseStorage';
import { InvestigationCase } from '@/types/case';

export type AccountViewTab =
  | 'directory'
  | 'overview'
  | 'transactions'
  | 'money_in'
  | 'money_out'
  | 'withdrawals'
  | 'counterparties'
  | 'network'
  | 'timeline'
  | 'behavior'
  | 'indicators'
  | 'cases'
  | 'evidence'
  | 'notes'
  | 'lineage';

interface AccountIntelligenceViewProps {
  initialAccountId?: string;
  transactions: Transaction[];
  statements: BankStatement[];
  onSelectTransaction?: (txn: Transaction) => void;
  onOpenMoneyFlow?: (accId: string) => void;
}

export const AccountIntelligenceView: React.FC<AccountIntelligenceViewProps> = ({
  initialAccountId,
  transactions,
  statements,
  onSelectTransaction,
  onOpenMoneyFlow,
}) => {
  const allAccounts = useMemo(() => {
    return getAccountEntities(transactions, statements);
  }, [transactions, statements]);

  // Selected Account ID
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    initialAccountId || (allAccounts[0]?.id ?? 'XXXX XXXX 4821')
  );

  // Active view tab inside account intelligence
  const [activeTab, setActiveTab] = useState<AccountViewTab>('overview');

  // Directory Filters & Search
  const [dirSearchQuery, setDirSearchQuery] = useState('');
  const [dirBankFilter, setDirBankFilter] = useState('ALL');

  // Transactions Filters
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'IN' | 'OUT' | 'WITHDRAWAL'>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals state
  const [inspectTxn, setInspectTxn] = useState<Transaction | null>(null);
  const [inspectUpi, setInspectUpi] = useState<string | null>(null);
  const [showComparison, setShowComparison] = useState(false);
  const [showSourceRowModal, setShowSourceRowModal] = useState<Transaction | null>(null);
  const [showUnmaskedModal, setShowUnmaskedModal] = useState(false);
  const [showAddToCaseModal, setShowAddToCaseModal] = useState(false);
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [showClassificationModal, setShowClassificationModal] = useState(false);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Investigator Notes local state
  const [notesList, setNotesList] = useState<AccountInvestigationNote[]>([
    {
      id: 'NOTE-ACC-001',
      accountId: 'XXXX XXXX 4821',
      type: 'Observation',
      content: 'Account exhibits rapid incoming credits from 4 distinct UPI IDs followed by immediate cash withdrawals.',
      createdBy: 'PI V. R. Kadam',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);

  // Investigator Classification local state
  const [classificationRecord, setClassificationRecord] = useState<AccountClassificationRecord>({
    accountId: selectedAccountId,
    classification: 'Under Review',
    reason: 'Rapid cash withdrawal following high value credits flagged by pattern engine.',
    updatedBy: 'PI V. R. Kadam',
    updatedAt: new Date().toISOString(),
    history: [
      {
        previous: 'Unclassified',
        new: 'Under Review',
        changedBy: 'PI V. R. Kadam',
        changedAt: new Date().toISOString(),
        reason: 'Initial investigation assignment',
      },
    ],
  });

  // Modal forms input
  const [noteFormContent, setNoteFormContent] = useState('');
  const [noteFormType, setNoteFormType] = useState<
    'Observation' | 'Question' | 'Lead' | 'Follow-up' | 'Analysis' | 'General'
  >('Observation');
  const [caseFormId, setCaseFormId] = useState('');
  const [caseFormRole, setCaseFormRole] = useState('Primary Account');
  const [caseFormReason, setCaseFormReason] = useState('');
  const [newClassification, setNewClassification] = useState<'Unclassified' | 'Under Review' | 'Relevant' | 'Not Relevant' | 'Watch' | 'Other'>('Under Review');
  const [classificationReason, setClassificationReason] = useState('');

  // Get current account details & transactions
  const { account, accountTransactions } = useMemo(() => {
    return getAccountDetails(selectedAccountId, transactions, statements);
  }, [selectedAccountId, transactions, statements]);

  // Active account fallback for display
  const activeAccount: AccountEntity = useMemo(() => {
    return account || {
      id: selectedAccountId || 'XXXX XXXX 4821',
      accountNumberMasked: selectedAccountId || 'XXXX XXXX 4821',
      bankName: 'Example Bank',
      ifsc: 'XXXX0001234',
      branch: 'Satara Main',
      primaryHolder: 'Observed Account Holder',
      totalTransactions: 428,
      creditCount: 240,
      debitCount: 188,
      totalMoneyIn: 1850000,
      totalMoneyOut: 1790000,
      totalWithdrawals: 450000,
      totalDeposits: 0,
      netFlow: 60000,
      largestCredit: 450000,
      largestDebit: 300000,
      averageTransactionValue: 8500,
      firstSeen: '2026-06-01',
      lastSeen: '2026-08-05',
      statementIds: ['STMT-00012'],
      statementCount: 1,
      connectedAccountsCount: 23,
    };
  }, [account, selectedAccountId]);

  const connections = useMemo(() => getConnectedAccounts(activeAccount.id, accountTransactions), [activeAccount.id, accountTransactions]);
  const concentration = useMemo(() => {
    const totalCp = connections.length;
    const sortedBySent = [...connections].filter((c) => c.totalSent > 0).sort((a, b) => b.totalSent - a.totalSent);
    const totalSentSum = activeAccount.totalMoneyOut > 0 ? activeAccount.totalMoneyOut : 1;
    const top1Sum = sortedBySent[0]?.totalSent || 0;
    const top5Sum = sortedBySent.slice(0, 5).reduce((acc, c) => acc + c.totalSent, 0);
    const top10Sum = sortedBySent.slice(0, 10).reduce((acc, c) => acc + c.totalSent, 0);
    return {
      totalCounterparties: totalCp,
      top1Percentage: Math.min(100, Math.round((top1Sum / totalSentSum) * 100)),
      top5Percentage: Math.min(100, Math.round((top5Sum / totalSentSum) * 100)),
      top10Percentage: Math.min(100, Math.round((top10Sum / totalSentSum) * 100)),
    };
  }, [connections, activeAccount.totalMoneyOut]);
  const rapidMovements = useMemo(() => detectRapidMovements(accountTransactions, 30), [accountTransactions]);
  const indicators = useMemo(() => getAccountIndicators(activeAccount, accountTransactions, rapidMovements.length), [activeAccount, accountTransactions, rapidMovements.length]);
  const dailyActivity = useMemo(() => getDailyAccountActivity(accountTransactions), [accountTransactions]);
  const monthlyActivity = useMemo(() => getMonthlyAccountActivity(accountTransactions), [accountTransactions]);

  // Advanced Step 8 Behavioral & Data Quality Analytics
  const dataQuality = useMemo(() => getDataQualityReport(activeAccount, accountTransactions), [activeAccount, accountTransactions]);
  const amountBuckets = useMemo(() => getAmountDistribution(accountTransactions), [accountTransactions]);
  const roundNumbers = useMemo(() => getRoundNumberAnalysis(accountTransactions), [accountTransactions]);
  const repeatedAmounts = useMemo(() => getRepeatedAmountAnalysis(accountTransactions), [accountTransactions]);
  const repeatedCpAmounts = useMemo(() => getRepeatedCounterpartyAmountAnalysis(accountTransactions), [accountTransactions]);
  const intervalProfile = useMemo(() => getIntervalProfile(accountTransactions), [accountTransactions]);
  const flowConversions = useMemo(() => getFlowConversionEvents(accountTransactions, 120), [accountTransactions]);
  const creditWithdrawals = useMemo(() => getCreditWithdrawalEvents(accountTransactions, 120), [accountTransactions]);
  const activitySpikes = useMemo(() => getActivitySpikes(accountTransactions), [accountTransactions]);

  // Statistical summary
  const inStats = useMemo(() => getStatisticalSummary(accountTransactions.filter((t) => t.creditAmount > 0).map((t) => t.creditAmount)), [accountTransactions]);
  const outStats = useMemo(() => getStatisticalSummary(accountTransactions.filter((t) => t.debitAmount > 0 && t.transactionType !== 'WITHDRAWAL').map((t) => t.debitAmount)), [accountTransactions]);
  const withdrawalStats = useMemo(() => getStatisticalSummary(accountTransactions.filter((t) => t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM').map((t) => t.debitAmount)), [accountTransactions]);

  // Filtered Account Transactions
  const filteredAccountTxns = useMemo(() => {
    return accountTransactions.filter((t) => {
      if (directionFilter === 'IN' && t.creditAmount <= 0) return false;
      if (directionFilter === 'OUT' && (t.debitAmount <= 0 || t.transactionType === 'WITHDRAWAL')) return false;
      if (directionFilter === 'WITHDRAWAL' && t.transactionType !== 'WITHDRAWAL' && t.channel !== 'ATM') return false;
      if (channelFilter !== 'ALL' && t.channel !== channelFilter) return false;
      if (dateFrom && t.transactionDate < dateFrom) return false;
      if (dateTo && t.transactionDate > dateTo) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchNarration = t.narration.toLowerCase().includes(q);
        const matchRef = (t.utr || t.transactionId || '').toLowerCase().includes(q);
        const matchBeneficiary = (t.beneficiary || '').toLowerCase().includes(q);
        const matchUpi = (t.upiId || '').toLowerCase().includes(q);
        if (!matchNarration && !matchRef && !matchBeneficiary && !matchUpi) return false;
      }
      return true;
    });
  }, [accountTransactions, directionFilter, channelFilter, dateFrom, dateTo, searchQuery]);

  // Handle Add Note Submit
  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormContent.trim()) return;
    const newNote: AccountInvestigationNote = {
      id: `NOTE-ACC-${Date.now()}`,
      accountId: activeAccount.id,
      type: noteFormType,
      content: noteFormContent.trim(),
      createdBy: 'PI V. R. Kadam',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setNotesList([newNote, ...notesList]);
    setNoteFormContent('');
    setShowAddNoteModal(false);
    setNoticeMessage('Investigator Note successfully recorded for account.');
  };

  // Handle Classification Update Submit
  const handleClassificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedHistory = [
      {
        previous: classificationRecord.classification,
        new: newClassification,
        changedBy: 'PI V. R. Kadam',
        changedAt: new Date().toISOString(),
        reason: classificationReason || 'Investigator classification updated.',
      },
      ...classificationRecord.history,
    ];
    setClassificationRecord({
      accountId: activeAccount.id,
      classification: newClassification,
      reason: classificationReason || classificationRecord.reason,
      updatedBy: 'PI V. R. Kadam',
      updatedAt: new Date().toISOString(),
      history: updatedHistory,
    });
    setShowClassificationModal(false);
    setNoticeMessage(`Account classification updated to "${newClassification}".`);
  };

  // Handle Add Account to Case Submit
  const handleAddToCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseFormId) return;
    const cases = getStoredCases();
    const updatedCases = cases.map((c) => {
      if (c.id === caseFormId) {
        const existingAccs = c.accounts || [];
        if (!existingAccs.some((a) => a.accountId === activeAccount.id)) {
          return {
            ...c,
            accounts: [
              ...existingAccs,
              {
                id: `CA-${Date.now()}`,
                investigationId: c.id,
                accountId: activeAccount.id,
                accountNumberMasked: activeAccount.accountNumberMasked,
                bankName: activeAccount.bankName,
                relationshipRole: caseFormRole as any,
                reason: caseFormReason || 'Added via Account Intelligence Workspace',
                addedAt: new Date().toISOString(),
              },
            ],
          };
        }
      }
      return c;
    });
    saveCasesToStorage(updatedCases);
    setShowAddToCaseModal(false);
    setNoticeMessage(`Account ${activeAccount.accountNumberMasked} successfully linked to investigation ${caseFormId}.`);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* STEP 8 HEADER & ACCOUNT SELECTION BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        {/* CRITICAL PRINCIPLE DISTINCTION BANNER */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 font-semibold">
              CRITICAL PRINCIPLE: Data Lineage & Provenance Integrity
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold">
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Observed Statement Data</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>Derived Analytics</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span>Investigator Information</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
              <span>External Info</span>
            </span>
          </div>
        </div>

        {/* ACCOUNT PROFILE HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0 mt-1">
              <Users className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-2xl font-black font-mono text-slate-100 tracking-wide">
                  {activeAccount.accountNumberMasked}
                </span>

                <button
                  onClick={() => setShowUnmaskedModal(true)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] font-mono text-slate-300 border border-slate-700 transition-colors flex items-center space-x-1"
                  title="Reveal authorized full unmasked account identifier"
                >
                  <Lock className="w-3 h-3 text-amber-400" />
                  <span>Reveal Unmasked</span>
                </button>

                <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  OBSERVED ACCOUNT
                </span>

                <button
                  onClick={() => setShowClassificationModal(true)}
                  className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30 hover:bg-purple-500/20 transition-colors flex items-center space-x-1"
                >
                  <Tag className="w-3 h-3 text-purple-400" />
                  <span>Classification: {classificationRecord.classification}</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <strong className="text-slate-200">{activeAccount.bankName}</strong>
                </span>
                {activeAccount.branch && (
                  <span>
                    Branch: <strong className="text-slate-300">{activeAccount.branch}</strong>
                  </span>
                )}
                {activeAccount.ifsc && (
                  <span>
                    IFSC: <strong className="text-slate-300 font-mono">{activeAccount.ifsc}</strong>
                  </span>
                )}
                <span className="text-slate-500">
                  | Statement Ref: <strong className="text-slate-300 font-mono">{activeAccount.statementIds[0] || 'STMT-00012'}</strong>
                </span>
                <span className="text-slate-500">
                  | Quality: <strong className="text-emerald-400">{dataQuality.accountIdentifierStatus}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Account Switcher & Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <span className="text-[11px] font-bold text-slate-400 px-2 uppercase">Switch Account:</span>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none"
              >
                {allAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountNumberMasked} ({acc.bankName})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => setShowComparison(true)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-400" />
              <span>Compare Account</span>
            </button>

            <button
              onClick={() => setShowAddToCaseModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <Briefcase className="w-3.5 h-3.5 text-purple-400" />
              <span>Add to Case</span>
            </button>

            <button
              onClick={() => setShowAddNoteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors flex items-center space-x-1.5"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <span>Add Note</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('network');
                onOpenMoneyFlow?.(activeAccount.id);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5 shadow-md cursor-pointer"
            >
              <GitMerge className="w-3.5 h-3.5" />
              <span>Investigate Account</span>
            </button>
          </div>
        </div>

        {noticeMessage && (
          <div className="p-3 rounded-xl bg-blue-950/70 border border-blue-800/80 text-xs text-blue-300 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{noticeMessage}</span>
            </div>
            <button onClick={() => setNoticeMessage(null)} className="text-blue-400 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* STEP 8 ALL 15 SUB-NAVIGATION TABS */}
        <div className="flex items-center space-x-1 overflow-x-auto border-b border-slate-800/80 pb-1 scrollbar-thin">
          {[
            { id: 'directory', label: 'Account Directory', icon: Users },
            { id: 'overview', label: 'Profile Overview', icon: LayoutDashboardIcon },
            { id: 'transactions', label: `Transactions (${accountTransactions.length})`, icon: ArrowRightLeft },
            { id: 'money_in', label: 'Observed Money In', icon: ArrowDownLeft },
            { id: 'money_out', label: 'Observed Money Out', icon: ArrowUpRight },
            { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
            { id: 'counterparties', label: `Counterparties (${connections.length})`, icon: Users },
            { id: 'network', label: 'Money Flow Graph', icon: GitMerge },
            { id: 'timeline', label: 'Timeline & Heatmap', icon: Clock },
            { id: 'behavior', label: 'Behavior Analytics', icon: BarChart2 },
            { id: 'indicators', label: `Pattern Indicators (${indicators.length})`, icon: ShieldAlert },
            { id: 'cases', label: 'Linked Cases', icon: Briefcase },
            { id: 'evidence', label: 'Evidence Vault', icon: FileText },
            { id: 'notes', label: `Notes (${notesList.length})`, icon: StickyNote },
            { id: 'lineage', label: 'Data Lineage & Traceability', icon: Database },
          ].map((tab) => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AccountViewTab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <IconComp className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: ACCOUNT DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Observed Account Directory</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Master directory of all bank accounts observed across imported statement datasets ({allAccounts.length} total)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={dirSearchQuery}
                    onChange={(e) => setDirSearchQuery(e.target.value)}
                    placeholder="Search account number, bank, IFSC, holder..."
                    className="bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 w-64 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <select
                  value={dirBankFilter}
                  onChange={(e) => setDirBankFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="ALL">All Banks</option>
                  {Array.from(new Set(allAccounts.map((a) => a.bankName))).map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Bank</th>
                    <th className="py-3 px-4">Branch / IFSC</th>
                    <th className="py-3 px-4">Observed Holder</th>
                    <th className="py-3 px-4 text-right">Transactions</th>
                    <th className="py-3 px-4 text-right">Observed Money In</th>
                    <th className="py-3 px-4 text-right">Observed Money Out</th>
                    <th className="py-3 px-4">First Observed</th>
                    <th className="py-3 px-4">Last Observed</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {allAccounts
                    .filter((acc) => {
                      if (dirBankFilter !== 'ALL' && acc.bankName !== dirBankFilter) return false;
                      if (dirSearchQuery) {
                        const q = dirSearchQuery.toLowerCase();
                        const mAcc = acc.accountNumberMasked.toLowerCase().includes(q);
                        const mBank = acc.bankName.toLowerCase().includes(q);
                        const mIfsc = (acc.ifsc || '').toLowerCase().includes(q);
                        const mHolder = (acc.primaryHolder || '').toLowerCase().includes(q);
                        if (!mAcc && !mBank && !mIfsc && !mHolder) return false;
                      }
                      return true;
                    })
                    .map((acc) => (
                      <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-100 font-bold">
                          {acc.accountNumberMasked}
                        </td>
                        <td className="py-3 px-4 text-slate-300">{acc.bankName}</td>
                        <td className="py-3 px-4 text-slate-400">
                          {acc.branch || 'Main Branch'} {acc.ifsc ? `(${acc.ifsc})` : ''}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {acc.primaryHolder || 'Observed Account Holder'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold text-slate-200">
                          {acc.totalTransactions}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-emerald-400 font-mono">
                          {formatCurrencyINR(acc.totalMoneyIn, false)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-amber-400 font-mono">
                          {formatCurrencyINR(acc.totalMoneyOut, false)}
                        </td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{acc.firstSeen || 'N/A'}</td>
                        <td className="py-3 px-4 text-slate-400 text-[11px]">{acc.lastSeen || 'N/A'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              setSelectedAccountId(acc.id);
                              setActiveTab('overview');
                            }}
                            className="px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 font-semibold text-[11px] transition-colors"
                          >
                            Open Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: OVERVIEW & PROFILE SUMMARY */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Cards with Strict Financial Terminology */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div
              onClick={() => setActiveTab('transactions')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-slate-700 transition-colors cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Observed Transactions</span>
                <Activity className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-2xl font-black text-slate-100">{activeAccount.totalTransactions}</span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                {activeAccount.creditCount} Credits | {activeAccount.debitCount} Debits
              </p>
            </div>

            <div
              onClick={() => setActiveTab('money_in')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-emerald-500/50 transition-colors cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Observed Money In
                </span>
                <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-emerald-400">
                {formatCurrencyINR(activeAccount.totalMoneyIn, false)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Largest: {formatCurrencyINR(activeAccount.largestCredit, true)}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('money_out')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-amber-500/50 transition-colors cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Observed Money Out
                </span>
                <ArrowUpRight className="w-4 h-4 text-amber-400" />
              </div>
              <span className="text-2xl font-black text-amber-400">
                {formatCurrencyINR(activeAccount.totalMoneyOut, false)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Largest: {formatCurrencyINR(activeAccount.largestDebit, true)}
              </p>
            </div>

            <div
              onClick={() => setActiveTab('withdrawals')}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-purple-500/50 transition-colors cursor-pointer shadow-md"
            >
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                  Observed Withdrawals
                </span>
                <DollarSign className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-2xl font-black text-purple-400">
                {formatCurrencyINR(activeAccount.totalWithdrawals, false)}
              </span>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Net Flow: {formatCurrencyINR(activeAccount.netFlow, true)}
              </p>
            </div>
          </div>

          {/* Account Identifiers & Data Quality Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Hash className="w-4 h-4 text-blue-400" />
                <span>Account Information</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Account Number:</span>
                  <span className="font-mono text-slate-200 font-bold">{activeAccount.accountNumberMasked}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="text-slate-200 font-semibold">{activeAccount.bankName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Branch Location:</span>
                  <span className="text-slate-200">{activeAccount.branch || 'Satara Main'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="font-mono text-slate-300">{activeAccount.ifsc || 'XXXX0001234'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Holder Name:</span>
                  <span className="text-slate-200">{activeAccount.primaryHolder || 'Observed Holder'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>Data Source Statement</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Statement ID:</span>
                  <span className="font-mono text-slate-200 font-bold">{activeAccount.statementIds[0] || 'STMT-00012'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Statement Period:</span>
                  <span className="text-slate-200">
                    {activeAccount.firstSeen || '01 Jun 2026'} – {activeAccount.lastSeen || '05 Aug 2026'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Dataset Version:</span>
                  <span className="font-mono text-emerald-400 font-bold">V04</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Import Timestamp:</span>
                  <span className="text-slate-300 text-[11px]">05 Aug 2026 22:15</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                <span>Data Quality Report</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Account Identifier:</span>
                  <span className="text-emerald-400 font-bold">{dataQuality.accountIdentifierStatus}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">Bank Name:</span>
                  <span className="text-emerald-400 font-bold">{dataQuality.bankStatus}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5">
                  <span className="text-slate-400">IFSC Code:</span>
                  <span className="text-emerald-400 font-bold">{dataQuality.ifscStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Timestamp Accuracy:</span>
                  <span className="text-blue-400 font-bold">{dataQuality.exactTimestampPercentage}% exact</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS TABLE */}
      {activeTab === 'transactions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <ArrowRightLeft className="w-5 h-5 text-blue-400" />
                <span>Account Transactions Log ({filteredAccountTxns.length})</span>
              </h3>
              <p className="text-xs text-slate-400">
                Directly observed bank statement records for account {activeAccount.accountNumberMasked}
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search narration, ref, beneficiary..."
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />

              <select
                value={directionFilter}
                onChange={(e) => setDirectionFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Directions</option>
                <option value="IN">Money In Only</option>
                <option value="OUT">Money Out Only</option>
                <option value="WITHDRAWAL">Withdrawals Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Narration</th>
                  <th className="py-3 px-4 text-right">Debit (Out)</th>
                  <th className="py-3 px-4 text-right">Credit (In)</th>
                  <th className="py-3 px-4">Counterparty / UPI</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">UTR / Ref</th>
                  <th className="py-3 px-4 text-center">Source Row</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {filteredAccountTxns.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-300 text-[11px] whitespace-nowrap">
                      {t.transactionDate}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.creditAmount > 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : t.transactionType === 'WITHDRAWAL'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {t.transactionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-200 max-w-xs truncate">{t.narration}</td>
                    <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                      {t.debitAmount > 0 ? formatCurrencyINR(t.debitAmount, false) : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                      {t.creditAmount > 0 ? formatCurrencyINR(t.creditAmount, false) : '-'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      {t.beneficiary || t.upiId || 'Observed Counterparty'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-semibold">{t.channel}</td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {t.utr || t.transactionId || '-'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setShowSourceRowModal(t)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="View Original Statement Source Record"
                      >
                        <Database className="w-3.5 h-3.5 text-blue-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MONEY IN */}
      {activeTab === 'money_in' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-emerald-400" />
            <span>Observed Money In Records</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction ID / UTR</th>
                  <th className="py-3 px-4">Sender / Counterparty</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Source Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {accountTransactions
                  .filter((t) => t.creditAmount > 0)
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">{t.transactionDate}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{t.utr || t.transactionId || '-'}</td>
                      <td className="py-3 px-4 text-slate-200">{t.beneficiary || t.upiId || 'Sender'}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">
                        {formatCurrencyINR(t.creditAmount, false)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{t.channel}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.statementId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: MONEY OUT */}
      {activeTab === 'money_out' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ArrowUpRight className="w-5 h-5 text-amber-400" />
            <span>Observed Money Out Records</span>
          </h3>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Transaction ID / UTR</th>
                  <th className="py-3 px-4">Recipient / Counterparty</th>
                  <th className="py-3 px-4 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Source Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {accountTransactions
                  .filter((t) => t.debitAmount > 0 && t.transactionType !== 'WITHDRAWAL')
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">{t.transactionDate}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{t.utr || t.transactionId || '-'}</td>
                      <td className="py-3 px-4 text-slate-200">{t.beneficiary || t.upiId || 'Recipient'}</td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400 font-bold">
                        {formatCurrencyINR(t.debitAmount, false)}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{t.channel}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.statementId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: WITHDRAWALS TABLE WITH ATM LOCATION RULE */}
      {activeTab === 'withdrawals' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-400" />
              <span>Observed ATM & Cash Withdrawals</span>
            </h3>

            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-semibold">
              Rule: Never infer location from branch address if missing in statement narration
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Transaction ID</th>
                  <th className="py-3 px-4 text-right">Withdrawal Amount</th>
                  <th className="py-3 px-4">ATM / Location</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Source Statement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {accountTransactions
                  .filter((t) => t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM')
                  .map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-300">{t.transactionDate}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{t.transactionId || t.utr || '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-purple-400 font-bold">
                        {formatCurrencyINR(t.debitAmount, false)}
                      </td>
                      <td className="py-3 px-4">
                        {t.narration.toLowerCase().includes('atm') || t.narration.toLowerCase().includes('cash') ? (
                          <span className="text-slate-200 flex items-center space-x-1">
                            <MapPin className="w-3.5 h-3.5 text-purple-400" />
                            <span>{t.narration.slice(0, 35)}</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] italic border border-slate-700">
                            Location unavailable
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-400">{t.channel}</td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{t.statementId}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: COUNTERPARTIES & CONCENTRATION */}
      {activeTab === 'counterparties' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Total Counterparties
              </span>
              <span className="text-2xl font-black text-slate-100">{concentration.totalCounterparties}</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top 1 Concentration
              </span>
              <span className="text-2xl font-black text-amber-400">{concentration.top1Percentage}%</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top 5 Concentration
              </span>
              <span className="text-2xl font-black text-blue-400">{concentration.top5Percentage}%</span>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Top 10 Concentration
              </span>
              <span className="text-2xl font-black text-purple-400">{concentration.top10Percentage}%</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Users className="w-5 h-5 text-blue-400" />
              <span>Observed Counterparties Ranking & Relationships</span>
            </h3>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Related Counterparty</th>
                    <th className="py-3 px-4">Direction</th>
                    <th className="py-3 px-4 text-right">Transactions</th>
                    <th className="py-3 px-4 text-right">Money Received (₹)</th>
                    <th className="py-3 px-4 text-right">Money Sent (₹)</th>
                    <th className="py-3 px-4 text-right">Total Volume (₹)</th>
                    <th className="py-3 px-4">First Observed</th>
                    <th className="py-3 px-4">Last Observed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {connections.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-200 font-bold">{c.counterpartyName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {c.direction} Counterparty
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-200">{c.transactionCount}</td>
                      <td className="py-3 px-4 text-right font-mono text-emerald-400">
                        {formatCurrencyINR(c.totalReceived, false)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-amber-400">
                        {formatCurrencyINR(c.totalSent, false)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-blue-400 font-bold">
                        {formatCurrencyINR(c.totalAmount, false)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{c.firstSeen || '-'}</td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{c.lastSeen || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MONEY FLOW GRAPH INTEGRATION */}
      {activeTab === 'network' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <GitMerge className="w-5 h-5 text-blue-400" />
                <span>Account Network & Money Flow Graph</span>
              </h3>
              <p className="text-xs text-slate-400">
                Step 4 Graph Engine centered on account {activeAccount.accountNumberMasked}
              </p>
            </div>

            <div className="flex items-center space-x-2 text-xs">
              <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                Direct Degree: {connections.length} Counterparties
              </span>
            </div>
          </div>

          <MoneyFlowWorkspace
            initialRootQuery={activeAccount.accountNumberMasked}
            transactions={transactions}
            statements={statements}
            onOpenAccountIntelligence={(accId) => setSelectedAccountId(accId)}
          />
        </div>
      )}

      {/* TAB 9: TIMELINE & HEATMAP */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span>Chronological Timeline & Temporal Workspace</span>
            </h3>
          </div>

          <TimelineWorkspace
            transactions={transactions}
            statements={statements}
            indicators={[]}
            cases={[]}
            selectedAccount={activeAccount.id}
            onSelectTransaction={(tId) => {
              const found = transactions.find((t) => t.id === tId);
              if (found) setInspectTxn(found);
            }}
          />
        </div>
      )}

      {/* TAB 10: BEHAVIOR ANALYTICS */}
      {activeTab === 'behavior' && (
        <div className="space-y-6">
          {/* Amount Distribution Buckets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-blue-400" />
              <span>Transaction Amount Range Distribution</span>
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {amountBuckets.map((b) => (
                <div key={b.rangeLabel} className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-center space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">{b.rangeLabel}</span>
                  <span className="text-xl font-bold text-slate-100">{b.count}</span>
                  <p className="text-[11px] text-blue-400 font-semibold">{b.percentage}% of txns</p>
                </div>
              ))}
            </div>
          </div>

          {/* Statistical Summaries */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-2">
                <ArrowDownLeft className="w-4 h-4" />
                <span>Incoming Money Statistics</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Min Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(inStats.min, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Max Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(inStats.max, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Average:</span><span className="font-mono text-slate-200">{formatCurrencyINR(inStats.average, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Median:</span><span className="font-mono text-slate-200">{formatCurrencyINR(inStats.median, false)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Std Deviation:</span><span className="font-mono text-slate-200">{formatCurrencyINR(inStats.stdDev, false)}</span></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <ArrowUpRight className="w-4 h-4" />
                <span>Outgoing Money Statistics</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Min Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(outStats.min, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Max Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(outStats.max, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Average:</span><span className="font-mono text-slate-200">{formatCurrencyINR(outStats.average, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Median:</span><span className="font-mono text-slate-200">{formatCurrencyINR(outStats.median, false)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Std Deviation:</span><span className="font-mono text-slate-200">{formatCurrencyINR(outStats.stdDev, false)}</span></div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-md">
              <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Withdrawal Statistics</span>
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Min Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(withdrawalStats.min, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Max Amount:</span><span className="font-mono text-slate-200">{formatCurrencyINR(withdrawalStats.max, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Average:</span><span className="font-mono text-slate-200">{formatCurrencyINR(withdrawalStats.average, false)}</span></div>
                <div className="flex justify-between border-b border-slate-800 pb-1.5"><span className="text-slate-400">Median:</span><span className="font-mono text-slate-200">{formatCurrencyINR(withdrawalStats.median, false)}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Std Deviation:</span><span className="font-mono text-slate-200">{formatCurrencyINR(withdrawalStats.stdDev, false)}</span></div>
              </div>
            </div>
          </div>

          {/* Flow Conversion & Flow Retention Ratio */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span>Flow Conversion & Retention Analysis</span>
            </h3>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">Observed Outgoing-to-Incoming Retention Ratio</span>
                <span className="text-2xl font-black text-amber-400">
                  {activeAccount.totalMoneyIn > 0
                    ? `${Math.round((activeAccount.totalMoneyOut / activeAccount.totalMoneyIn) * 100)}%`
                    : 'N/A'}
                </span>
                <p className="text-[11px] text-slate-500 italic mt-0.5">
                  Note: Descriptive outgoing flow ratio relative to incoming credits. Explicitly not an account balance.
                </p>
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <div>Observed Incoming: <strong className="text-emerald-400">{formatCurrencyINR(activeAccount.totalMoneyIn, false)}</strong></div>
                <div>Observed Outgoing: <strong className="text-amber-400">{formatCurrencyINR(activeAccount.totalMoneyOut, false)}</strong></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: PATTERN INDICATORS */}
      {activeTab === 'indicators' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <span>Pattern Engine Flagged Indicators ({indicators.length})</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {indicators.map((ind, idx) => (
              <div key={`${ind.type}-${idx}`} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-xs">
                    {ind.title}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">{ind.level}</span>
                </div>

                <p className="text-xs text-slate-300">{ind.description}</p>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] space-y-1 text-slate-400">
                  <div><strong>Observed Detail:</strong> {ind.details}</div>
                  <div><strong>Calculation:</strong> Automated behavioral evaluation</div>
                  <div><strong>Dataset Version:</strong> V04</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 12: LINKED CASES */}
      {activeTab === 'cases' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <Briefcase className="w-5 h-5 text-purple-400" />
              <span>Related Investigations & Case Links</span>
            </h3>

            <button
              onClick={() => setShowAddToCaseModal(true)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Link Account to Case</span>
            </button>
          </div>

          <div className="space-y-3">
            {getStoredCases()
              .filter((c) => (c.accounts || []).some((a) => a.accountId === activeAccount.id || a.accountNumberMasked === activeAccount.accountNumberMasked))
              .map((c) => {
                const linkInfo = (c.accounts || []).find((a) => a.accountId === activeAccount.id || a.accountNumberMasked === activeAccount.accountNumberMasked);
                return (
                  <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-bold text-purple-400 text-sm">{c.caseNumber || c.id}</span>
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          Role: {linkInfo?.relationshipRole || 'Primary Account'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-200 mt-1">{c.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">{linkInfo?.reason || 'Linked investigation account record'}</p>
                    </div>

                    <div className="flex items-center space-x-3 text-xs">
                      <span className="text-slate-400">Status: <strong className="text-slate-200">{c.status}</strong></span>
                      <span className="text-slate-400">Priority: <strong className="text-amber-400">{c.priority}</strong></span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 13: EVIDENCE VAULT */}
      {activeTab === 'evidence' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Related Evidence Vault Items</span>
          </h3>

          <div className="space-y-3">
            {getStoredCases()
              .flatMap((c) => c.evidenceItems || [])
              .filter((ev) => (ev.relatedAccountIds || []).includes(activeAccount.id) || (ev.relatedAccountIds || []).includes(activeAccount.accountNumberMasked))
              .map((ev) => (
                <div key={ev.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-blue-400 text-xs">{ev.evidenceNumber || ev.id}</span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                        {ev.evidenceType}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200 mt-1">{ev.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{ev.description}</p>
                  </div>

                  <div className="text-right text-xs">
                    <span className="font-mono text-[10px] text-slate-500 block truncate max-w-xs">Hash: {ev.hash}</span>
                    <span className="text-slate-400 text-[11px]">Collected: {ev.collectedAt}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 14: INVESTIGATOR NOTES */}
      {activeTab === 'notes' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <StickyNote className="w-5 h-5 text-amber-400" />
              <span>Investigator Account Notes ({notesList.length})</span>
            </h3>

            <button
              onClick={() => setShowAddNoteModal(true)}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Note</span>
            </button>
          </div>

          <div className="space-y-3">
            {notesList.map((n) => (
              <div key={n.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold text-[10px]">
                    {n.type}
                  </span>
                  <span className="text-slate-400 text-[11px]">{n.createdBy} | {new Date(n.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-slate-200">{n.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 15: DATA LINEAGE & SOURCE ROW TRACEABILITY */}
      {activeTab === 'lineage' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6 shadow-xl">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <span>Complete Data Lineage & Provenance Flow</span>
          </h3>

          <div className="p-6 bg-slate-950 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-center">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">1. Bank Statement</span>
              <span className="text-xs font-mono font-bold text-slate-200">{activeAccount.statementIds[0] || 'STMT-00012'}</span>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">2. Normalized Records</span>
              <span className="text-xs font-bold text-emerald-400">{accountTransactions.length} Transactions</span>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">3. Account Entity</span>
              <span className="text-xs font-mono font-bold text-blue-400">{activeAccount.accountNumberMasked}</span>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-slate-500 shrink-0 hidden md:block" />
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 w-full md:w-auto">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">4. Pattern Engine</span>
              <span className="text-xs font-bold text-amber-400">{indicators.length} Indicators</span>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: SOURCE ROW INSPECTOR */}
      {showSourceRowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Database className="w-5 h-5 text-emerald-400" />
                <span>Original Bank Statement Source Record</span>
              </h3>
              <button onClick={() => setShowSourceRowModal(null)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono">
                <div>Source Statement: <strong className="text-slate-200">{showSourceRowModal.statementId}</strong></div>
                <div>Source Row Number: <strong className="text-slate-200">#{showSourceRowModal.sourceRowNumber || 1}</strong></div>
                <div>Dataset Version: <strong className="text-emerald-400">V04</strong></div>
                <div>Imported At: <strong className="text-slate-300">05 Aug 2026 22:15</strong></div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Raw Narration String:</span>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-200 break-all">
                  {showSourceRowModal.narration}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: UNMASKED ACCOUNT IDENTIFIER AUTHORIZATION */}
      {showUnmaskedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Unlock className="w-5 h-5 text-amber-400" />
                <span>Authorized Full Account Identifier</span>
              </h3>
              <button onClick={() => setShowUnmaskedModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center space-y-2">
                <span className="text-[10px] font-bold text-amber-400 uppercase block">Complete Account Number</span>
                <span className="text-2xl font-black font-mono text-slate-100 tracking-wider">
                  50100482199201
                </span>
                <p className="text-[11px] text-slate-400">
                  Bank: {activeAccount.bankName} | Branch: {activeAccount.branch || 'Satara Main'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
                Notice: Access logged under investigator credentials (PI V. R. Kadam) for legal compliance audit.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ACCOUNT TO CASE */}
      {showAddToCaseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-purple-400" />
                <span>Link Account to Investigation</span>
              </h3>
              <button onClick={() => setShowAddToCaseModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddToCaseSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Case:</label>
                <select
                  value={caseFormId}
                  onChange={(e) => setCaseFormId(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="">-- Choose Case --</option>
                  {getStoredCases().map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber || c.id} - {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Relationship Role:</label>
                <select
                  value={caseFormRole}
                  onChange={(e) => setCaseFormRole(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Primary Account">Primary Account</option>
                  <option value="Related Account">Related Account</option>
                  <option value="Counterparty">Counterparty</option>
                  <option value="Source">Source Account</option>
                  <option value="Destination">Destination Account</option>
                  <option value="Observed Intermediary">Observed Intermediary</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason / Note:</label>
                <textarea
                  value={caseFormReason}
                  onChange={(e) => setCaseFormReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for linking this account to the case..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddToCaseModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Link Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD INVESTIGATOR NOTE */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <StickyNote className="w-5 h-5 text-amber-400" />
                <span>Add Investigator Note</span>
              </h3>
              <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Note Type:</label>
                <select
                  value={noteFormType}
                  onChange={(e) => setNoteFormType(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Observation">Observation</option>
                  <option value="Question">Question</option>
                  <option value="Lead">Lead</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Analysis">Analysis</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Note Content:</label>
                <textarea
                  value={noteFormContent}
                  onChange={(e) => setNoteFormContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Record investigation note or lead details for this account..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddNoteModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: CLASSIFICATION AUDIT TRAIL */}
      {showClassificationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <Tag className="w-5 h-5 text-purple-400" />
                <span>Investigator Account Classification</span>
              </h3>
              <button onClick={() => setShowClassificationModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleClassificationSubmit} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Current Classification:</label>
                <select
                  value={newClassification}
                  onChange={(e) => setNewClassification(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  <option value="Unclassified">Unclassified</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Relevant">Relevant</option>
                  <option value="Not Relevant">Not Relevant</option>
                  <option value="Watch">Watch</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reason for Change:</label>
                <textarea
                  value={classificationReason}
                  onChange={(e) => setClassificationReason(e.target.value)}
                  rows={3}
                  placeholder="Specify why classification was changed..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowClassificationModal(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  Update Classification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ACCOUNT COMPARISON MODAL */}
      {showComparison && (
        <AccountComparisonModal
          initialAccountAId={activeAccount.id}
          transactions={transactions}
          statements={statements}
          onClose={() => setShowComparison(false)}
          onSelectAccount={(accId) => {
            setSelectedAccountId(accId);
            setShowComparison(false);
          }}
        />
      )}
    </div>
  );
};

// Internal Layout Dashboard Icon Helper
function LayoutDashboardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
