'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  ShieldCheck,
  FileSpreadsheet,
  FileCode,
  Camera,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { InvestigationCase, EvidenceItem } from '@/types/case';
import { Transaction } from '@/types/investigation';
import { getStoredCases } from '@/lib/caseStorage';
import { getAllEvidenceItems } from '@/lib/evidenceStorage';
import { EvidenceOverviewPanel } from './EvidenceOverviewPanel';
import { EvidenceTable } from './EvidenceTable';
import { EvidenceCollectionsPanel } from './EvidenceCollectionsPanel';
import { EvidenceChainLineageView } from './EvidenceChainLineageView';
import { IntegrityVerificationPanel } from './IntegrityVerificationPanel';
import { AddEvidenceModal } from './AddEvidenceModal';
import { EvidenceDetailModal } from './EvidenceDetailModal';

interface EvidenceCenterWorkspaceProps {
  initialCaseId?: string;
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToAccount?: (accId: string) => void;
}

export const EvidenceCenterWorkspace: React.FC<EvidenceCenterWorkspaceProps> = ({
  initialCaseId = 'ALL',
  onNavigateToCase,
  onNavigateToAccount,
}) => {
  const [cases, setCases] = useState<InvestigationCase[]>(() => getStoredCases());
  const [evidenceList, setEvidenceList] = useState<{ evidence: EvidenceItem; caseObj?: InvestigationCase }[]>(() => getAllEvidenceItems());

  const [activeTab, setActiveTab] = useState<'overview' | 'all' | 'statements' | 'txns' | 'media' | 'collections' | 'chain' | 'integrity'>('overview');
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState<{ evidence: EvidenceItem; caseObj?: InvestigationCase } | null>(null);

  const refreshData = () => {
    const loadedCases = getStoredCases();
    setCases(loadedCases);
    const loadedEv = getAllEvidenceItems();
    setEvidenceList(loadedEv);
  };

  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];
  const allTxns: Transaction[] = []; // Aggregated transactions if needed

  return (
    <div className="space-y-6">
      {/* Workspace Top Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Evidence Vault & Chain of Custody</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                STEP 11
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Source file provenance, SHA-256 integrity verification, and data lineage pipeline.
            </p>
          </div>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'overview' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Evidence ({evidenceList.length})
          </button>
          <button
            onClick={() => setActiveTab('statements')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'statements' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Statements
          </button>
          <button
            onClick={() => setActiveTab('txns')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'txns' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Txn Records
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'collections' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Collections
          </button>
          <button
            onClick={() => setActiveTab('chain')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'chain' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence Chain
          </button>
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'integrity' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SHA-256 Audit</span>
          </button>
        </div>
      </div>

      {/* Main Tab Render */}
      {activeTab === 'overview' && (
        <EvidenceOverviewPanel
          cases={cases}
          selectedCaseId={selectedCaseId}
          onSelectCase={setSelectedCaseId}
          onNavigateTab={(tab) => setActiveTab(tab as any)}
          onOpenAddEvidence={() => setShowAddModal(true)}
        />
      )}

      {(activeTab === 'all' || activeTab === 'statements' || activeTab === 'txns' || activeTab === 'media') && (
        <EvidenceTable
          evidenceItems={evidenceList}
          cases={cases}
          onSelectEvidence={(ev, caseObj) => setSelectedEvidenceItem({ evidence: ev, caseObj })}
          onOpenAddEvidence={() => setShowAddModal(true)}
          onRefreshData={refreshData}
        />
      )}

      {activeTab === 'collections' && (
        <EvidenceCollectionsPanel
          cases={cases}
          evidenceItems={evidenceList}
          onSelectEvidence={(ev) => setSelectedEvidenceItem({ evidence: ev })}
        />
      )}

      {activeTab === 'chain' && activeCase && (
        <EvidenceChainLineageView
          caseObj={activeCase}
          allTransactions={allTxns}
          onOpenEvidenceDetail={(ev) => setSelectedEvidenceItem({ evidence: ev })}
          onOpenAccount={(accId) => onNavigateToAccount && onNavigateToAccount(accId)}
        />
      )}

      {activeTab === 'integrity' && (
        <IntegrityVerificationPanel
          evidenceItems={evidenceList.map((i) => ({ evidence: i.evidence, caseId: i.evidence.investigationId }))}
          onRefreshData={refreshData}
        />
      )}

      {/* MODAL: ADD EVIDENCE */}
      {showAddModal && (
        <AddEvidenceModal
          cases={cases}
          defaultCaseId={selectedCaseId === 'ALL' ? undefined : selectedCaseId}
          onClose={() => setShowAddModal(false)}
          onAdded={refreshData}
        />
      )}

      {/* MODAL: EVIDENCE DETAIL */}
      {selectedEvidenceItem && (
        <EvidenceDetailModal
          evidence={selectedEvidenceItem.evidence}
          caseObj={selectedEvidenceItem.caseObj}
          onClose={() => setSelectedEvidenceItem(null)}
          onUpdate={refreshData}
          onNavigateToAccount={onNavigateToAccount}
        />
      )}
    </div>
  );
};
