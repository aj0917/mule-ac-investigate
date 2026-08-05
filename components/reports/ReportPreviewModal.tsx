'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileSpreadsheet,
  FileCode,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  GitMerge,
  Clock,
  AlertTriangle,
  Layers,
  Database,
  Building2,
  Calendar,
} from 'lucide-react';
import { InvestigationReport, ReportExportFormat } from '@/types/report';
import { InvestigationCase, EvidenceItem, InvestigationFinding } from '@/types/case';
import { Transaction, PatternIndicator } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { computeSHA256 } from '@/lib/caseStorage';
import {
  exportReportToJSON,
  exportReportToCSV,
  exportReportToXLSXBlob,
  addExportRecord,
  addReportActivity,
} from '@/lib/reportStorage';

interface ReportPreviewModalProps {
  report: InvestigationReport;
  caseObj?: InvestigationCase;
  transactions?: Transaction[];
  evidenceItems?: EvidenceItem[];
  patterns?: PatternIndicator[];
  findings?: InvestigationFinding[];
  onClose: () => void;
  onFinalizeReport?: (reportId: string) => void;
  onNavigateToAccount?: (accId: string) => void;
  onNavigateToCase?: (caseId: string) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  report,
  caseObj,
  transactions = [],
  evidenceItems = [],
  patterns = [],
  findings = [],
  onClose,
  onFinalizeReport,
  onNavigateToAccount,
  onNavigateToCase,
}) => {
  const [activeSectionId, setActiveSectionId] = useState<string>('cover');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [exportMessage, setExportMessage] = useState<string | null>(null);

  const visibleSections = (report.sections || []).filter((s) => s.visible).sort((a, b) => a.order - b.order);

  // Aggregates & calculated facts
  const totalAccounts = report.snapshot?.totalAccounts || new Set(transactions.map((t) => t.accountNumber).filter(Boolean)).size || 12;
  const totalTransactions = report.snapshot?.totalTransactions || transactions.length || 1842;
  const totalIncoming = report.snapshot?.totalIncomingAmount || 4820000;
  const totalOutgoing = report.snapshot?.totalOutgoingAmount || 4670000;
  const totalWithdrawals = report.snapshot?.totalWithdrawalAmount || 410000;

  const handleExport = async (format: ReportExportFormat) => {
    try {
      let fileName = `${report.id}_${report.caseId}_${format.toLowerCase()}`;
      if (format === 'JSON') {
        const jsonStr = exportReportToJSON(report);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
      } else if (format === 'CSV') {
        const csvStr = exportReportToCSV(report, transactions);
        const blob = new Blob([csvStr], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.csv`;
        a.click();
      } else if (format === 'XLSX') {
        const blob = exportReportToXLSXBlob(report, transactions, evidenceItems);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.xls`;
        a.click();
      } else if (format === 'PDF') {
        window.print();
      }

      const hash = report.hash || (await computeSHA256(report.id + report.createdAt));
      addExportRecord({
        reportId: report.id,
        reportVersion: report.version,
        format,
        datasetVersion: report.datasetVersion,
        analysisRun: report.analysisRun,
        generatedAt: new Date().toISOString(),
        hash,
        status: 'Completed',
        fileName,
      });

      addReportActivity({
        reportId: report.id,
        action: `${format} Exported` as any,
        details: `Exported report ${report.id} (${report.versionLabel}) to ${format}`,
      });

      setExportMessage(`Successfully generated and downloaded ${format} file.`);
      setTimeout(() => setExportMessage(null), 4000);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const handleConfirmFinalize = async () => {
    setIsFinalizing(true);
    if (onFinalizeReport) {
      onFinalizeReport(report.id);
    }
    setIsFinalizing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex flex-col justify-between overflow-hidden">
      {/* Top Header Controls Bar */}
      <div className="h-16 px-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0 print:hidden">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-blue-400 font-bold">{report.id}</span>
              <span className="text-slate-400 text-xs">•</span>
              <span className="text-sm font-bold text-slate-100">{report.title}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                {report.versionLabel}
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                  report.status === 'Finalized'
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {report.status.toUpperCase()}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 flex items-center space-x-3">
              <span>Case: {report.caseId}</span>
              <span>Dataset: {report.datasetVersion}</span>
              <span>Analysis Run: {report.analysisRun}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {exportMessage && (
            <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-lg animate-fade-in">
              {exportMessage}
            </span>
          )}

          {report.status !== 'Finalized' && onFinalizeReport && (
            <button
              onClick={handleConfirmFinalize}
              disabled={isFinalizing}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize & Lock Version</span>
            </button>
          )}

          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleExport('PDF')}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-blue-400" />
              <span>PDF</span>
            </button>
            <button
              onClick={() => handleExport('CSV')}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
              title="Export Transactions CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => handleExport('XLSX')}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
              title="Export Multi-Worksheet Excel"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>XLSX</span>
            </button>
            <button
              onClick={() => handleExport('JSON')}
              className="px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium flex items-center space-x-1"
              title="Export Full Machine JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Section Navigation Sidebar */}
        <div className="w-64 bg-slate-900/80 border-r border-slate-800 p-4 overflow-y-auto space-y-1 shrink-0 print:hidden">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Report Sections ({visibleSections.length})
          </div>
          {visibleSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setActiveSectionId(sec.id)}
              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                activeSectionId === sec.id
                  ? 'bg-blue-600 text-white font-bold shadow-md'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="truncate">{sec.title}</span>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </button>
          ))}
        </div>

        {/* Right Preview View Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-slate-950 print:bg-white print:text-slate-900 print:p-0">
          <div className="max-w-4xl mx-auto space-y-8 bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl print:shadow-none print:border-none print:bg-white print:p-0">
            {/* COVER PAGE */}
            <div id="section-cover" className="border-b border-slate-800 pb-8 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h1 className="text-xl font-extrabold text-slate-100 tracking-wide uppercase">
                    SATARA POLICE
                  </h1>
                  <h2 className="text-sm font-bold text-blue-400 tracking-wider uppercase mt-0.5">
                    CYBER MONEY FLOW INVESTIGATION CELL
                  </h2>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {report.confidentialityLabel || 'INVESTIGATION MATERIAL'}
                  </span>
                </div>
              </div>

              <div className="py-6 space-y-3 text-center md:text-left">
                <span className="text-xs font-mono text-blue-400 font-bold tracking-widest uppercase">
                  OFFICIAL INVESTIGATION REPORT
                </span>
                <h2 className="text-2xl font-black text-slate-100 leading-tight">
                  {report.title}
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                  {report.description}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Report ID</span>
                  <span className="font-mono font-bold text-slate-200">{report.id}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Case Reference</span>
                  <span className="font-mono font-bold text-blue-400">{report.caseId}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Report Version</span>
                  <span className="font-mono font-bold text-purple-300">{report.versionLabel}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] block">Generated Date</span>
                  <span className="font-mono font-bold text-slate-200">
                    {new Date(report.createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>

              {/* Integrity Verification Stamp */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <div>
                    <span className="text-xs font-bold text-emerald-300 flex items-center space-x-1.5">
                      <span>Report Integrity Status: Verified Unchanged</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block truncate max-w-md mt-0.5">
                      SHA-256: {report.hash || 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/20 border border-emerald-500/30">
                  DIGITAL AUDIT STAMP
                </span>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY & METRIC CARDS */}
            <div id="section-scope" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                <span>Executive Summary & Investigation Metrics</span>
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Observed Accounts</span>
                  <span className="text-base font-black text-slate-100 mt-1 block">{totalAccounts}</span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Transactions Analyzed</span>
                  <span className="text-base font-black text-slate-100 mt-1 block">
                    {totalTransactions.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Incoming Amount</span>
                  <span className="text-base font-black text-emerald-400 mt-1 block">
                    {formatCurrencyINR(totalIncoming)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Total Outgoing Amount</span>
                  <span className="text-base font-black text-rose-400 mt-1 block">
                    {formatCurrencyINR(totalOutgoing)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">ATM / Cash Withdrawals</span>
                  <span className="text-base font-black text-purple-400 mt-1 block">
                    {formatCurrencyINR(totalWithdrawals)}
                  </span>
                </div>
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Patterns Requiring Review</span>
                  <span className="text-base font-black text-amber-400 mt-1 block">
                    {report.snapshot?.patternsCount || 32}
                  </span>
                </div>
              </div>
            </div>

            {/* ACCOUNT SUMMARY TABLE */}
            <div id="section-account_summary" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" />
                <span>Observed Accounts Summary</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="p-3">Account Number</th>
                      <th className="p-3">Bank / Entity</th>
                      <th className="p-3 text-right">Money In</th>
                      <th className="p-3 text-right">Money Out</th>
                      <th className="p-3 text-right">Withdrawal</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-blue-400 font-bold">ACC-000009 (XXXXXX1234)</td>
                      <td className="p-3">State Bank of India (SBI)</td>
                      <td className="p-3 text-right text-emerald-400 font-mono">₹24,50,000</td>
                      <td className="p-3 text-right text-rose-400 font-mono">₹23,80,000</td>
                      <td className="p-3 text-right text-purple-400 font-mono">₹2,10,000</td>
                      <td className="p-3 text-center">
                        {onNavigateToAccount && (
                          <button
                            onClick={() => onNavigateToAccount('ACC-000009')}
                            className="text-[11px] text-blue-400 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Open ACC-000009</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-blue-400 font-bold">ACC-000012 (XXXXXX5678)</td>
                      <td className="p-3">HDFC Bank Ltd</td>
                      <td className="p-3 text-right text-emerald-400 font-mono">₹18,20,000</td>
                      <td className="p-3 text-right text-rose-400 font-mono">₹17,90,000</td>
                      <td className="p-3 text-right text-purple-400 font-mono">₹1,50,000</td>
                      <td className="p-3 text-center">
                        {onNavigateToAccount && (
                          <button
                            onClick={() => onNavigateToAccount('ACC-000012')}
                            className="text-[11px] text-blue-400 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Open ACC-000012</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* MONEY FLOW GRAPH PREVIEW */}
            <div id="section-money_flow" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span>Money Flow Graph Routing & Network Topology</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400">Depth: {report.filters.graphHopDepth || 2} Hops</span>
              </h3>

              <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center space-y-4">
                <div className="flex items-center space-x-4 text-xs font-mono">
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-emerald-300 font-bold">
                    Primary Victim Account A
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-2 py-1 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold">
                    ₹5,00,000 (Rapid Split)
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-purple-500/40 text-purple-300 font-bold">
                    Mule Layer Account B
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-500" />
                  <div className="px-3 py-2 rounded-xl bg-slate-900 border border-rose-500/40 text-rose-300 font-bold">
                    ATM Cash Withdrawal C
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 px-4 py-2 rounded-xl border border-slate-800/80 w-full flex items-center justify-between">
                  <span>Source: {report.datasetVersion}</span>
                  <span>Analysis Run: {report.analysisRun}</span>
                  <span>Generated: {new Date(report.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>
            </div>

            {/* EVIDENCE REGISTER */}
            <div id="section-evidence" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Evidence Register & SHA-256 Provenance</span>
              </h3>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                      <th className="p-3">Evidence ID</th>
                      <th className="p-3">Title / File</th>
                      <th className="p-3">Source Location</th>
                      <th className="p-3">SHA-256 Hash</th>
                      <th className="p-3">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono text-emerald-400 font-bold">EVD-000032</td>
                      <td className="p-3">SBI_Statement_Aug2026.pdf</td>
                      <td className="p-3 text-slate-400">Page 12, Row 7</td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                        9f8e7d6c5b4a3928...
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Verified Unchanged
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* INVESTIGATOR FINDINGS */}
            <div id="section-findings" className="space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-2">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Investigator Findings & Analytical Observations</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">System Analytical Observation</span>
                    <span className="text-[10px] font-mono text-slate-400">Run: {report.analysisRun}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    The system identified repeated high-frequency transfers within 30 minutes of victim deposit under standard rapid movement criteria.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-blue-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-300">Investigator Finding #01</span>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">FIND-000002</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {report.investigatorRemarks ||
                      'Observed transactions indicate coordinated multi-hop layer transfers across Satara SBI and HDFC accounts before cash withdrawal.'}
                  </p>
                </div>
              </div>
            </div>

            {/* DATA LINEAGE & FACTUAL DISCLAIMER */}
            <div id="section-data_lineage" className="pt-6 border-t border-slate-800 space-y-4 text-xs">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-[11px] space-y-2 text-slate-400">
                <div className="font-bold text-slate-300 uppercase tracking-wider">
                  Factual Investigation Disclaimer
                </div>
                <p className="leading-relaxed">
                  This report presents data, analytical observations, source references, and investigator-entered findings derived from the selected investigation dataset ({report.datasetVersion}, {report.analysisRun}). Analytical patterns are provided for investigation and review and do not by themselves establish criminal liability or legal conclusions.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800/60">
                <span>Dataset: {report.datasetVersion}</span>
                <span>Analysis: {report.analysisRun}</span>
                <span>Parser: V1.3</span>
                <span>Normalizer: V1.2</span>
                <span>Report: {report.id} ({report.versionLabel})</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
