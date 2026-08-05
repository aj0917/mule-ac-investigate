'use client';

import React, { useState, useMemo } from 'react';
import {
  GitMerge,
  Search,
  Filter,
  Users,
  ArrowRightLeft,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import {
  Transaction,
  BankStatement,
  GraphNode,
  GraphEdge,
  TraceDirection,
  GraphLayoutType,
  MoneyTrailHop,
} from '@/types/investigation';
import {
  buildMoneyFlowGraph,
  getMoneyTrailSummary,
  getAccountEntities,
} from '@/lib/intelligence';
import { formatCurrencyINR } from '@/lib/storage';

import { GraphCanvas } from './GraphCanvas';
import { GraphToolbar } from './GraphToolbar';
import { MoneyTrailPanel } from './MoneyTrailPanel';
import { TraceTable } from './TraceTable';
import { EdgeDetailsModal } from './EdgeDetailsModal';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';
import { GraphFilters } from './GraphFilters';
import { GraphLegend } from './GraphLegend';
import { GraphDataQualityCallout } from './GraphDataQualityCallout';
import { TransactionDetailModal } from '../transactions/TransactionDetailModal';

interface MoneyFlowWorkspaceProps {
  initialRootQuery?: string;
  transactions: Transaction[];
  statements: BankStatement[];
  onOpenAccountIntelligence: (accId: string) => void;
  onOpenUpload?: () => void;
}

export const MoneyFlowWorkspace: React.FC<MoneyFlowWorkspaceProps> = ({
  initialRootQuery = '',
  transactions,
  statements,
  onOpenAccountIntelligence,
  onOpenUpload,
}) => {
  // Graph State
  const [rootQuery, setRootQuery] = useState<string>(initialRootQuery);
  const [direction, setDirection] = useState<TraceDirection>('BOTH');
  const [maxDepth, setMaxDepth] = useState<number>(3);
  const [layout, setLayout] = useState<GraphLayoutType>('FLOW');

  // Filter Drawer State
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [minAmount, setMinAmount] = useState<string>('');
  const [maxAmount, setMaxAmount] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [bankFilter, setBankFilter] = useState<string>('ALL');

  // Selected Inspections
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);
  const [selectedHopIndex, setSelectedHopIndex] = useState<number | undefined>(undefined);
  const [inspectTxn, setInspectTxn] = useState<Transaction | null>(null);

  // Available Banks list for filters
  const allAccounts = getAccountEntities(transactions, statements);
  const availableBanks = useMemo(() => {
    const set = new Set<string>();
    statements.forEach((s) => s.bankName && set.add(s.bankName));
    transactions.forEach((t) => t.bankName && set.add(t.bankName));
    return Array.from(set);
  }, [statements, transactions]);

  // Compute Graph Data
  const graphData = useMemo(() => {
    return buildMoneyFlowGraph(transactions, statements, {
      rootQuery,
      direction,
      maxDepth,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      minAmount: minAmount ? parseFloat(minAmount) : undefined,
      maxAmount: maxAmount ? parseFloat(maxAmount) : undefined,
      channelFilter,
      bankFilter,
      layout,
    });
  }, [
    transactions,
    statements,
    rootQuery,
    direction,
    maxDepth,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    channelFilter,
    bankFilter,
    layout,
  ]);

  // Multi-hop Trail Summary
  const moneyTrailSummary = useMemo(() => {
    return getMoneyTrailSummary(
      graphData.edges,
      graphData.nodes,
      graphData.rootNodeId,
      selectedNode ? selectedNode.id : undefined,
      graphData.cycles
    );
  }, [graphData, selectedNode]);

  // Active highlighted edges along multi-hop trail
  const highlightedEdgeIds = useMemo(() => {
    return graphData.edges
      .filter((e) => {
        if (!selectedHopIndex) return true;
        return moneyTrailSummary.hops.some(
          (h) => h.hopIndex === selectedHopIndex && h.fromNodeId === e.source && h.toNodeId === e.target
        );
      })
      .map((e) => e.id);
  }, [graphData.edges, selectedHopIndex, moneyTrailSummary]);

  // Count active filters
  const activeFilterCount =
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0) +
    (channelFilter !== 'ALL' ? 1 : 0) +
    (bankFilter !== 'ALL' ? 1 : 0);

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
    setChannelFilter('ALL');
    setBankFilter('ALL');
    setDirection('BOTH');
    setMaxDepth(3);
    setLayout('FLOW');
  };

  const handleSelectHop = (hop: MoneyTrailHop) => {
    setSelectedHopIndex(hop.hopIndex);
    const edge = graphData.edges.find((e) => e.source === hop.fromNodeId && e.target === hop.toNodeId);
    if (edge) setSelectedEdge(edge);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Investigation Context Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <GitMerge className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  STEP 4 MONEY FLOW GRAPH
                </span>
                <span className="text-xs text-slate-400">Multi-Hop Money Trail Engine</span>
              </div>
              <h2 className="text-xl font-bold text-slate-100">Cyber Money Flow Investigation Graph</h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenUpload}
              className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-2 shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Statements</span>
            </button>
          </div>
        </div>

        {/* Context Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
          <div>
            <span className="block text-[10px] uppercase text-slate-500">Root Account</span>
            <span className="font-mono font-bold text-blue-400 block truncate">
              {graphData.rootNodeId || 'Select Root'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Hop Depth</span>
            <span className="font-bold text-slate-200 block">{maxDepth} Layers</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Nodes (Accounts)</span>
            <span className="font-mono font-bold text-slate-200 block">{graphData.nodes.length} Connected</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Edges (Flow Paths)</span>
            <span className="font-mono font-bold text-emerald-400 block">{graphData.edges.length} Active</span>
          </div>

          <div>
            <span className="block text-[10px] uppercase text-slate-500">Cycle Status</span>
            <span className={`font-bold block ${graphData.cycles.length > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
              {graphData.cycles.length > 0 ? `${graphData.cycles.length} Cycle Detected` : 'Linear Network'}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <GraphToolbar
          rootQuery={rootQuery}
          direction={direction}
          maxDepth={maxDepth}
          layout={layout}
          activeFilterCount={activeFilterCount}
          onSearch={(q) => setRootQuery(q)}
          onChangeDirection={(dir) => setDirection(dir)}
          onChangeDepth={(d) => setMaxDepth(d)}
          onChangeLayout={(l) => setLayout(l)}
          onResetGraph={() => {
            setRootQuery('');
            handleResetFilters();
            setSelectedNode(null);
            setSelectedEdge(null);
            setSelectedHopIndex(undefined);
          }}
          onOpenFilters={() => setIsFilterOpen(true)}
        />
      </div>

      {/* Data Quality Banner */}
      <GraphDataQualityCallout quality={graphData.quality} />

      {/* Main Graph Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Interactive Graph Canvas (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <GraphCanvas
              nodes={graphData.nodes}
              edges={graphData.edges}
              rootNodeId={graphData.rootNodeId}
              layout={layout}
              selectedNodeId={selectedNode?.id}
              selectedEdgeId={selectedEdge?.id}
              highlightedEdgeIds={highlightedEdgeIds}
              onSelectNode={(node) => setSelectedNode(node)}
              onSelectEdge={(edge) => setSelectedEdge(edge)}
              onDoubleCLickNode={(node) => setRootQuery(node.id)}
            />

            {/* Floating Legend */}
            <div className="absolute bottom-4 left-4 z-10">
              <GraphLegend />
            </div>
          </div>

          {/* Selected Node Details Drawer (below or inline) */}
          {selectedNode && (
            <NodeDetailsDrawer
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onOpenAccountIntelligence={onOpenAccountIntelligence}
              onTraceForward={(accId) => {
                setRootQuery(accId);
                setDirection('FORWARD');
              }}
              onTraceBackward={(accId) => {
                setRootQuery(accId);
                setDirection('BACKWARD');
              }}
              onToggleExpand={(nodeId) => {
                setMaxDepth((prev) => (prev < 5 ? prev + 1 : prev));
              }}
            />
          )}
        </div>

        {/* Right Column: Multi-Hop Money Trail Panel (1 col) */}
        <div className="lg:col-span-1">
          <MoneyTrailPanel
            summary={moneyTrailSummary}
            selectedHopIndex={selectedHopIndex}
            onSelectHop={handleSelectHop}
            onSelectNode={(nodeId) => setRootQuery(nodeId)}
          />
        </div>
      </div>

      {/* Synchronized Trace Table */}
      <TraceTable
        edges={graphData.edges}
        statements={statements}
        selectedEdgeId={selectedEdge?.id}
        onSelectEdge={(edge) => setSelectedEdge(edge)}
        onOpenTransactionDetail={(txn) => setInspectTxn(txn)}
        onOpenAccountIntelligence={onOpenAccountIntelligence}
      />

      {/* Modals */}
      {selectedEdge && (
        <EdgeDetailsModal
          edge={selectedEdge}
          statements={statements}
          onClose={() => setSelectedEdge(null)}
          onOpenTransactionDetail={(txn) => setInspectTxn(txn)}
          onOpenAccountIntelligence={onOpenAccountIntelligence}
        />
      )}

      {inspectTxn && (
        <TransactionDetailModal
          transaction={inspectTxn}
          allTransactions={transactions}
          statements={statements}
          onClose={() => setInspectTxn(null)}
          onSelectAccount={onOpenAccountIntelligence}
          onSelectTransaction={(t) => setInspectTxn(t)}
        />
      )}

      {/* Filter Modal */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <GraphFilters
            direction={direction}
            maxDepth={maxDepth}
            dateFrom={dateFrom}
            dateTo={dateTo}
            minAmount={minAmount}
            maxAmount={maxAmount}
            channelFilter={channelFilter}
            bankFilter={bankFilter}
            layout={layout}
            availableBanks={availableBanks}
            onUpdateFilters={(updates) => {
              if (updates.direction) setDirection(updates.direction);
              if (updates.maxDepth) setMaxDepth(updates.maxDepth);
              if (updates.dateFrom !== undefined) setDateFrom(updates.dateFrom);
              if (updates.dateTo !== undefined) setDateTo(updates.dateTo);
              if (updates.minAmount !== undefined) setMinAmount(updates.minAmount);
              if (updates.maxAmount !== undefined) setMaxAmount(updates.maxAmount);
              if (updates.channelFilter) setChannelFilter(updates.channelFilter);
              if (updates.bankFilter) setBankFilter(updates.bankFilter);
              if (updates.layout) setLayout(updates.layout);
            }}
            onResetFilters={handleResetFilters}
            onClose={() => setIsFilterOpen(false)}
          />
        </div>
      )}
    </div>
  );
};
