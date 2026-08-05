'use client';

import React, { useState } from 'react';
import {
  Search,
  Plus,
  Filter,
  Shield,
  Clock,
  User,
  AlertTriangle,
  FileText,
  Users,
  ArrowRightLeft,
  Briefcase,
  ChevronRight,
  Download,
} from 'lucide-react';
import { InvestigationCase, CaseStatus, CasePriority } from '@/types/case';
import { getStoredCases } from '@/lib/caseStorage';

interface CaseListProps {
  onSelectCase: (caseObj: InvestigationCase) => void;
  onCreateNewCase: () => void;
}

export const CaseList: React.FC<CaseListProps> = ({ onSelectCase, onCreateNewCase }) => {
  const [cases] = useState<InvestigationCase[]>(() => getStoredCases());

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [assignedOfficerFilter, setAssignedOfficerFilter] = useState<string>('ALL');
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');

  // Filter logic
  const filteredCases = cases.filter((c) => {
    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = c.caseNumber.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchOfficer = c.assignedInvestigator.toLowerCase().includes(q);
      const matchRef = (c.referenceNumber || '').toLowerCase().includes(q);
      if (!matchId && !matchTitle && !matchOfficer && !matchRef) return false;
    }

    // Status
    if (selectedStatus !== 'ALL' && c.status !== selectedStatus) return false;

    // Priority
    if (selectedPriority !== 'ALL' && c.priority !== selectedPriority) return false;

    // Officer
    if (assignedOfficerFilter !== 'ALL' && c.assignedInvestigator !== assignedOfficerFilter) {
      return false;
    }

    return true;
  });

  // Unique officers
  const officers = Array.from(new Set(cases.map((c) => c.assignedInvestigator))).filter(Boolean);

  const getStatusBadgeClass = (status: CaseStatus) => {
    switch (status) {
      case 'Under Investigation':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Open':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Evidence Review':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Awaiting Action':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
      case 'Closed':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'Archived':
        return 'bg-slate-800 text-slate-500 border-slate-700';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getPriorityBadgeClass = (priority: CasePriority) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'High':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Medium':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Low':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">
              <Shield className="w-4 h-4" />
              <span>Satara Police Cyber Crime Cell</span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
              Investigation Cases & Evidence Workspace
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Centralized cyber money flow investigation workspace linking bank statements, accounts, transactions, money flow graphs, pattern indicators, evidence vault, and investigator findings.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <button
              onClick={() => alert('Exporting case index (CSV format placeholder)')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export Cases</span>
            </button>
            <button
              onClick={onCreateNewCase}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Investigation</span>
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Total Investigations
            </span>
            <div className="text-lg font-mono font-bold text-slate-100 mt-0.5">
              {cases.length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
              Active Cases
            </span>
            <div className="text-lg font-mono font-bold text-blue-400 mt-0.5">
              {cases.filter((c) => c.status === 'Under Investigation' || c.status === 'Open').length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
              High / Critical Priority
            </span>
            <div className="text-lg font-mono font-bold text-amber-400 mt-0.5">
              {cases.filter((c) => c.priority === 'High' || c.priority === 'Critical').length}
            </div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
            <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
              Total Linked Evidence
            </span>
            <div className="text-lg font-mono font-bold text-purple-400 mt-0.5">
              {cases.reduce((sum, c) => sum + (c.evidenceItems?.length || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-3">
          {/* Sub Navigation */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Investigations ({cases.length})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'my'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              My Cases (PI V. R. Kadam)
            </button>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Case ID, Title, Officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Case Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Evidence Review">Evidence Review</option>
              <option value="Awaiting Action">Awaiting Action</option>
              <option value="Closed">Closed</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Assigned Officer
            </label>
            <select
              value={assignedOfficerFilter}
              onChange={(e) => setAssignedOfficerFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Officers</option>
              {officers.map((off) => (
                <option key={off} value={off}>
                  {off}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Active Case Records ({filteredCases.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Click any row to open full Case Workspace
          </span>
        </div>

        {filteredCases.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Briefcase className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-400">No investigation cases match your filters.</p>
            <button
              onClick={onCreateNewCase}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20"
            >
              Create New Investigation Case
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Case ID</th>
                  <th className="py-3 px-4">Case Title</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4 text-center">Accounts</th>
                  <th className="py-3 px-4 text-center">Txns</th>
                  <th className="py-3 px-4 text-center">Indicators</th>
                  <th className="py-3 px-4 text-center">Evidence</th>
                  <th className="py-3 px-4">Assigned Officer</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCase(c)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {c.caseNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100 max-w-xs truncate">
                      {c.title}
                      <span className="block text-[10px] text-slate-400 font-normal truncate">
                        {c.caseType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-lg border ${getStatusBadgeClass(
                          c.status
                        )}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getPriorityBadgeClass(
                          c.priority
                        )}`}
                      >
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                      {c.accounts?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-300">
                      {c.transactions?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-amber-400 font-bold">
                      {c.indicators?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-purple-400 font-bold">
                      {c.evidenceItems?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 whitespace-nowrap">
                      {c.assignedInvestigator}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {c.createdAt ? c.createdAt.slice(0, 10) : '2026-07-30'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center space-x-1 text-xs font-semibold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        <span>Workspace</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
