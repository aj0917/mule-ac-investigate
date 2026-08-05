'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, CheckCircle2, XCircle, HelpCircle, ArrowRight, ArrowRightLeft, Building2, Calendar, FileSpreadsheet, Tag, Clock } from 'lucide-react';
import { CrossStatementMatch, MatchStatus } from '@/types/crossStatement';
import { formatCurrencyINR } from '@/lib/storage';

interface MatchReviewModalProps {
  match: CrossStatementMatch | null;
  onClose: () => void;
  onSaveReview: (matchId: string, status: MatchStatus, notes: string) => void;
}

export const MatchReviewModal: React.FC<MatchReviewModalProps> = ({
  match,
  onClose,
  onSaveReview,
}) => {
  const [notes, setNotes] = useState(match?.reviewNotes || '');
  const [selectedStatus, setSelectedStatus] = useState<MatchStatus>(match?.status || 'CONFIRMED');
  const [errorMsg, setErrorMsg] = useState('');

  if (!match) return null;

  const handleSubmit = (status: MatchStatus) => {
    if (status === 'CONFIRMED' && !notes.trim()) {
      setErrorMsg('Investigator reason/notes are required when confirming a cross-statement relationship match.');
      return;
    }
    setErrorMsg('');
    onSaveReview(match.id, status, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                  {match.id}
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {match.matchType.replace('_', ' ')}
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/60">
                  Match Score: {match.matchScore}%
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-1">
                Cross-Statement Relationship Verification
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Explanation Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-300">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <span>Matching Intelligence Rationale</span>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              {match.explanation}
            </p>
          </div>

          {/* Side-by-Side Record Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Record A */}
            <div className="bg-slate-950 border border-blue-900/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-blue-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Source Record A ({match.recordA.statementId})
                </span>
                <span className="text-[11px] font-mono text-slate-400">{match.recordA.bank}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Account:</span>
                  <span className="text-slate-200 font-mono font-bold">{match.recordA.account}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-200 font-mono">{match.recordA.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Amount & Direction:</span>
                  <span className={`font-mono font-bold ${match.recordA.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {match.recordA.direction} {formatCurrencyINR(match.recordA.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">UTR / Ref:</span>
                  <span className="text-slate-200 font-mono font-semibold">{match.recordA.utr || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">UPI Identifier:</span>
                  <span className="text-blue-300 font-mono">{match.recordA.upiId || 'N/A'}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Narration:</span>
                  <p className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 font-mono break-all">
                    {match.recordA.narration}
                  </p>
                </div>
              </div>
            </div>

            {/* Record B */}
            <div className="bg-slate-950 border border-purple-900/40 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-purple-400 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4" />
                  Target Record B ({match.recordB.statementId})
                </span>
                <span className="text-[11px] font-mono text-slate-400">{match.recordB.bank}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Account:</span>
                  <span className="text-slate-200 font-mono font-bold">{match.recordB.account}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Date:</span>
                  <span className="text-slate-200 font-mono">{match.recordB.date}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">Amount & Direction:</span>
                  <span className={`font-mono font-bold ${match.recordB.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {match.recordB.direction} {formatCurrencyINR(match.recordB.amount)}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">UTR / Ref:</span>
                  <span className="text-slate-200 font-mono font-semibold">{match.recordB.utr || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-900">
                  <span className="text-slate-500">UPI Identifier:</span>
                  <span className="text-purple-300 font-mono">{match.recordB.upiId || 'N/A'}</span>
                </div>
                <div className="py-1">
                  <span className="text-slate-500 block mb-1">Narration:</span>
                  <p className="text-[11px] text-slate-300 bg-slate-900 p-2 rounded border border-slate-800 font-mono break-all">
                    {match.recordB.narration}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Signal Indicator Badges */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Signal Verification Matrix
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                match.matchSignals.utrMatch ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>UTR Reference Match</span>
                {match.matchSignals.utrMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
              </div>
              <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                match.matchSignals.amountMatch ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>Amount Equality</span>
                {match.matchSignals.amountMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
              </div>
              <div className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between ${
                match.matchSignals.upiMatch ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'
              }`}>
                <span>UPI ID Match</span>
                {match.matchSignals.upiMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-slate-600" />}
              </div>
              <div className="p-2.5 rounded-lg border bg-slate-900 border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-between">
                <span>Time Delta</span>
                <span className="font-mono text-blue-400">{match.matchSignals.dateWindowDays} day(s)</span>
              </div>
            </div>
          </div>

          {/* Investigator Notes & Action Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-200 block">
              Investigator Finding & Verification Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide clear investigative rationale for confirming or rejecting this cross-statement match..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            {errorMsg && (
              <p className="text-xs font-semibold text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/60">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 italic">
            Classification does not declare criminal culpability.
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleSubmit('REJECTED')}
              className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" /> Reject Relationship
            </button>
            <button
              onClick={() => handleSubmit('NEEDS_REVIEW')}
              className="px-4 py-2 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Flag for Review
            </button>
            <button
              onClick={() => handleSubmit('CONFIRMED')}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Confirm Relationship
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
