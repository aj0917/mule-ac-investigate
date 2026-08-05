'use client';

import React from 'react';
import {
  X,
  Users,
  Building2,
  ArrowRightLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ExternalLink,
  PlusCircle,
  MinusCircle,
  GitMerge,
  ShieldCheck,
} from 'lucide-react';
import { GraphNode } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface NodeDetailsDrawerProps {
  node: GraphNode;
  onClose: () => void;
  onOpenAccountIntelligence: (accId: string) => void;
  onTraceForward: (accId: string) => void;
  onTraceBackward: (accId: string) => void;
  onToggleExpand: (nodeId: string) => void;
}

export const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({
  node,
  onClose,
  onOpenAccountIntelligence,
  onTraceForward,
  onTraceBackward,
  onToggleExpand,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                {node.isRoot ? 'ROOT INVESTIGATION ACCOUNT' : 'GRAPH NODE DETAIL'}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-slate-800 text-slate-300">
                Hop {node.depth}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 font-mono mt-0.5">{node.label}</h3>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Bank / Entity</span>
          <span className="font-semibold text-slate-200 block truncate">{node.sublabel}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Transactions</span>
          <span className="font-mono font-bold text-slate-200 block">{node.txCount} Records</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Money Received</span>
          <span className="font-mono font-bold text-emerald-400 block">{formatCurrencyINR(node.totalMoneyIn, true)}</span>
        </div>

        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Money Sent</span>
          <span className="font-mono font-bold text-amber-400 block">{formatCurrencyINR(node.totalMoneyOut, true)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1 border-t border-slate-800">
        <button
          onClick={() => onOpenAccountIntelligence(node.id)}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-2"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Full Account Intelligence</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTraceForward(node.id)}
            className="py-2 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Trace Forward</span>
          </button>

          <button
            onClick={() => onTraceBackward(node.id)}
            className="py-2 px-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-purple-400 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-1"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>Trace Backward</span>
          </button>
        </div>

        <button
          onClick={() => onToggleExpand(node.id)}
          className="w-full py-2 px-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center space-x-2"
        >
          <GitMerge className="w-3.5 h-3.5 text-blue-400" />
          <span>{node.isExpanded ? 'Collapse Connections' : 'Expand Connections'}</span>
        </button>
      </div>
    </div>
  );
};
