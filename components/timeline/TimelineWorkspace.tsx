'use client';

import React, { useState, useMemo } from 'react';
import {
  Clock,
  Calendar,
  Filter,
  Download,
  Save,
  Layers,
  Search,
  Users,
  GitMerge,
  Grid,
  Zap,
  ArrowLeftRight,
  TrendingUp,
  ShieldAlert,
  Info,
  CheckCircle2,
  PlusCircle,
  FileText,
  Tag,
  Share2,
  Sparkles,
} from 'lucide-react';
import { Transaction, BankStatement, PatternIndicator } from '@/types/investigation';
import { InvestigationCase } from '@/types/case';
import {
  TimelineEvent,
  TimelineViewTab,
  TimelineZoomLevel,
  TimelineFilterState,
  TimelineAnnotation,
  SavedTimelineView,
} from '@/types/timeline';
import {
  buildUnifiedTimelineEvents,
  calculateDataQualityMetrics,
} from '@/lib/timelineAnalytics';
import {
  getStoredTimelineAnnotations,
  saveTimelineAnnotation,
  getStoredSavedViews,
  saveTimelineViewPreset,
} from '@/lib/timelineStorage';

import { TimelineOverviewTab } from './TimelineOverviewTab';
import { TransactionTimelineTab } from './TransactionTimelineTab';
import { AccountActivityTab } from './AccountActivityTab';
import { MoneyFlowPlaybackTab } from './MoneyFlowPlaybackTab';
import { ActivityHeatmapTab } from './ActivityHeatmapTab';
import { VelocityAnalysisTab } from './VelocityAnalysisTab';
import { BeforeAfterAnalysisTab } from './BeforeAfterAnalysisTab';
import { ComparativeAnalysisTab } from './ComparativeAnalysisTab';
import { TemporalIndicatorsTab } from './TemporalIndicatorsTab';
import { EventDetailModal } from './EventDetailModal';
import { AddAnnotationModal } from './AddAnnotationModal';

interface TimelineWorkspaceProps {
  statements: BankStatement[];
  transactions: Transaction[];
  indicators: PatternIndicator[];
  cases: InvestigationCase[];
  activeCase?: InvestigationCase | null;
  selectedAccount?: string;
  onSelectTransaction?: (txnId: string) => void;
  onOpenAccountIntelligence?: (accId: string) => void;
  onOpenPatternEngine?: () => void;
  onAddEvidenceToCase?: (caseId: string, event: TimelineEvent) => void;
}

