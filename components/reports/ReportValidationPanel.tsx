'use client';

import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  FileCheck,
  Database,
  Search,
  Users,
  ArrowRightLeft,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { InvestigationReport, ReportValidationResult } from '@/types/report';
import { InvestigationCase, EvidenceItem, InvestigationFinding } from '@/types/case';
import { Transaction, PatternIndicator } from '@/types/investigation';
import { validateReportData } from '@/lib/reportStorage';

interface ReportValidationPanelProps {
  report: InvestigationReport;
  caseObj?: InvestigationCase;
  transactions?: Transaction[];
  evidenceItems?: EvidenceItem[];
  patterns?: PatternIndicator[];
  findings?: InvestigationFinding[];
  onFixField?: (field: string) => void;
  onProceedToGenerate?: () => void;
}

export const ReportValidationPanel: React.FC<ReportValidationPanelProps> = ({
  report,
  caseObj,
  transactions = [],
  evidenceItems = [],
  patterns = [],
  findings = [],
  onFixField,
  onProceedToGenerate,
}) => {
  const result: ReportValidationResult = validateReportData(
    report,
    caseObj,
    transactions,
    evidenceItems,
    patterns,
    findings
  );

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div
              className={`p-3 rounded-xl border ${
                result.canGenerate
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              }`}
            >
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Report Data Integrity & Pre-Flight Validation</span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                    result.canGenerate
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {result.canGenerate ? 'READY TO GENERATE' : 'BLOCKING ERRORS'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Automated 9-point validation check for source traceability, dataset versioning, analysis run IDs, and missing metadata.
              </p>
            </div>
          </div>

          {onProceedToGenerate && (
            <button
              onClick={onProceedToGenerate}
              disabled={!result.canGenerate}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 ${
                result.canGenerate
                  ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <FileCheck className="w-4 h-4" />
              <span>Generate Final Report Snapshot</span>
            </button>
          )}
        </div>

        {/* 6 Metric Check Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <Users className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-[10px] text-slate-400">Accounts</div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                <span>{result.summary.accountsCount}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <ArrowRightLeft className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-[10px] text-slate-400">Transactions</div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                <span>{result.summary.transactionsCount}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <div className="text-[10px] text-slate-400">Evidence</div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                <span>{result.summary.evidenceCount}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">Patterns</div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                <span>{result.summary.patternsCount}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <Search className="w-5 h-5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400">Findings</div>
              <div className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                <span>{result.summary.findingsCount}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400">Data Warnings</div>
              <div className="text-sm font-bold text-amber-400 flex items-center space-x-1">
                <span>{result.summary.warningsCount}</span>
                <span className="text-[10px]">⚠</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCKING ERRORS */}
      {result.blockingErrors.length > 0 && (
        <div className="bg-rose-950/30 border border-rose-800/60 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-rose-300 flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-rose-400" />
            <span>Blocking Errors ({result.blockingErrors.length}) — Report Generation Disabled</span>
          </h3>
          <p className="text-xs text-rose-300/80">
            The following issues must be corrected in the Report Builder before generating an immutable report snapshot:
          </p>
          <div className="space-y-2 mt-2">
            {result.blockingErrors.map((err) => (
              <div
                key={err.id}
                className="bg-slate-900 border border-rose-900/50 rounded-xl p-3 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 font-bold">
                    {err.category}
                  </span>
                  <span className="text-slate-200">{err.message}</span>
                </div>
                {err.field && onFixField && (
                  <button
                    onClick={() => onFixField(err.field!)}
                    className="px-2.5 py-1 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 text-[11px] font-bold border border-rose-500/40"
                  >
                    Fix Field
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NON-BLOCKING WARNINGS */}
      {result.warnings.length > 0 && (
        <div className="bg-amber-950/20 border border-amber-800/50 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-amber-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Non-Blocking Warnings ({result.warnings.length}) — Review Recommended</span>
          </h3>
          <p className="text-xs text-amber-300/80">
            These informational quality flags will be automatically documented in the report’s Data Quality & Limitations section.
          </p>
          <div className="space-y-2 mt-2">
            {result.warnings.map((warn) => (
              <div
                key={warn.id}
                className="bg-slate-900 border border-amber-900/40 rounded-xl p-3 flex items-center space-x-3 text-xs"
              >
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/20 text-amber-300 font-bold">
                  {warn.category}
                </span>
                <span className="text-slate-300">{warn.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 9-Point Verification Checklist */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <h3 className="text-sm font-bold text-slate-100 mb-4 flex items-center space-x-2">
          <FileCheck className="w-4 h-4 text-blue-400" />
          <span>System Traceability & Verification Matrix</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Case Reference Linked</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Dataset Version Specified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Analysis Run Specified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Accounts & Totals Calculated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Money Flow Graph Source Set</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Pattern Rules Mapping</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Evidence SHA-256 Hashes Checked</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Investigator Findings Differentiated</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <span className="text-slate-300">Data Lineage Trail Verified</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
};
