'use client';

import React from 'react';
import {
  FileText,
  FileCheck,
  AlertTriangle,
  Clock,
  Download,
  Plus,
  ShieldCheck,
  ArrowRight,
  Database,
  Layers,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import { InvestigationReport } from '@/types/report';

interface ReportDashboardProps {
  reports: InvestigationReport[];
  onOpenCreateReport: () => void;
  onPreviewReport: (report: InvestigationReport) => void;
  onSelectReport: (report: InvestigationReport) => void;
  onNavigateTab: (tab: string) => void;
}

export const ReportDashboard: React.FC<ReportDashboardProps> = ({
  reports,
  onOpenCreateReport,
  onPreviewReport,
  onSelectReport,
  onNavigateTab,
}) => {
  const draftCount = reports.filter((r) => r.status === 'Draft').length;
  const generatedCount = reports.filter((r) => r.status === 'Generated' || r.status === 'Finalized').length;
  const underReviewCount = reports.filter((r) => r.status === 'Needs Review' || r.approvalStatus === 'Under Review').length;
  const warningsCount = reports.filter((r) => r.snapshot && r.snapshot.patternsCount > 0).length;
  const exportedCount = reports.filter((r) => r.lastExportFormat !== undefined).length;

  return (
    <div className="space-y-6">
      {/* Hero Action Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
              STEP 12 • SATARA POLICE CYBER CELL
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-xs text-slate-400 font-mono">Traceable Data Lineage Engine</span>
          </div>
          <h1 className="text-xl font-extrabold text-slate-100 tracking-tight">
            Investigation Report & Export System
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate, validate, review, and finalize structured investigation reports backed by actual transaction records, money flow graphs, analytical patterns, and SHA-256 evidence chain verification.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigateTab('templates')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-colors flex items-center justify-center space-x-2"
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Templates</span>
          </button>
          <button
            onClick={onOpenCreateReport}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Report</span>
          </button>
        </div>
      </div>

      {/* 5 CARDS REQUIRED BY SPECIFICATION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Draft Reports */}
        <div
          onClick={() => onNavigateTab('drafts')}
          className="bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-4 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Draft Reports</span>
            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-blue-500/10 text-slate-300 group-hover:text-blue-400 transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{draftCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">In-progress report drafts</span>
        </div>

        {/* Card 2: Generated Reports */}
        <div
          onClick={() => onNavigateTab('generated')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-4 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Generated Reports</span>
            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-500/10 text-slate-300 group-hover:text-emerald-400 transition-colors">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{generatedCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Immutable snapshot reports</span>
        </div>

        {/* Card 3: Reports Under Review */}
        <div
          onClick={() => onNavigateTab('all')}
          className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 p-4 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Reports Under Review</span>
            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-amber-500/10 text-slate-300 group-hover:text-amber-400 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{underReviewCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Awaiting supervisory sign-off</span>
        </div>

        {/* Card 4: Reports With Warnings */}
        <div
          onClick={() => onNavigateTab('validation')}
          className="bg-slate-900 border border-slate-800 hover:border-rose-500/50 p-4 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Reports With Warnings</span>
            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-rose-500/10 text-slate-300 group-hover:text-rose-400 transition-colors">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{warningsCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Flags requiring review</span>
        </div>

        {/* Card 5: Exported Reports */}
        <div
          onClick={() => onNavigateTab('exports')}
          className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-4 rounded-2xl transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">Exported Reports</span>
            <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-purple-500/10 text-slate-300 group-hover:text-purple-400 transition-colors">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-100 mt-2">{exportedCount}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">PDF / XLSX / CSV / JSON</span>
        </div>
      </div>

      {/* RECENT REPORTS LIST */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-400" />
            <span>Recent Active Reports</span>
          </h2>
          <button
            onClick={() => onNavigateTab('all')}
            className="text-xs text-blue-400 hover:underline font-bold flex items-center space-x-1"
          >
            <span>View All Reports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.slice(0, 4).map((report) => (
            <div
              key={report.id}
              className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold text-blue-400">{report.id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="font-mono text-[10px] text-purple-300 font-bold">{report.versionLabel}</span>
                  </div>
                  <h3 className="text-xs font-bold text-slate-100 mt-1">{report.title}</h3>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    report.status === 'Finalized'
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  {report.status}
                </span>
              </div>

              <div className="text-[11px] text-slate-400 space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800/60 font-mono">
                <div className="flex justify-between">
                  <span>Dataset: {report.datasetVersion}</span>
                  <span>Run: {report.analysisRun}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-[10px]">
                  <span>Case: {report.caseId}</span>
                  <span>By: {report.preparedBy}</span>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  onClick={() => onPreviewReport(report)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 text-xs font-bold border border-blue-500/30"
                >
                  Preview & Print
                </button>
                <button
                  onClick={() => onSelectReport(report)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                >
                  Edit Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