export const TimelineWorkspace: React.FC<TimelineWorkspaceProps> = ({
  statements,
  transactions,
  indicators,
  cases,
  activeCase,
  selectedAccount,
  onSelectTransaction,
  onOpenAccountIntelligence,
  onOpenPatternEngine,
  onAddEvidenceToCase,
}) => {
  // Navigation active sub-tab
  const [activeTab, setActiveTab] = useState<TimelineViewTab>('OVERVIEW');
  const [zoomLevel, setZoomLevel] = useState<TimelineZoomLevel>('DAY');

  // Filter state
  const [filterState, setFilterState] = useState<TimelineFilterState>({
    caseId: activeCase?.id || 'ALL',
    accountId: selectedAccount || 'ALL',
    startDate: '',
    endDate: '',
    channel: 'ALL',
    category: 'ALL',
    minAmount: undefined,
    maxAmount: undefined,
    searchQuery: '',
  });

  // Saved presets & Annotations state
  const [savedViews, setSavedViews] = useState<SavedTimelineView[]>(getStoredSavedViews());
  const [annotations, setAnnotations] = useState<TimelineAnnotation[]>(getStoredTimelineAnnotations());
  const [selectedPreset, setSelectedPreset] = useState<string>('DEFAULT');

  // Modals state
  const [inspectEvent, setInspectEvent] = useState<TimelineEvent | null>(null);
  const [annotateEvent, setAnnotateEvent] = useState<TimelineEvent | null>(null);

  // Extract all unique accounts across dataset
  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => {
      if (t.accountNumber) set.add(t.accountNumber);
      if (t.senderAccount) set.add(t.senderAccount);
      if (t.receiverAccount) set.add(t.receiverAccount);
    });
    return Array.from(set).sort();
  }, [transactions]);

  // Compile unified timeline events
  const rawEvents = useMemo(() => {
    return buildUnifiedTimelineEvents({
      transactions,
      indicators,
      cases,
      statements,
      annotations,
    });
  }, [transactions, indicators, cases, statements, annotations]);

  // Apply filters to timeline events
  const filteredEvents = useMemo(() => {
    return rawEvents.filter((e) => {
      if (filterState.caseId !== 'ALL' && e.caseId && e.caseId !== filterState.caseId) return false;
      if (filterState.accountId !== 'ALL') {
        const matchesAcc =
          e.accountId === filterState.accountId ||
          e.counterpartyId === filterState.accountId ||
          e.rawTxn?.senderAccount === filterState.accountId ||
          e.rawTxn?.receiverAccount === filterState.accountId;
        if (!matchesAcc) return false;
      }
      if (filterState.startDate && e.date < filterState.startDate) return false;
      if (filterState.endDate && e.date > filterState.endDate) return false;
      if (filterState.channel !== 'ALL' && e.channel !== filterState.channel) return false;
      if (filterState.category !== 'ALL' && e.category !== filterState.category) return false;
      if (filterState.minAmount !== undefined && e.amount !== undefined && e.amount < filterState.minAmount) return false;
      if (filterState.maxAmount !== undefined && e.amount !== undefined && e.amount > filterState.maxAmount) return false;
      if (filterState.searchQuery.trim()) {
        const q = filterState.searchQuery.toLowerCase();
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchDesc = e.description.toLowerCase().includes(q);
        const matchAcc = (e.accountId || '').toLowerCase().includes(q) || (e.counterpartyId || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchAcc) return false;
      }
      return true;
    });
  }, [rawEvents, filterState]);

  // Data quality metrics
  const qualityMetrics = useMemo(() => {
    return calculateDataQualityMetrics(filteredEvents);
  }, [filteredEvents]);

  // Handle Preset View Selection
  const handleSelectPreset = (presetId: string) => {
    setSelectedPreset(presetId);
    if (presetId === 'DEFAULT') {
      setFilterState({
        caseId: activeCase?.id || 'ALL',
        accountId: 'ALL',
        startDate: '',
        endDate: '',
        channel: 'ALL',
        category: 'ALL',
        searchQuery: '',
      });
      setActiveTab('OVERVIEW');
    } else if (presetId === 'MULE_BURST') {
      setFilterState((prev) => ({ ...prev, category: 'SOURCE', minAmount: 100000 }));
      setActiveTab('VELOCITY');
    } else if (presetId === 'INDICATORS_ONLY') {
      setFilterState((prev) => ({ ...prev, category: 'DERIVED' }));
      setActiveTab('INDICATORS');
    } else if (presetId === 'HEATMAP_NIGHT') {
      setActiveTab('HEATMAP');
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    const headers = ['Event ID', 'Date', 'Time', 'Category', 'Type', 'Title', 'Amount', 'Channel', 'Source', 'Description'];
    const rows = filteredEvents.map((e) => [
      e.id,
      e.date,
      e.timeFormatted,
      e.category,
      e.eventType,
      `"${e.title.replace(/"/g, '""')}"`,
      e.amount || 0,
      e.channel || '',
      e.sourceLabel,
      `"${e.description.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Satara_Cyber_Timeline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredEvents, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Satara_Cyber_Timeline_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSaveAnnotation = (newAnn: Omit<TimelineAnnotation, 'id' | 'createdAt'>) => {
    const created = saveTimelineAnnotation(newAnn);
    setAnnotations((prev) => [created, ...prev]);
  };

  return (
    <div className="space-y-6">
      {/* Module Title Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-800 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
              STEP 7 • UNIFIED CHRONOLOGY ENGINE
            </span>
            <span className="text-xs text-slate-500 font-mono">
              Satara Police Cyber Investigation Division
            </span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
            <Clock className="w-6 h-6 text-blue-400" />
            <span>Unified Investigation Timeline & Chronological Analytics</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono max-w-3xl">
            Synthesizes bank statements, transactions, money flow graphs, pattern engine alerts, evidence, and investigator notes into a single chronological timeline.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAnnotateEvent(filteredEvents[0] || null)}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors shadow-sm"
          >
            <Tag className="w-4 h-4 text-amber-400" />
            <span>Annotate Event</span>
          </button>

          <div className="relative group">
            <button className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-sm">
              <Download className="w-4 h-4" />
              <span>Export Timeline</span>
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-1 z-30 hidden group-hover:block space-y-1">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-mono"
              >
                Export CSV Format
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 rounded-lg transition-colors font-mono"
              >
                Export JSON Format
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Deck Controls */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Multi-Dimensional Chronological Filters
            </h3>
          </div>

          {/* View Presets Selector */}
          <div className="flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-semibold text-slate-400">View Presets:</span>
            <select
              value={selectedPreset}
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="DEFAULT">Full Case Unified Timeline</option>
              <option value="MULE_BURST">High-Volume Layering & Velocity</option>
              <option value="INDICATORS_ONLY">Pattern Indicators Only</option>
              <option value="HEATMAP_NIGHT">Night-Time Activity Matrix</option>
            </select>
          </div>
        </div>

        {/* Filter Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Search Query */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Search Text / Keyword
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={filterState.searchQuery}
                onChange={(e) => setFilterState({ ...filterState, searchQuery: e.target.value })}
                placeholder="Search events..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Case Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Case Scope
            </label>
            <select
              value={filterState.caseId}
              onChange={(e) => setFilterState({ ...filterState, caseId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">All Active Cases ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.slice(0, 20)}
                </option>
              ))}
            </select>
          </div>

          {/* Account Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Account Entity
            </label>
            <select
              value={filterState.accountId}
              onChange={(e) => setFilterState({ ...filterState, accountId: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">All Accounts ({allAccounts.length})</option>
              {allAccounts.map((acc) => (
                <option key={acc} value={acc}>
                  {acc}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={filterState.startDate}
              onChange={(e) => setFilterState({ ...filterState, startDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              End Date
            </label>
            <input
              type="date"
              value={filterState.endDate}
              onChange={(e) => setFilterState({ ...filterState, endDate: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>

          {/* Channel */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Payment Channel
            </label>
            <select
              value={filterState.channel}
              onChange={(e) => setFilterState({ ...filterState, channel: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            >
              <option value="ALL">All Channels</option>
              <option value="UPI">UPI</option>
              <option value="IMPS">IMPS</option>
              <option value="NEFT">NEFT</option>
              <option value="RTGS">RTGS</option>
              <option value="ATM">ATM</option>
              <option value="CASH">CASH</option>
            </select>
          </div>
        </div>
      </div>

      {/* Secondary Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto border-b border-slate-800 pb-2 scrollbar-thin">
        {[
          { id: 'OVERVIEW', label: 'Timeline Overview', icon: Layers },
          { id: 'TRANSACTIONS', label: 'Sequence List', icon: ArrowLeftRight },
          { id: 'ACCOUNT_SWIMLANE', label: 'Multi-Account Swimlane', icon: Users },
          { id: 'MONEY_FLOW', label: 'Money Flow Playback', icon: GitMerge },
          { id: 'HEATMAP', label: 'Activity Heatmap', icon: Grid },
          { id: 'VELOCITY', label: 'Velocity Analysis', icon: Zap },
          { id: 'BEFORE_AFTER', label: 'Context Analysis', icon: Clock },
          { id: 'COMPARISON', label: 'Period Comparison', icon: TrendingUp },
          { id: 'INDICATORS', label: 'Pattern Indicators', icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TimelineViewTab)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Render Active View Tab */}
      <div className="pt-2">
        {activeTab === 'OVERVIEW' && (
          <TimelineOverviewTab
            events={filteredEvents}
            qualityMetrics={qualityMetrics}
            zoomLevel={zoomLevel}
            onZoomChange={setZoomLevel}
            onSelectEvent={setInspectEvent}
            selectedAccount={selectedAccount}
          />
        )}

        {activeTab === 'TRANSACTIONS' && (
          <TransactionTimelineTab
            transactions={transactions}
            onSelectTransaction={(t) => {
              if (onSelectTransaction) onSelectTransaction(t.id);
            }}
            onOpenAccountIntelligence={onOpenAccountIntelligence}
          />
        )}

        {activeTab === 'ACCOUNT_SWIMLANE' && (
          <AccountActivityTab
            events={filteredEvents}
            transactions={transactions}
            allAccounts={allAccounts}
            selectedAccount={selectedAccount}
            onSelectEvent={setInspectEvent}
            onOpenAccountIntelligence={onOpenAccountIntelligence}
          />
        )}

        {activeTab === 'MONEY_FLOW' && (
          <MoneyFlowPlaybackTab
            events={filteredEvents}
            transactions={transactions}
            onSelectEvent={setInspectEvent}
            onOpenAccountIntelligence={onOpenAccountIntelligence}
          />
        )}

        {activeTab === 'HEATMAP' && (
          <ActivityHeatmapTab events={filteredEvents} />
        )}

        {activeTab === 'VELOCITY' && (
          <VelocityAnalysisTab
            transactions={transactions}
            selectedAccountId={filterState.accountId !== 'ALL' ? filterState.accountId : undefined}
          />
        )}

        {activeTab === 'BEFORE_AFTER' && (
          <BeforeAfterAnalysisTab
            events={filteredEvents}
            onSelectEvent={setInspectEvent}
          />
        )}

        {activeTab === 'COMPARISON' && (
          <ComparativeAnalysisTab events={filteredEvents} />
        )}

        {activeTab === 'INDICATORS' && (
          <TemporalIndicatorsTab
            indicators={indicators}
            events={filteredEvents}
            onSelectEvent={setInspectEvent}
            onOpenPatternEngine={onOpenPatternEngine}
          />
        )}
      </div>

      {/* Modals */}
      <EventDetailModal
        isOpen={!!inspectEvent}
        onClose={() => setInspectEvent(null)}
        event={inspectEvent}
        onOpenTransaction={onSelectTransaction}
        onShowOnGraph={onOpenAccountIntelligence}
        onAddToCase={
          onAddEvidenceToCase && activeCase
            ? (evt) => onAddEvidenceToCase(activeCase.id, evt)
            : undefined
        }
        onAddAnnotation={(evt) => setAnnotateEvent(evt)}
      />

      <AddAnnotationModal
        isOpen={!!annotateEvent}
        onClose={() => setAnnotateEvent(null)}
        event={annotateEvent}
        onSaveAnnotation={handleSaveAnnotation}
        activeCaseId={activeCase?.id}
      />
    </div>
  );
};
