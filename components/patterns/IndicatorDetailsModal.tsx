'use client';

import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowRightLeft,
  Calendar,
  Building2,
  FileSpreadsheet,
  ExternalLink,
  ShieldCheck,
  Tag,
  Clock,
  Send,
  Layers,
  HelpCircle,
  FileText,
  Sliders,
  Plus,
} from 'lucide-react';
import {
  PatternIndicator,
  PatternStatus,
  DismissReason,
  Transaction,
  BankStatement,
} from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { AddToCaseModal } from '../cases/AddToCaseModal';

interface IndicatorDetailsModalProps {
  indicator: PatternIndicator;
  statements: BankStatement[];
  onClose: () => void;
  onShowOnGraph: (accId: string) => void;
  onOpenAccount: (accId: string) => void;
  onOpenTransaction: (txn: Transaction) => void;
  onUpdateStatus: (indId: string, status: PatternStatus, reason?: DismissReason, notes?: string) => void;
}

export const IndicatorDetailsModal: React.FC<IndicatorDetailsModalProps> = ({
  indicator,
  statements,
  onClose,
  onShowOnGraph,
  onOpenAccount,
  onOpenTransaction,
  onUpdateStatus,
}) => {
  const [currentStatus, setCurrentStatus] = useState<PatternStatus>(indicator.status);
  const [dismissReason, setDismissReason] = useState<DismissReason>(
    indicator.dismissReason || 'KNOWN_BUSINESS_ACTIVITY'
  );
  const [dismissNotes, setDismissNotes] = useState<string>(indicator.dismissNotes || '');
  const [isDismissing, setIsDismissing] = useState<boolean>(indicator.status === 'DISMISSED');
  const [showAddToCase, setShowAddToCase] = useState<boolean>(false);

  const handleSaveStatus = (newStatus: PatternStatus) => {
    setCurrentStatus(newStatus);
    if (newStatus === 'DISMISSED') {
      setIsDismissing(true);
    } else {
      setIsDismissing(false);
      onUpdateStatus(indicator.id, newStatus);
    }
  };

  const handleConfirmDismiss = () => {
    onUpdateStatus(indicator.id, 'DISMISSED', dismissReason, dismissNotes);
    setIsDismissing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  EXPLAINABLE PATTERN INDICATOR DETAIL
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-800 text-slate-300">
                  {indicator.category.replace(/_/g, ' ')}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100 mt-0.5">{indicator.title}</h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddToCase(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Link to Investigation Case</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {showAddToCase && (
          <AddToCaseModal
            isOpen={showAddToCase}
            onClose={() => setShowAddToCase(false)}
            itemType="indicator"
            itemData={{
              id: indicator.id,
              label: indicator.title,
              secondaryInfo: indicator.subtitle,
            }}
          />
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status & Investigator Review Bar */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Investigator Review Workflow Status
              </span>
              <p className="text-xs text-slate-400 mt-0.5">
                Workflow status indicates review stage and does not imply criminal guilt.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              {(['NEW', 'UNDER_REVIEW', 'REVIEWED', 'IMPORTANT', 'DISMISSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => handleSaveStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    currentStatus === st
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Dismiss Reason Form Modal Panel */}
          {isDismissing && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>Dismiss Investigation Indicator</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Select Reason for Dismissal</label>
                  <select
                    value={dismissReason}
                    onChange={(e) => setDismissReason(e.target.value as DismissReason)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="KNOWN_BUSINESS_ACTIVITY">Known / Standard Business Activity</option>
                    <option value="DUPLICATE_SOURCE">Duplicate Source File</option>
                    <option value="EXPECTED_TRANSACTION">Expected / Verified Transaction</option>
                    <option value="DATA_ISSUE">Data Normalization Issue</option>
                    <option value="FALSE_POSITIVE">False Positive Pattern Match</option>
                    <option value="OTHER">Other Reason</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Investigator Audit Notes</label>
                  <input
                    type="text"
                    value={dismissNotes}
                    onChange={(e) => setDismissNotes(e.target.value)}
                    placeholder="Enter reason details for audit log..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setIsDismissing(false)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDismiss}
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-bold"
                >
                  Save Dismissal Record
                </button>
              </div>
            </div>
          )}

          {/* Explanation Narrative Box */}
          <div className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5">
              <FileText className="w-4 h-4" />
              <span>Human-Readable Explanation Narrative</span>
            </h4>
            <p className="text-xs text-slate-200 leading-relaxed">{indicator.explanation}</p>
          </div>

          {/* Mathematical Calculation Details Breakdown Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Calculation & Matching Logic ({indicator.calculation.formulaName})
              </h4>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono font-bold text-[10px] rounded-full">
                {indicator.calculation.matchedConditionCount} of {indicator.calculation.totalConditionsCount} Rules Matched
              </span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Parameter / Rule Rule</th>
                    <th className="p-2.5">Observed Data Value</th>
                    <th className="p-2.5">Configured Threshold</th>
                    <th className="p-2.5 text-right">Condition Met</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-slate-300">
                  {indicator.calculation.steps.map((step, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/50">
                      <td className="p-2.5 font-semibold text-slate-200">{step.parameter}</td>
                      <td className="p-2.5 font-mono text-emerald-400 font-bold">{step.observedValue}</td>
                      <td className="p-2.5 font-mono text-slate-400">{step.configuredThreshold}</td>
                      <td className="p-2.5 text-right">
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold rounded-full border border-emerald-500/30">
                          MATCHED ✓
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Priority Factors Breakdown */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Why Priority: {indicator.priority}?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {indicator.priorityFactors.map((f, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs space-y-0.5">
                  <span className="text-[10px] text-slate-500 uppercase block">{f.label}</span>
                  <span className="font-mono font-bold text-slate-200">{f.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Affected Accounts */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Involved Accounts ({indicator.involvedAccountLabels.length})
            </h4>
            <div className="flex flex-wrap gap-2">
              {indicator.involvedAccountLabels.map((acc, idx) => (
                <button
                  key={idx}
                  onClick={() => onOpenAccount(acc)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-mono font-bold text-blue-400 hover:underline flex items-center space-x-1"
                >
                  <span>{acc}</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          </div>

          {/* Supporting Transactions Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>Supporting Transactions ({indicator.supportingTransactions.length})</span>
              <span className="text-[10px] text-slate-500 font-normal">Direct evidence records</span>
            </h4>

            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
              <div className="divide-y divide-slate-800 max-h-48 overflow-y-auto text-xs">
                {indicator.supportingTransactions.map((t) => (
                  <div key={t.id} className="p-3 hover:bg-slate-900/60 transition-colors flex items-center justify-between">
                    <div className="space-y-0.5 max-w-[400px]">
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
                        onClick={() => onOpenTransaction(t)}
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
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onShowOnGraph(indicator.rootAccountId)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg text-xs font-bold transition-colors flex items-center space-x-2"
          >
            <GitMerge className="w-4 h-4" />
            <span>Show Pattern on Money Flow Graph</span>
          </button>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            Close Explanation
          </button>
        </div>
      </div>
    </div>
  );
};
