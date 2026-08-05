'use client';

import React, { useState } from 'react';
import { X, Shield, Calendar, User, MapPin, Tag, FileText, AlertCircle } from 'lucide-react';
import { InvestigationCase, CasePriority, CaseStatus } from '@/types/case';
import { generateNextCaseId, saveCasesToStorage, getStoredCases } from '@/lib/caseStorage';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCaseCreated: (newCase: InvestigationCase) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onCaseCreated,
}) => {
  const [title, setTitle] = useState('');
  const [caseType, setCaseType] = useState('Cyber Financial Fraud');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [incidentDate, setIncidentDate] = useState(new Date().toISOString().slice(0, 10));
  const [reportedDate, setReportedDate] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('Satara City, Maharashtra');
  const [primaryAccountId, setPrimaryAccountId] = useState('');
  const [assignedInvestigator, setAssignedInvestigator] = useState('PI V. R. Kadam');
  const [priority, setPriority] = useState<CasePriority>('High');
  const [initialNotes, setInitialNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Case Title is required.');
      return;
    }

    const nextId = generateNextCaseId();
    const now = new Date().toISOString();

    const newCase: InvestigationCase = {
      id: nextId,
      caseNumber: nextId,
      title: title.trim(),
      caseType,
      referenceNumber: referenceNumber.trim() || `REF-SATARA-${Date.now().toString().slice(-6)}`,
      description: description.trim() || 'No detailed description provided.',
      status: 'Under Investigation',
      priority,
      incidentDate,
      reportedDate,
      location: location.trim(),
      primaryAccountId: primaryAccountId.trim() || undefined,
      assignedInvestigator: assignedInvestigator.trim(),
      initialNotes: initialNotes.trim() || undefined,
      datasetVersion: 1,

      accounts: primaryAccountId.trim()
        ? [
            {
              id: `CA-${Date.now()}`,
              investigationId: nextId,
              accountId: primaryAccountId.trim(),
              accountNumberMasked: primaryAccountId.trim(),
              relationshipRole: 'Primary Account',
              reason: 'Primary subject account specified during case creation',
              addedAt: now,
            },
          ]
        : [],
      transactions: [],
      indicators: [],
      evidenceItems: [],
      notes: initialNotes.trim()
        ? [
            {
              id: `NOTE-${Date.now()}`,
              investigationId: nextId,
              title: 'Initial Case Creation Notes',
              content: initialNotes.trim(),
              noteType: 'General',
              author: assignedInvestigator.trim(),
              relatedAccountIds: primaryAccountId.trim() ? [primaryAccountId.trim()] : [],
              relatedTransactionIds: [],
              relatedIndicatorIds: [],
              relatedEvidenceIds: [],
              versions: [
                {
                  version: 1,
                  content: initialNotes.trim(),
                  updatedAt: now,
                  updatedBy: assignedInvestigator.trim(),
                },
              ],
              createdAt: now,
              updatedAt: now,
            },
          ]
        : [],
      findings: [],
      tasks: [
        {
          id: `TASK-${Date.now()}`,
          investigationId: nextId,
          title: 'Review Initial Financial Statements & Identify Counterparties',
          description: 'Initial intake checklist for new cyber money flow case.',
          assignedTo: assignedInvestigator.trim(),
          priority: priority,
          dueDate: reportedDate,
          status: 'Open',
          createdAt: now,
          updatedAt: now,
        },
      ],
      timeline: [
        {
          id: `TLE-${Date.now()}`,
          investigationId: nextId,
          eventType: 'Case Created',
          objectType: 'Case',
          description: `Investigation Case ${nextId} initiated by ${assignedInvestigator.trim()}.`,
          actor: assignedInvestigator.trim(),
          timestamp: now,
        },
      ],
      activityLogs: [
        {
          id: `ACT-${Date.now()}`,
          investigationId: nextId,
          actor: assignedInvestigator.trim(),
          action: 'Case Created',
          details: `Initiated case ${nextId}: ${title.trim()}`,
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const allCases = getStoredCases();
    allCases.unshift(newCase);
    saveCasesToStorage(allCases);

    onCaseCreated(newCase);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
                Create New Investigation Case
              </h2>
              <p className="text-xs text-slate-400">
                Satara Police Cyber Cell Case Registration & Evidence Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Auto ID Display & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Generated Case ID
              </label>
              <input
                type="text"
                disabled
                value={generateNextCaseId()}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono font-bold text-blue-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Priority Level
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CasePriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
                <option value="Critical">Critical Priority</option>
              </select>
            </div>
          </div>

          {/* Title & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Case Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Suspected Phishing Transfer & Layered UPI Trail"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Case Category / Type
              </label>
              <select
                value={caseType}
                onChange={(e) => setCaseType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Cyber Financial Fraud">Cyber Financial Fraud</option>
                <option value="Phishing & Malicious App">Phishing & Malicious App</option>
                <option value="UPI Mule Account Trail">UPI Mule Account Trail</option>
                <option value="Crypto Cashout Layering">Crypto Cashout Layering</option>
                <option value="Investment / Task Fraud">Investment / Task Fraud</option>
                <option value="Other Financial Cyber Crime">Other Financial Cyber Crime</option>
              </select>
            </div>
          </div>

          {/* Reference No & Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reference / FIR Number (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. FIR-2026-9811 / NCRP-781902"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Jurisdiction / Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Dates & Primary Account */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Incident Date
              </label>
              <input
                type="date"
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Reported Date
              </label>
              <input
                type="date"
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Primary Subject Account
              </label>
              <input
                type="text"
                placeholder="e.g. XXXX1234 or Account No."
                value={primaryAccountId}
                onChange={(e) => setPrimaryAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Investigator */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Assigned Investigator / Officer
            </label>
            <input
              type="text"
              value={assignedInvestigator}
              onChange={(e) => setAssignedInvestigator(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Case Description & Allegation Summary
            </label>
            <textarea
              rows={3}
              placeholder="Provide a detailed overview of the complaint, money trail allegations, and primary accounts involved..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Initial Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Initial Investigator Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Initial leads, victim interview remarks, or quick actions required..."
              value={initialNotes}
              onChange={(e) => setInitialNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Create Investigation Case</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
