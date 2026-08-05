'use client';

import React from 'react';
import {
  X,
  Clock,
  ArrowRightLeft,
  Shield,
  FileText,
  AlertTriangle,
  User,
  GitMerge,
  Briefcase,
  PlusCircle,
  ExternalLink,
  Tag,
  Calendar,
} from 'lucide-react';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';

interface EventDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  onOpenTransaction?: (txnId: string) => void;
  onShowOnGraph?: (accId: string) => void;
  onAddToCase?: (event: TimelineEvent) => void;
  onAddAnnotation?: (event: TimelineEvent) => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  isOpen,
  onClose,
  event,
  onOpenTransaction,
  onShowOnGraph,
  onAddToCase,
  onAddAnnotation,
}) => {
  if (!isOpen || !event) return null;

  const isSource = event.category === 'SOURCE';
  const isDerived = event.category === 'DERIVED';
  const isInvestigator = event.category === 'INVESTIGATOR';
  const isSystem = event.category === 'SYSTEM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                isSource
                  ? 'bg-blue-950/50 border-blue-500/40 text-blue-400'
                  : isDerived
                  ? 'bg-purple-950/50 border-purple-500/40 text-purple-400'
                  : isInvestigator
                  ? 'bg-amber-950/50 border-amber-500/40 text-amber-400'
                  : 'bg-emerald-950/50 border-emerald-500/40 text-emerald-400'
              }`}
            >
              {isSource && <ArrowRightLeft className="w-5 h-5" />}
              {isDerived && <Shield className="w-5 h-5" />}
              {isInvestigator && <FileText className="w-5 h-5" />}
              {isSystem && <Briefcase className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                    isSource
                      ? 'bg-blue-950 border-blue-800 text-blue-400'
                      : isDerived
                      ? 'bg-purple-950 border-purple-800 text-purple-400'
                      : isInvestigator
                      ? 'bg-amber-950 border-amber-800 text-amber-400'
                      : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                  }`}
                >
                  {event.category} EVENT
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{event.eventType}</span>
              </div>
              <h3 className="text-base font-bold text-slate-100 truncate mt-0.5">{event.title}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-xs text-slate-300">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">Date</span>
              <div className="flex items-center space-x-1.5 mt-1 font-mono text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>{event.date}</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">Time</span>
              <div className="flex items-center space-x-1.5 mt-1 font-mono text-slate-200">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>{event.timeFormatted}</span>
                {event.timeAccuracy === 'DATE_ONLY' && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-400 border border-amber-800">
                    Date Only
                  </span>
                )}
              </div>
            </div>

            {event.amount !== undefined && (
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">Amount</span>
                <span
                  className={`text-sm font-bold font-mono mt-0.5 block ${
                    event.direction === 'IN' ? 'text-emerald-400' : event.direction === 'OUT' ? 'text-rose-400' : 'text-slate-200'
                  }`}
                >
                  {event.direction === 'IN' ? '+' : event.direction === 'OUT' ? '-' : ''}
                  {formatCurrencyINR(event.amount, false)}
                </span>
              </div>
            )}

            {event.channel && (
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">Channel</span>
                <span className="font-mono text-slate-200 mt-1 block font-semibold">{event.channel}</span>
              </div>
            )}

            {event.accountId && (
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">From / Account</span>
                <span className="font-mono text-slate-200 mt-1 block truncate">{event.accountId}</span>
              </div>
            )}

            {event.counterpartyId && (
              <div>
                <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">To / Counterparty</span>
                <span className="font-mono text-slate-200 mt-1 block truncate">{event.counterpartyName || event.counterpartyId}</span>
              </div>
            )}

            <div className="col-span-2">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">Data Source</span>
              <span className="text-slate-300 mt-1 block font-mono bg-slate-900 px-2 py-1 rounded border border-slate-800 w-fit">
                {event.sourceLabel}
              </span>
            </div>
          </div>

          {/* Detailed Narrative */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Event Details & Narration</h4>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] leading-relaxed text-slate-300 break-words">
              {event.description}
            </div>
          </div>

          {/* Raw Transaction Extra Fields */}
          {event.rawTxn && (
            <div className="space-y-1.5">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transaction Identifiers</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <span className="text-slate-500 block">Transaction ID / UTR:</span>
                  <span className="text-slate-200">{event.rawTxn.utr || event.rawTxn.transactionId || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Reported Balance:</span>
                  <span className="text-slate-200">
                    {event.rawTxn.balance !== undefined ? formatCurrencyINR(event.rawTxn.balance, false) : 'Unreported'}
                  </span>
                </div>
                {event.rawTxn.upiId && (
                  <div className="col-span-2">
                    <span className="text-slate-500 block">UPI VPA:</span>
                    <span className="text-blue-400">{event.rawTxn.upiId}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            {event.relatedTransactionId && onOpenTransaction && (
              <button
                onClick={() => {
                  onClose();
                  onOpenTransaction(event.relatedTransactionId!);
                }}
                className="flex items-center space-x-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Transaction</span>
              </button>
            )}

            {event.accountId && onShowOnGraph && (
              <button
                onClick={() => {
                  onClose();
                  onShowOnGraph(event.accountId!);
                }}
                className="flex items-center space-x-1.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Show on Graph</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onAddAnnotation && (
              <button
                onClick={() => {
                  onClose();
                  onAddAnnotation(event);
                }}
                className="flex items-center space-x-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Annotate</span>
              </button>
            )}

            {onAddToCase && (
              <button
                onClick={() => {
                  onClose();
                  onAddToCase(event);
                }}
                className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add to Case</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
