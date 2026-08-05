'use client';

import React, { useState } from 'react';
import { X, GitCompare, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { CrossCaseObservation } from '@/types/crossStatement';

interface CrossCaseObservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (obs: Omit<CrossCaseObservation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  cases: { id: string; name: string }[];
}

export const CrossCaseObservationModal: React.FC<CrossCaseObservationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  cases,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [caseAId, setCaseAId] = useState(cases[0]?.id || 'INV-2026-SATARA-01');
  const [caseBId, setCaseBId] = useState(cases[1]?.id || 'INV-2026-SATARA-02');
  const [sharedType, setSharedType] = useState<CrossCaseObservation['sharedEntityType']>('ACCOUNT');
  const [sharedVal, setSharedVal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !sharedVal.trim()) {
      setErrorMsg('Please complete title, shared entity value, and description fields.');
      return;
    }

    const caseAObj = cases.find((c) => c.id === caseAId) || { id: caseAId, name: 'Case A' };
    const caseBObj = cases.find((c) => c.id === caseBId) || { id: caseBId, name: 'Case B' };

    onSave({
      title,
      description,
      caseA: caseAObj,
      caseB: caseBObj,
      sharedEntityType: sharedType,
      sharedEntityValue: sharedVal,
      supportingTransactionIds: [],
      supportingEvidenceIds: [],
      status: 'CONFIRMED',
      createdBy: 'PI Cyber Cell Satara',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Register Cross-Case Observation</h3>
              <p className="text-xs text-slate-400">
                Record analytical overlap between independent police investigation files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Observation Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Common Account Identified Across Cyber Fraud Investigations"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Primary Case (Case A)</label>
              <select
                value={caseAId}
                onChange={(e) => setCaseAId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Correlated Case (Case B)</label>
              <select
                value={caseBId}
                onChange={(e) => setCaseBId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Shared Entity Type</label>
              <select
                value={sharedType}
                onChange={(e) => setSharedType(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ACCOUNT">Account Number</option>
                <option value="UTR">UTR Transaction Reference</option>
                <option value="UPI">UPI Identifier</option>
                <option value="COUNTERPARTY">Counterparty Name</option>
                <option value="EVIDENCE">Evidence Document</option>
                <option value="PHONE">Phone Number</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Shared Value</label>
              <input
                type="text"
                value={sharedVal}
                onChange={(e) => setSharedVal(e.target.value)}
                placeholder="e.g. XXXX5821 or UTR-98218731"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1">Factual Analytical Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the objective evidence linking both cases..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 italic">
            Note: Observations capture factual record overlaps. The system does not imply criminal intent or guilt.
          </div>

          {errorMsg && (
            <p className="text-xs font-semibold text-rose-400 bg-rose-950/40 p-2 rounded border border-rose-800/60">
              {errorMsg}
            </p>
          )}

          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" /> Save Observation Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
