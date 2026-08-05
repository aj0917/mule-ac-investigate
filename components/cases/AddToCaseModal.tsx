'use client';

import React, { useState } from 'react';
import { X, Shield, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { InvestigationCase, AccountRelationshipRole } from '@/types/case';
import {
  getStoredCases,
  addAccountToCase,
  addTransactionToCase,
  linkIndicatorToCase,
} from '@/lib/caseStorage';

interface AddToCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemType: 'account' | 'transaction' | 'indicator';
  itemData: {
    id: string; // account number, transaction id, or pattern indicator id
    label?: string;
    secondaryInfo?: string;
    amount?: number;
  };
}

export const AddToCaseModal: React.FC<AddToCaseModalProps> = ({
  isOpen,
  onClose,
  itemType,
  itemData,
}) => {
  const [cases] = useState<InvestigationCase[]>(() => getStoredCases());
  const [selectedCaseId, setSelectedCaseId] = useState<string>(cases[0]?.id || '');
  const [relationshipRole, setRelationshipRole] =
    useState<AccountRelationshipRole>('Related Account');
  const [indicatorStatus, setIndicatorStatus] = useState<
    'Under Review' | 'Verified' | 'Dismissed' | 'Primary Lead'
  >('Primary Lead');
  const [reason, setReason] = useState(
    `Added ${itemType} ${itemData.id} to investigation context.`
  );
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCaseId) {
      setErrorMsg('Please select a case.');
      return;
    }

    try {
      if (itemType === 'account') {
        addAccountToCase(
          selectedCaseId,
          itemData.id,
          itemData.label || itemData.id,
          relationshipRole,
          reason,
          notes
        );
      } else if (itemType === 'transaction') {
        addTransactionToCase(selectedCaseId, itemData.id, reason, notes);
      } else if (itemType === 'indicator') {
        linkIndicatorToCase(selectedCaseId, itemData.id, indicatorStatus, notes);
      }

      setSuccessMsg(`Successfully linked ${itemType} to Case ${selectedCaseId}`);
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add item to case.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center space-x-2.5">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Add {itemType.toUpperCase()} to Case
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAdd} className="p-5 space-y-4">
          {successMsg ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 flex items-center space-x-2 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Target Item summary */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                  Target {itemType}
                </span>
                <p className="text-xs font-mono font-bold text-slate-200">
                  {itemData.id} {itemData.label ? `(${itemData.label})` : ''}
                </p>
                {itemData.secondaryInfo && (
                  <p className="text-[11px] text-slate-400">{itemData.secondaryInfo}</p>
                )}
              </div>

              {/* Select Investigation Case */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Select Active Investigation Case *
                </label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
                  required
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} - {c.title} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Account specific role */}
              {itemType === 'account' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Relationship Role in Investigation
                  </label>
                  <select
                    value={relationshipRole}
                    onChange={(e) => setRelationshipRole(e.target.value as AccountRelationshipRole)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Primary Account">Primary Account</option>
                    <option value="Related Account">Related Account</option>
                    <option value="Counterparty">Counterparty</option>
                    <option value="Source Account">Source Account</option>
                    <option value="Destination Account">Destination Account</option>
                    <option value="Observed Intermediary">Observed Intermediary</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>
              )}

              {/* Indicator specific status */}
              {itemType === 'indicator' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    Investigator Assessment Status
                  </label>
                  <select
                    value={indicatorStatus}
                    onChange={(e) => setIndicatorStatus(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="Primary Lead">Primary Lead</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Dismissed">Dismissed</option>
                  </select>
                </div>
              )}

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Reason for Linkage
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {/* Investigator Note */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Investigator Note (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context or observations..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Attach to Case</span>
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
