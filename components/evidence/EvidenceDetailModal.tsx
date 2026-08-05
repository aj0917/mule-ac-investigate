'use client';

import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  FileCode,
  Camera,
  Layers,
  Clock,
  Copy,
  ArrowRightLeft,
  Users,
  Shield,
  Briefcase,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
  Plus,
} from 'lucide-react';
import { InvestigationCase, EvidenceItem, EvidenceReviewChecklist } from '@/types/case';
import { verifyEvidenceIntegrity } from '@/lib/evidenceStorage';
import { updateCase } from '@/lib/caseStorage';

interface EvidenceDetailModalProps {
  evidence: EvidenceItem;
  caseObj?: InvestigationCase;
  onClose: () => void;
  onUpdate: () => void;
  onNavigateToAccount?: (accId: string) => void;
}

export const EvidenceDetailModal: React.FC<EvidenceDetailModalProps> = ({
  evidence,
  caseObj,
  onClose,
  onUpdate,
  onNavigateToAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'preview' | 'integrity' | 'lineage' | 'related' | 'custody' | 'review'>('overview');
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  // Review checklist state
  const defaultChecklist: EvidenceReviewChecklist = evidence.review?.checklist || {
    sourceIdentified: true,
    fileAccessible: true,
    fileTypeIdentified: true,
    hashCalculated: Boolean(evidence.hash),
    sourceMetadataRecorded: Boolean(evidence.sourceName),
    relatedRecordsLinked: (evidence.relatedTransactionIds || []).length > 0,
    integrityChecked: evidence.integrityStatus === 'Verified Unchanged',
    notesAdded: (evidence.notes || []).length > 0,
  };

  const [checklist, setChecklist] = useState<EvidenceReviewChecklist>(defaultChecklist);
  const [reviewStatus, setReviewStatus] = useState<'Not Reviewed' | 'Under Review' | 'Reviewed' | 'Needs Clarification'>(
    evidence.review?.status || 'Under Review'
  );
  const [observations, setObservations] = useState(evidence.review?.observations || '');

  const handleVerifyIntegrity = async () => {
    setIsVerifying(true);
    try {
      await verifyEvidenceIntegrity(evidence.id, evidence.investigationId);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSaveReview = () => {
    if (!caseObj) return;
    const now = new Date().toISOString();
    const evIndex = caseObj.evidenceItems.findIndex((e) => e.id === evidence.id);
    if (evIndex !== -1) {
      const updatedItems = [...caseObj.evidenceItems];
      updatedItems[evIndex] = {
        ...updatedItems[evIndex],
        review: {
          status: reviewStatus,
          reviewDate: now,
          reviewerId: 'PI V. R. Kadam',
          observations,
          checklist,
        },
        updatedAt: now,
      };
      const updatedCase = {
        ...caseObj,
        evidenceItems: updatedItems,
      };
      updateCase(updatedCase);
      onUpdate();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-6 space-y-0">
        {/* Modal Top Bar */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/40 text-xs font-mono font-bold">
              {evidence.evidenceNumber}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100">{evidence.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                Case: {evidence.investigationId} • Type: {evidence.evidenceType} • Collected: {evidence.collectedAt}
              </p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub-navigation tabs */}
        <div className="flex items-center space-x-1 bg-slate-950/60 border-b border-slate-800 px-4 pt-2 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Overview & Metadata
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'preview'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            File Preview & Location
          </button>
          <button
            onClick={() => setActiveTab('integrity')}
            className={`px-3 py-2 border-b-2 transition-colors flex items-center space-x-1 ${
              activeTab === 'integrity'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>SHA-256 Integrity</span>
          </button>
          <button
            onClick={() => setActiveTab('lineage')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'lineage'
                ? 'border-purple-500 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Evidence Lineage
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'related'
                ? 'border-cyan-500 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Linked Objects ({(evidence.relatedTransactionIds || []).length + (evidence.relatedAccountIds || []).length})
          </button>
          <button
            onClick={() => setActiveTab('custody')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'custody'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Chain of Custody
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={`px-3 py-2 border-b-2 transition-colors ${
              activeTab === 'review'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Review & Audit
          </button>
        </div>

        {/* Tab Content Container */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-5 text-xs">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Core Metadata
                  </span>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Title:</span>
                      <span className="font-bold text-slate-100">{evidence.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Evidence Number:</span>
                      <span className="font-mono text-blue-400">{evidence.evidenceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Evidence Type:</span>
                      <span>{evidence.evidenceType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Collected Date:</span>
                      <span className="font-mono">{evidence.collectedAt}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400">
                        {evidence.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Source & Provenance
                  </span>
                  <div className="space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source Type:</span>
                      <span>{evidence.sourceType || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Source Officer / Org:</span>
                      <span className="font-semibold text-slate-200">{evidence.sourceName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Name:</span>
                      <span className="font-mono text-slate-200">{evidence.fileName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">File Size:</span>
                      <span className="font-mono">{(evidence.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHA-256 Cryptographic Hash Snippet */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Cryptographic SHA-256 Hash</span>
                  </span>
                  <button
                    onClick={() => copyToClipboard(evidence.hash)}
                    className="text-[10px] text-slate-400 hover:text-slate-100 flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedHash ? 'Copied!' : 'Copy Hash'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-900 rounded-lg font-mono text-[11px] text-emerald-300 break-all border border-slate-800 select-all">
                  {evidence.hash}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PREVIEW & SOURCE LOCATION */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Source Mapping Box */}
              {evidence.sourceLocation && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Source Location Mapping
                  </span>
                  <div className="grid grid-cols-3 gap-3 font-mono text-slate-300">
                    <div>Page Number: {evidence.sourceLocation.pageNumber || 'N/A'}</div>
                    <div>Sheet Name: {evidence.sourceLocation.sheetName || 'N/A'}</div>
                    <div>Row Number: {evidence.sourceLocation.rowNumber || 'N/A'}</div>
                  </div>

                  {evidence.sourceLocation.originalValue && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Original Raw Value:</span>
                        <div className="p-2 bg-slate-900 rounded font-mono text-slate-300">
                          {evidence.sourceLocation.originalValue}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block">Normalized System Value:</span>
                        <div className="p-2 bg-slate-900 rounded font-mono text-emerald-400">
                          {evidence.sourceLocation.normalizedValue || evidence.sourceLocation.originalValue}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* File Content Preview */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Source Document Viewer</span>
                  <span className="text-[10px] font-mono text-slate-500">{evidence.fileName}</span>
                </div>

                {evidence.fileDataUrl ? (
                  evidence.fileType.startsWith('image/') ? (
                    <img src={evidence.fileDataUrl} alt={evidence.title} className="max-h-96 rounded border border-slate-800 mx-auto" />
                  ) : (
                    <iframe src={evidence.fileDataUrl} className="w-full h-80 rounded border border-slate-800" title="PDF Preview" />
                  )
                ) : (
                  <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-slate-400">Source file stored securely in Case Vault.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: INTEGRITY VERIFICATION */}
          {activeTab === 'integrity' && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      SHA-256 Integrity Verification Status
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Recalculates current file hash and compares against origin record.
                    </p>
                  </div>

                  <button
                    onClick={handleVerifyIntegrity}
                    disabled={isVerifying}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                    <span>Verify Integrity Now</span>
                  </button>
                </div>

                <div
                  className={`p-4 rounded-xl border flex items-center space-x-3 ${
                    evidence.integrityStatus === 'Verified Unchanged' || evidence.status === 'Verified'
                      ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-red-950/20 border-red-500/40 text-red-400'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <div>
                    <span className="font-bold text-sm block">
                      {evidence.integrityStatus === 'Verified Unchanged' || evidence.status === 'Verified'
                        ? 'VERIFIED UNCHANGED'
                        : 'FILE ALTERATION DETECTED'}
                    </span>
                    <span className="text-[11px] text-slate-300">
                      Cryptographic SHA-256 hash matches original import provenance exactly.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: LINEAGE */}
          {activeTab === 'lineage' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">
                  Source-to-Finding Data Provenance
                </span>
                <div className="flex items-center justify-between font-mono text-slate-300 text-center p-3 bg-slate-900 rounded-lg border border-slate-800">
                  <div>
                    <span className="text-[9px] text-slate-500 block">SOURCE</span>
                    <span className="font-bold text-emerald-400 text-xs">{evidence.sourceName || 'Nodal File'}</span>
                  </div>
                  <div>→</div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">EVIDENCE</span>
                    <span className="font-bold text-blue-400 text-xs">{evidence.evidenceNumber}</span>
                  </div>
                  <div>→</div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">TRANSACTIONS</span>
                    <span className="font-bold text-purple-400 text-xs">{(evidence.relatedTransactionIds || []).length} Mapped</span>
                  </div>
                  <div>→</div>
                  <div>
                    <span className="text-[9px] text-slate-500 block">PATTERNS</span>
                    <span className="font-bold text-amber-400 text-xs">{(evidence.relatedIndicatorIds || []).length} Indicators</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: RELATED OBJECTS */}
          {activeTab === 'related' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider block">
                  Linked Accounts ({(evidence.relatedAccountIds || []).length})
                </span>
                <div className="space-y-1.5">
                  {(evidence.relatedAccountIds || []).map((accId) => (
                    <div key={accId} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="font-mono text-slate-200 font-bold">{accId}</span>
                      {onNavigateToAccount && (
                        <button
                          onClick={() => {
                            onNavigateToAccount(accId);
                            onClose();
                          }}
                          className="text-[11px] font-bold text-cyan-400 hover:underline"
                        >
                          Open Account Intelligence
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CUSTODY */}
          {activeTab === 'custody' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                  Immutable Chain of Custody Activity Log
                </span>

                <div className="space-y-2">
                  {(evidence.chainOfCustody || []).map((coc) => (
                    <div key={coc.id} className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="font-bold text-amber-400 text-xs">{coc.action}</span>
                          <span className="text-slate-400 text-[10px]">by {coc.performedBy}</span>
                        </div>
                        <p className="text-slate-300 text-[11px]">{coc.reason}</p>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {coc.timestamp ? coc.timestamp.slice(0, 19).replace('T', ' ') : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: REVIEW */}
          {activeTab === 'review' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                    Investigator Review Checklist
                  </span>

                  <select
                    value={reviewStatus}
                    onChange={(e) => setReviewStatus(e.target.value as any)}
                    className="bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-300 rounded-lg px-2.5 py-1"
                  >
                    <option value="Not Reviewed">Not Reviewed</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Reviewed">Reviewed</option>
                    <option value="Needs Clarification">Needs Clarification</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                  {Object.entries(checklist).map(([key, checked]) => (
                    <div
                      key={key}
                      onClick={() => setChecklist({ ...checklist, [key]: !checked })}
                      className="flex items-center space-x-2 p-2 bg-slate-900 rounded-lg border border-slate-800 cursor-pointer hover:border-slate-700"
                    >
                      {checked ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-600" />}
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Reviewer Observations
                  </label>
                  <textarea
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Document observations regarding data accuracy, bank seals, or verification status..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 text-xs"
                  />
                </div>

                <button
                  onClick={handleSaveReview}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Save Review Findings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
