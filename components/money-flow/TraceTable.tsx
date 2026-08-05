'use client';

import React from 'react';
import {
  ArrowRightLeft,
  FileSpreadsheet,
  Eye,
  Calendar,
  Layers,
  Search,
  ExternalLink,
} from 'lucide-react';
import { GraphEdge, Transaction, BankStatement } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface TraceTableProps {
  edges: GraphEdge[];
  statements: BankStatement[];
  selectedEdgeId?: string;
  onSelectEdge: (edge: GraphEdge) => void;
  onOpenTransactionDetail: (txn: Transaction) => void;
  onOpenAccountIntelligence: (accId: string) => void;
}

export const TraceTable: React.FC<TraceTableProps> = ({
  edges,
  statements,
  selectedEdgeId,
  onSelectEdge,
  onOpenTransactionDetail,
  onOpenAccountIntelligence,
}) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-3 p-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-100">Money Flow Trace Table</h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {edges.length} Relationships
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tabular record of observed node-to-node relationships synchronized with the graph
          </p>
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-x-auto bg-slate-950">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Date</th>
              <th className="py-2.5 px-3">Source (From)</th>
              <th className="py-2.5 px-3">Destination (To)</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3">Transactions</th>
              <th className="py-2.5 px-3">Channels</th>
              <th className="py-2.5 px-3">UTR Reference</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 text-slate-300">
            {edges.length > 0 ? (
              edges.map((edge) => {
                const isSelected = selectedEdgeId === edge.id;
                const mainTxn = edge.transactions[0];

                return (
                  <tr
                    key={edge.id}
                    onClick={() => onSelectEdge(edge)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-600/15 font-medium' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {edge.firstDate}
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAccountIntelligence(edge.source);
                        }}
                        className="text-blue-400 hover:underline font-semibold"
                      >
                        {edge.source}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 font-mono">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenAccountIntelligence(edge.target);
                        }}
                        className="text-slate-200 hover:text-blue-400 hover:underline font-semibold"
                      >
                        {edge.target}
                      </button>
                    </td>

                    <td className="py-2.5 px-3 font-mono font-bold text-emerald-400 text-xs">
                      {formatCurrencyINR(edge.amount, false)}
                    </td>

                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[10px]">
                        {edge.txCount} {edge.txCount === 1 ? 'Txn' : 'Txns'}
                      </span>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap gap-1">
                        {edge.channels.map((ch, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[9px]"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 truncate max-w-[140px]">
                      {edge.utrs.length > 0 ? edge.utrs[0] : mainTxn?.transactionId || 'N/A'}
                    </td>

                    <td className="py-2.5 px-3 text-right space-x-1 whitespace-nowrap">
                      {mainTxn && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTransactionDetail(mainTxn);
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded text-[10px] font-bold transition-colors"
                        >
                          Inspect Txn
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-xs text-slate-500">
                  No relationship edges found for current graph filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
