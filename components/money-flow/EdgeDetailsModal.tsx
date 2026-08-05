'use client';

import React from 'react';
import {
  X,
  ArrowRightLeft,
  Calendar,
  Building2,
  DollarSign,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Send,
  Layers,
} from 'lucide-react';
import { GraphEdge, Transaction, BankStatement } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface EdgeDetailsModalProps {
  edge: GraphEdge;
  statements: BankStatement[];
  onClose: () => void;
  onOpenTransactionDetail: (txn: Transaction) => void;
  onOpenAccountIntelligence: (accId: string) => void;
}

export const EdgeDetailsModal: React.FC<EdgeDetailsModalProps> = ({
  edge,
  statements,
  onClose,
  onOpenTransactionDetail,
  onOpenAccountIntelligence,
}) => {
  const mainTxn = edge.transactions[0];
  const sourceStmt = mainTxn ? statements.find((s) => s.id === mainTxn.statementId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Transaction Relationship Detail
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-800 text-slate-300">
                  {edge.txCount} {edge.txCount === 1 ? 'Transaction' : 'Transactions'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">
                {edge.source} → {edge.target}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Hero Amount Banner */}
          <div className="bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                Total Observed Transferred Amount
              </span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                {formatCurrencyINR(edge.amount, false)}
              </span>
            </div>

            <div className="text-right text-xs text-slate-400 space-y-1">
              <div>
                <span className="text-slate-500">First Date:</span>{' '}
                <strong className="text-slate-200 font-mono">{edge.firstDate}</strong>
              </div>
              <div>
                <span className="text-slate-500">Last Date:</span>{' '}
                <strong className="text-slate-200 font-mono">{edge.lastDate}</strong>
              </div>
            </div>
          </div>

          {/* Flow Entities Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Sender / From */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">From (Source)</span>
              <span className="font-mono text-sm font-bold text-slate-100 block truncate">{edge.source}</span>
              <button
                onClick={() => onOpenAccountIntelligence(edge.source)}
                className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View Account Intelligence</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Receiver / To */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">To (Destination)</span>
              <span className="font-mono text-sm font-bold text-slate-100 block truncate">{edge.target}</span>
              <button
                onClick={() => onOpenAccountIntelligence(edge.target)}
                className="text-xs text-blue-400 hover:underline font-semibold flex items-center space-x-1"
              >
                <span>View Account Intelligence</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Payment Channels & References */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Metadata</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase">Payment Channels</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {edge.channels.map((ch, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 font-bold text-[10px]"
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase">UTR References</span>
                <span className="font-mono text-slate-200 font-semibold block mt-1 truncate">
                  {edge.utrs.length > 0 ? edge.utrs.join(', ') : 'Not Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Individual Underlying Transactions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Underlying Transactions ({edge.transactions.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Backed by imported statement data</span>
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto text-xs">
                {edge.transactions.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-slate-900/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5 max-w-[320px]">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400 text-[11px]">{t.transactionDate}</span>
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-bold text-[9px]">
                          {t.channel}
                        </span>
                        {t.utr && <span className="font-mono text-blue-400 text-[10px]">{t.utr}</span>}
                      </div>
                      <p className="text-slate-300 truncate text-[11px]">{t.narration}</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-100 text-sm">
                        {formatCurrencyINR(Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount)), false)}
                      </span>
                      <button
                        onClick={() => onOpenTransactionDetail(t)}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-bold text-[10px] transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Source File Traceability Footer */}
          {sourceStmt && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-4 h-4 text-blue-400" />
                <span>
                  Source: <strong className="text-slate-200">{sourceStmt.fileName}</strong> ({sourceStmt.bankName})
                </span>
              </div>
              <span className="font-mono text-slate-500 text-[10px]">Sheet: {mainTxn?.sourceSheet || 'Sheet1'}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Close Relationship
          </button>
        </div>
      </div>
    </div>
  );
};
