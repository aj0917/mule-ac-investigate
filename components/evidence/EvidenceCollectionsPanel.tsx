'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  FileText,
  Folder,
  Calendar,
  CheckCircle2,
  Clock,
  X,
  ChevronRight,
  ArrowRight,
  FileSpreadsheet,
  FileCode,
} from 'lucide-react';
import { InvestigationCase, EvidenceCollection, EvidenceItem } from '@/types/case';
import { getStoredCollections, saveCollectionsToStorage } from '@/lib/evidenceStorage';

interface EvidenceCollectionsPanelProps {
  cases: InvestigationCase[];
  evidenceItems: { evidence: EvidenceItem; caseObj?: InvestigationCase }[];
  onSelectEvidence: (ev: EvidenceItem) => void;
}

export const EvidenceCollectionsPanel: React.FC<EvidenceCollectionsPanelProps> = ({
  cases,
  evidenceItems,
  onSelectEvidence,
}) => {
  const [collections, setCollections] = useState<EvidenceCollection[]>(() => getStoredCollections());
  const [selectedCollection, setSelectedCollection] = useState<EvidenceCollection | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCaseId, setNewCaseId] = useState(cases[0]?.id || 'CYBER-2026-00001');
  const [newSource, setNewSource] = useState('Official Nodal Request');

  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const now = new Date().toISOString();
    const nextNum = collections.length + 1;
    const colId = `COL-${new Date().getFullYear()}-${nextNum.toString().padStart(5, '0')}`;

    const newCol: EvidenceCollection = {
      id: colId,
      title: newTitle,
      description: newDesc,
      investigationId: newCaseId,
      collectionDate: now.slice(0, 10),
      source: newSource,
      evidenceIds: [],
      status: 'Open',
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newCol, ...collections];
    setCollections(updated);
    saveCollectionsToStorage(updated);
    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <span>Evidence Collections ({collections.length})</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Group related bank statements, screenshots, and digital files into structured investigation collections.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center space-x-2 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Main Grid: Collections list + Detail inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Collections Cards List */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Registered Collections
          </span>

          {collections.map((col) => {
            const isSelected = selectedCollection?.id === col.id;
            const itemsCount = (col.evidenceIds || []).length;

            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollection(col)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                  isSelected
                    ? 'bg-indigo-950/20 border-indigo-500 shadow-md shadow-indigo-950/40'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold font-mono text-indigo-400">{col.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      col.status === 'Complete'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    }`}
                  >
                    {col.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-100">{col.title}</h4>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{col.description}</p>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 border-t border-slate-800/80 pt-2">
                  <span>Case: {col.investigationId}</span>
                  <span>{itemsCount} Evidence Items</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Collection Inspector */}
        <div className="lg:col-span-2">
          {selectedCollection ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider block">
                    {selectedCollection.id} • Case {selectedCollection.investigationId}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 mt-1">{selectedCollection.title}</h3>
                </div>

                <select
                  value={selectedCollection.status}
                  onChange={(e) => {
                    const updated = collections.map((c) =>
                      c.id === selectedCollection.id ? { ...c, status: e.target.value as any } : c
                    );
                    setCollections(updated);
                    saveCollectionsToStorage(updated);
                    setSelectedCollection({ ...selectedCollection, status: e.target.value as any });
                  }}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-400"
                >
                  <option value="Open">Open Collection</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Complete">Complete</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              <p className="text-xs text-slate-300">{selectedCollection.description}</p>

              {/* Multi-Level Lineage View: Collection -> Items -> Transactions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
                  <Folder className="w-4 h-4 text-indigo-400" />
                  <span>Collection Lineage Hierarchy</span>
                </h4>

                <div className="space-y-3">
                  {evidenceItems
                    .filter(({ evidence }) => (selectedCollection.evidenceIds || []).includes(evidence.id))
                    .map(({ evidence }) => (
                      <div
                        key={evidence.id}
                        className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span className="text-xs font-bold font-mono text-blue-400">{evidence.evidenceNumber}</span>
                            <span className="text-xs font-semibold text-slate-200">{evidence.title}</span>
                          </div>
                          <button
                            onClick={() => onSelectEvidence(evidence)}
                            className="text-xs font-bold text-blue-400 hover:underline flex items-center space-x-1"
                          >
                            <span>View Item</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                          <div>Hash: {evidence.hash ? `${evidence.hash.slice(0, 10)}...` : 'N/A'}</div>
                          <div>Type: {evidence.evidenceType}</div>
                          <div>Txns: {(evidence.relatedTransactionIds || []).length} Mapped</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
              <Layers className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400 font-semibold">Select an Evidence Collection from the list to view lineage.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: CREATE COLLECTION */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Create Evidence Collection</span>
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Collection Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bank Statements & NPCI Gateway Log Export Collection"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Investigation Case *
                </label>
                <select
                  value={newCaseId}
                  onChange={(e) => setNewCaseId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.caseNumber} - {c.title.slice(0, 30)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding source, nodal authorization, and collection purpose..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl"
                >
                  Create Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
