'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  Copy,
  CheckCircle2,
  Lock,
  Download,
  Trash2,
  FileCheck,
  MoreVertical,
  ExternalLink,
  ShieldCheck,
  Calendar,
} from 'lucide-react';
import { InvestigationReport, ReportType, ReportStatus } from '@/types/report';

interface ReportTableProps {
  reports: InvestigationReport[];
  onSelectReport: (report: InvestigationReport) => void;
  onPreviewReport: (report: InvestigationReport) => void;
  onDuplicateReport?: (report: InvestigationReport) => void;
  onFinalizeReport?: (reportId: string) => void;
  onArchiveReport?: (reportId: string) => void;
  onCompareReport?: (report: InvestigationReport) => void;
  onOpenCreateReport?: () => void;
}

export const ReportTable: React.FC<ReportTableProps> = ({
  reports,
  onSelectReport,
  onPreviewReport,
  onDuplicateReport,
  onFinalizeReport,
  onArchiveReport,
  onCompareReport,
  onOpenCreateReport,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.caseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reportType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesType = typeFilter === 'ALL' || r.reportType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden space-y-0">
      {/* Toolbar & Filters */}
      <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Report ID, Case ID, Title, Account..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Generating">Generating</option>
            <option value="Generated">Generated</option>
            <option value="Needs Review">Needs Review</option>
            <option value="Finalized">Finalized</option>
            <option value="Archived">Archived</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Types</option>
            <option value="Comprehensive Investigation Report">Comprehensive</option>
            <option value="Financial Transaction Analysis">Transaction Analysis</option>
            <option value="Money Flow Report">Money Flow</option>
            <option value="Account Analysis">Account Analysis</option>
            <option value="Evidence Summary">Evidence Summary</option>
          </select>

          {onOpenCreateReport && (
            <button
              onClick={onOpenCreateReport}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-sm whitespace-nowrap"
            >
              + Create Report
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <th className="p-3.5">Report ID</th>
              <th className="p-3.5">Case Reference</th>
              <th className="p-3.5">Report Title & Type</th>
              <th className="p-3.5">Version</th>
              <th className="p-3.5">Status</th>
              <th className="p-3.5">Dataset / Run</th>
              <th className="p-3.5">Generated By</th>
              <th className="p-3.5">Last Export</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-300">
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500 text-xs">
                  No investigation reports match your filter criteria.
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-blue-400 whitespace-nowrap">
                    {report.id}
                  </td>
                  <td className="p-3.5 font-mono text-slate-300 whitespace-nowrap">
                    {report.caseId}
                  </td>
                  <td className="p-3.5 max-w-xs">
                    <span className="font-bold text-slate-100 block truncate">{report.title}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">{report.reportType}</span>
                  </td>
                  <td className="p-3.5 font-mono text-purple-300 font-bold whitespace-nowrap">
                    {report.versionLabel}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        report.status === 'Finalized'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : report.status === 'Generated'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : report.status === 'Needs Review'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {report.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                    <div>{report.datasetVersion}</div>
                    <div className="text-[10px] text-slate-500">{report.analysisRun}</div>
                  </td>
                  <td className="p-3.5 text-slate-300 whitespace-nowrap">
                    {report.preparedBy || 'Investigator'}
                  </td>
                  <td className="p-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                    {report.lastExportFormat ? (
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono">
                        {report.lastExportFormat}
                      </span>
                    ) : (
                      'None'
                    )}
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap space-x-1">
                    <button
                      onClick={() => onPreviewReport(report)}
                      className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      title="Preview & Print Report"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectReport(report)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                      title="Edit in Report Builder"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                    {onDuplicateReport && (
                      <button
                        onClick={() => onDuplicateReport(report)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
                        title="Duplicate as New Version"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onCompareReport && (
                      <button
                        onClick={() => onCompareReport(report)}
                        className="p-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[10px] font-bold px-2 py-1"
                        title="Compare Versions"
                      >
                        Compare
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
