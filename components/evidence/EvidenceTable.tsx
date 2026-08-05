'use client';

import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Eye,
  RefreshCw,
  Layers,
  Tag,
  Copy,
  Plus,
  ArrowUpDown,
  FileSpreadsheet,
  FileCode,
  Camera,
  ExternalLink,
} from 'lucide-react';
import { InvestigationCase, EvidenceItem, EvidenceType, EvidenceStatus, EvidenceIntegrityStatus } from '@/types/case';
import { verifyEvidenceIntegrity } from '@/lib/evidenceStorage';

interface EvidenceTableProps {
  evidenceItems: { evidence: EvidenceItem; caseObj?: InvestigationCase }[];
  cases: InvestigationCase[];
  onSelectEvidence: (ev: EvidenceItem, caseObj?: InvestigationCase) => void;
  onOpenAddEvidence: () => void;
  onRefreshData: () => void;
}

export const EvidenceTable: React.FC<EvidenceTableProps> = ({
  evidenceItems,
  cases,
  onSelectEvidence,
  onOpenAddEvidence,
  onRefreshData,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [integrityFilter, setIntegrityFilter] = useState<string>('ALL');

  const [sortField, setSortField] = useState<'id' | 'collectedAt' | 'title' | 'fileSize'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // Filtered & Sorted Evidence items
  const filteredItems = useMemo(() => {
    return evidenceItems.filter(({ evidence, caseObj }) => {
      // Case filter
      if (selectedCaseId !== 'ALL' && evidence.investigationId !== selectedCaseId) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'ALL' && evidence.evidenceType !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'ALL' && evidence.status !== statusFilter) {
        return false;
      }
      // Integrity filter
      if (integrityFilter !== 'ALL' && (evidence.integrityStatus || 'Not Checked') !== integrityFilter) {
        return false;
      }
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchId = evidence.evidenceNumber.toLowerCase().includes(q);
        const matchTitle = evidence.title.toLowerCase().includes(q);
        const matchFileName = evidence.fileName.toLowerCase().includes(q);
        const matchHash = (evidence.hash || '').toLowerCase().includes(q);
        const matchSource = (evidence.sourceName || '').toLowerCase().includes(q);
        const matchCase = (evidence.investigationId || '').toLowerCase().includes(q);
        if (!matchId && !matchTitle && !matchFileName && !matchHash && !matchSource && !matchCase) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      let valA: any = a.evidence[sortField] || '';
      let valB: any = b.evidence[sortField] || '';
      if (sortField === 'collectedAt') {
        valA = new Date(a.evidence.collectedAt || 0).getTime();
        valB = new Date(b.evidence.collectedAt || 0).getTime();
      }
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [evidenceItems, selectedCaseId, typeFilter, statusFilter, integrityFilter, searchTerm, sortField, sortDirection]);

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((f) => f.evidence.id));
    }
  };

  const handleToggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleQuickVerifyHash = async (ev: EvidenceItem) => {
    setVerifyingId(ev.id);
    try {
      await verifyEvidenceIntegrity(ev.id, ev.investigationId);
      onRefreshData();
    } catch (err) {
      console.error(err);
    } finally {
      setVerifyingId(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getEvidenceIcon = (type: EvidenceType) => {
    switch (type) {
      case 'Bank Statement':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'Transaction Record':
        return <FileCode className="w-4 h-4 text-purple-400 shrink-0" />;
      case 'Screenshot':
      case 'Image':
        return <Camera className="w-4 h-4 text-amber-400 shrink-0" />;
      default:
        return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Evidence ID, Title, File Name, SHA-256 Hash, Source..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 focus:border-blue-500 focus:outline-none placeholder-slate-500"
            />
          </div>

          <button
            onClick={onOpenAddEvidence}
            className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl flex items-center space-x-2 shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Evidence File</span>
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Case filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Investigation Case
            </label>
            <select
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-blue-500"
            >
              <option value="ALL">All Cases ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Evidence Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-blue-500"
            >
              <option value="ALL">All Types</option>
              <option value="Bank Statement">Bank Statement</option>
              <option value="Transaction Record">Transaction Record</option>
              <option value="Screenshot">Screenshot / Image</option>
              <option value="Document">Document / PDF</option>
              <option value="Digital File">Digital File</option>
            </select>
          </div>

          {/* Status filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Review Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Collected">Collected</option>
              <option value="Under Review">Under Review</option>
              <option value="Verified">Verified</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          {/* Integrity filter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Integrity Status
            </label>
            <select
              value={integrityFilter}
              onChange={(e) => setIntegrityFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:border-blue-500"
            >
              <option value="ALL">All Integrity States</option>
              <option value="Verified Unchanged">Verified Unchanged</option>
              <option value="Changed">Changed / Warning</option>
              <option value="Not Checked">Not Checked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="p-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                    onChange={handleToggleSelectAll}
                    className="rounded bg-slate-900 border-slate-700 text-blue-500"
                  />
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-slate-200"
                  onClick={() => {
                    setSortField('id');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>EVIDENCE ID</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  className="p-3 cursor-pointer hover:text-slate-200"
                  onClick={() => {
                    setSortField('title');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>TITLE & FILE</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3">TYPE</th>
                <th className="p-3">CASE</th>
                <th className="p-3">SOURCE</th>
                <th
                  className="p-3 cursor-pointer hover:text-slate-200"
                  onClick={() => {
                    setSortField('collectedAt');
                    setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                  }}
                >
                  <div className="flex items-center space-x-1">
                    <span>COLLECTED</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="p-3">SHA-256 HASH</th>
                <th className="p-3">INTEGRITY</th>
                <th className="p-3 text-center">LINKED</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-500 font-medium">
                    No evidence items matching active query filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map(({ evidence, caseObj }) => {
                  const isChecked = selectedIds.includes(evidence.id);
                  const isVerifying = verifyingId === evidence.id;

                  return (
                    <tr
                      key={evidence.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isChecked ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelectOne(evidence.id)}
                          className="rounded bg-slate-900 border-slate-700 text-blue-500"
                        />
                      </td>

                      {/* Evidence ID */}
                      <td className="p-3 font-mono font-bold text-blue-400">
                        <button
                          onClick={() => onSelectEvidence(evidence, caseObj)}
                          className="hover:underline flex items-center space-x-1"
                        >
                          <span>{evidence.evidenceNumber}</span>
                        </button>
                      </td>

                      {/* Title & File Name */}
                      <td className="p-3 max-w-xs">
                        <div className="flex items-start space-x-2">
                          {getEvidenceIcon(evidence.evidenceType)}
                          <div className="min-w-0">
                            <span
                              onClick={() => onSelectEvidence(evidence, caseObj)}
                              className="font-bold text-slate-100 hover:text-blue-400 cursor-pointer truncate block"
                            >
                              {evidence.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">
                              {evidence.fileName} ({formatBytes(evidence.fileSize)})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-950 border border-slate-800 text-slate-300">
                          {evidence.evidenceType}
                        </span>
                      </td>

                      {/* Case */}
                      <td className="p-3 font-mono text-slate-400">
                        {evidence.investigationId}
                      </td>

                      {/* Source */}
                      <td className="p-3 text-slate-300 max-w-[140px] truncate">
                        {evidence.sourceName || evidence.sourceType || 'N/A'}
                      </td>

                      {/* Collected */}
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {evidence.collectedAt ? evidence.collectedAt.slice(0, 10) : 'N/A'}
                      </td>

                      {/* SHA-256 Hash */}
                      <td className="p-3 font-mono text-[10px] text-slate-400 max-w-[120px]">
                        <div className="flex items-center space-x-1">
                          <span className="truncate">{evidence.hash ? `${evidence.hash.slice(0, 10)}...` : 'UNHASHED'}</span>
                          {evidence.hash && (
                            <button
                              onClick={() => navigator.clipboard.writeText(evidence.hash)}
                              title="Copy SHA-256 Hash"
                              className="text-slate-500 hover:text-slate-200"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Integrity */}
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono flex items-center space-x-1 w-max ${
                            evidence.integrityStatus === 'Verified Unchanged' || evidence.status === 'Verified'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : evidence.integrityStatus === 'Changed'
                              ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                              : 'bg-slate-950 text-slate-400 border border-slate-800'
                          }`}
                        >
                          {evidence.integrityStatus === 'Verified Unchanged' || evidence.status === 'Verified' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Verified Unchanged</span>
                            </>
                          ) : evidence.integrityStatus === 'Changed' ? (
                            <>
                              <AlertTriangle className="w-3 h-3 text-red-400" />
                              <span>CHANGED</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-slate-500" />
                              <span>Not Verified</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Linked Objects */}
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-300">
                          {(evidence.relatedAccountIds || []).length + (evidence.relatedTransactionIds || []).length}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            onClick={() => handleQuickVerifyHash(evidence)}
                            disabled={isVerifying}
                            title="Recalculate SHA-256 & Verify Integrity"
                            className="p-1 rounded bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-emerald-400 border border-slate-800 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin text-emerald-400' : ''}`} />
                          </button>

                          <button
                            onClick={() => onSelectEvidence(evidence, caseObj)}
                            className="px-2.5 py-1 rounded-lg text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center space-x-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing <span className="font-mono font-bold text-slate-200">{filteredItems.length}</span> of{' '}
            <span className="font-mono font-bold text-slate-200">{evidenceItems.length}</span> total evidence records
          </div>
          {selectedIds.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-amber-400 font-bold">{selectedIds.length} Selected</span>
              <button className="px-2.5 py-1 bg-slate-900 border border-slate-800 rounded text-slate-300 font-bold hover:bg-slate-800">
                + Add to Collection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
