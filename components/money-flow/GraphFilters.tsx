'use client';

import React from 'react';
import {
  Filter,
  X,
  Calendar,
  DollarSign,
  ArrowRightLeft,
  Building2,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { TraceDirection, GraphLayoutType } from '@/types/investigation';

interface GraphFiltersProps {
  direction: TraceDirection;
  maxDepth: number;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
  channelFilter: string;
  bankFilter: string;
  layout: GraphLayoutType;
  availableBanks: string[];
  onUpdateFilters: (updates: Partial<{
    direction: TraceDirection;
    maxDepth: number;
    dateFrom: string;
    dateTo: string;
    minAmount: string;
    maxAmount: string;
    channelFilter: string;
    bankFilter: string;
    layout: GraphLayoutType;
  }>) => void;
  onResetFilters: () => void;
  onClose: () => void;
}

export const GraphFilters: React.FC<GraphFiltersProps> = ({
  direction,
  maxDepth,
  dateFrom,
  dateTo,
  minAmount,
  maxAmount,
  channelFilter,
  bankFilter,
  layout,
  availableBanks,
  onUpdateFilters,
  onResetFilters,
  onClose,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6 max-w-lg w-full">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-bold text-slate-100">Graph Investigation Filters</h3>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4 text-xs">
        {/* Hop Depth Selector */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Traversal Hop Depth (Layers)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 5, 10].map((depth) => (
              <button
                key={depth}
                onClick={() => onUpdateFilters({ maxDepth: depth })}
                className={`py-2 rounded-lg font-bold text-xs border transition-colors ${
                  maxDepth === depth
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {depth} {depth === 1 ? 'Hop' : 'Hops'}
              </button>
            ))}
          </div>
        </div>

        {/* Direction Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Money Traversal Direction
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['BOTH', 'FORWARD', 'BACKWARD'] as const).map((dir) => (
              <button
                key={dir}
                onClick={() => onUpdateFilters({ direction: dir })}
                className={`py-2 rounded-lg font-bold text-xs border transition-colors ${
                  direction === dir
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {dir === 'BOTH' ? 'Both Ways' : dir === 'FORWARD' ? 'Forward (Out)' : 'Backward (In)'}
              </button>
            ))}
          </div>
        </div>

        {/* Date Range */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Date Range Filter
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">From Date</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => onUpdateFilters({ dateFrom: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block mb-0.5">To Date</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => onUpdateFilters({ dateTo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Amount Range Filter */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Transaction Amount Threshold (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min Amount (e.g. 10000)"
              value={minAmount}
              onChange={(e) => onUpdateFilters({ minAmount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
            <input
              type="number"
              placeholder="Max Amount (e.g. 1000000)"
              value={maxAmount}
              onChange={(e) => onUpdateFilters({ maxAmount: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
            />
          </div>
        </div>

        {/* Payment Channel */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Payment Channel
          </label>
          <select
            value={channelFilter}
            onChange={(e) => onUpdateFilters({ channelFilter: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Payment Channels</option>
            <option value="UPI">UPI Only</option>
            <option value="IMPS">IMPS Transfers</option>
            <option value="NEFT">NEFT Transfers</option>
            <option value="RTGS">RTGS High-Value</option>
            <option value="ATM">ATM / Cash Withdrawals</option>
            <option value="CHEQUE">Cheque</option>
            <option value="CARD">Card Transactions</option>
          </select>
        </div>

        {/* Bank Selection */}
        <div className="space-y-1.5">
          <label className="text-slate-300 font-bold uppercase text-[10px] tracking-wider block">
            Filter by Bank
          </label>
          <select
            value={bankFilter}
            onChange={(e) => onUpdateFilters({ bankFilter: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Observed Banks</option>
            {availableBanks.map((b, idx) => (
              <option key={idx} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
        <button
          onClick={onResetFilters}
          className="text-xs text-slate-400 hover:text-slate-200 font-semibold flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset All Filters</span>
        </button>

        <button
          onClick={onClose}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
        >
          Apply & Close
        </button>
      </div>
    </div>
  );
};
