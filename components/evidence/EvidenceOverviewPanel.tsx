'use client';

import React from 'react';
import {
  FileText,
  FileSpreadsheet,
  FileCode,
  Image as ImageIcon,
  Camera,
  ShieldCheck,
  AlertTriangle,
  Layers,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { InvestigationCase, EvidenceItem } from '@/types/case';
import { Transaction } from '@/types/investigation';
import { calculateEvidenceCoverage, validateEvidenceChain } from '@/lib/evidenceStorage';

interface EvidenceOverviewPanelProps {
  cases: InvestigationCase[];
  selectedCaseId: string;
  onSelectCase: (caseId: string) => void;
  onNavigateTab: (tab: string) => void;
  onOpenAddEvidence: () => void;
}

export const EvidenceOverviewPanel: React.FC<EvidenceOverviewPanelProps> = ({
  cases,
  selectedCaseId,
  onSelectCase,
  onNavigateTab,
  onOpenAddEvidence,
}) => {
  const activeCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  const allTxns: Transaction[] = []; // Aggregated transactions if needed
  const coverage = activeCase ? calculateEvidenceCoverage(activeCase, allTxns) : null;
  const chainResult = activeCase ? validateEvidenceChain(activeCase, allTxns) : null;

  return (
    <div className="space-y-6">
      {/* Top Controls & Case Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Cyber Evidence Center & Integrity Vault</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Traceability framework connecting original source statements to transactions, accounts, patterns, and findings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Select Case */}
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Case:</span>
            <select
              value={selectedCaseId}
              onChange={(e) => onSelectCase(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs font-bold font-mono text-blue-400 rounded-xl px-3 py-1.5 focus:border-blue-500 focus:outline-none"
            >
              <option value="ALL">All Investigations ({cases.length})</option>
              {cases.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.caseNumber} - {c.title.slice(0, 30)}...
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onOpenAddEvidence}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Evidence</span>
          </button>
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div
          onClick={() => onNavigateTab('all')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block truncate">Total Evidence</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-slate-100">{coverage?.totalEvidence || 0}</span>
            <FileText className="w-4 h-4 text-blue-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('statements')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">Bank Statements</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-emerald-400">{coverage?.statementsCount || 0}</span>
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('txns')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-purple-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block truncate">Txn Records</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-purple-400">{coverage?.transactionRecordsCount || 0}</span>
            <FileCode className="w-4 h-4 text-purple-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('media')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block truncate">Documents</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-cyan-400">{coverage?.documentsCount || 0}</span>
            <FileText className="w-4 h-4 text-cyan-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('media')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block truncate">Screenshots / Media</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-amber-400">{coverage?.imagesCount || 0}</span>
            <Camera className="w-4 h-4 text-amber-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('collections')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block truncate">Collections</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-indigo-400">2</span>
            <Layers className="w-4 h-4 text-indigo-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('integrity')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block truncate">Verified Hashes</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-emerald-400">{coverage?.verifiedIntegrityCount || 0}</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('all')}
          className="p-3 bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-colors space-y-1"
        >
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block truncate">Needs Review</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-mono font-bold text-amber-400">{coverage?.needsReviewCount || 0}</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
        </div>
      </div>

      {/* Readiness & Traceability Coverage Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Readiness Card 1 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Transaction Traceability</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{coverage?.txnCoveragePct}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${coverage?.txnCoveragePct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Percentage of case transactions mapped directly to extracted source statement rows or Nodal bank records.
          </p>
        </div>

        {/* Readiness Card 2 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Pattern Support Coverage</span>
            <span className="text-sm font-mono font-bold text-purple-400">{coverage?.indCoveragePct}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${coverage?.indCoveragePct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Pattern indicators with direct supporting statement files and verified digital evidence logs.
          </p>
        </div>

        {/* Readiness Card 3 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Finding Support Coverage</span>
            <span className="text-sm font-mono font-bold text-blue-400">{coverage?.fndCoveragePct}%</span>
          </div>
          <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${coverage?.fndCoveragePct}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400">
            Investigator legal assessment findings supported by verified chain of custody evidence items.
          </p>
        </div>
      </div>

      {/* Evidence Chain Readiness & Broken Links Summary */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <span>Evidence Chain Audit & Lineage Completeness</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated audit checking unbroken lineage from Source Statement to Final Investigator Finding.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div
              className={`px-3 py-1 rounded-full text-xs font-bold font-mono flex items-center space-x-1.5 ${
                chainResult?.isComplete
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              {chainResult?.isComplete ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>CHAIN COMPLETE (Score: {chainResult.score}/100)</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>CHAIN INCOMPLETE (Score: {chainResult?.score}/100)</span>
                </>
              )}
            </div>

            <button
              onClick={() => onNavigateTab('chain')}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 flex items-center space-x-1"
            >
              <span>View Chain Visualizer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Chain Pipeline Steps summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(chainResult?.steps || []).map((step, idx) => (
            <div
              key={step.node}
              className={`p-3 rounded-xl border space-y-1 ${
                step.status === 'Complete'
                  ? 'bg-slate-950 border-emerald-500/30'
                  : step.status === 'Partial'
                  ? 'bg-slate-950 border-amber-500/30'
                  : 'bg-slate-950 border-red-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-500 font-bold">
                <span>STEP {idx + 1}</span>
                <span className={step.status === 'Complete' ? 'text-emerald-400' : 'text-amber-400'}>
                  {step.status}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">{step.node}</h4>
              <p className="text-[10px] text-slate-400 truncate">{step.detail}</p>
            </div>
          ))}
        </div>

        {/* Broken Link Warning List if any */}
        {(chainResult?.brokenLinks || []).length > 0 && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Evidence Traceability Audit Warnings ({(chainResult?.brokenLinks || []).length})</span>
            </h4>
            <div className="space-y-1.5">
              {(chainResult?.brokenLinks || []).map((b, i) => (
                <div key={i} className="flex items-start justify-between text-xs text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold text-amber-400 uppercase">{b.from} → {b.to}</span>
                      <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        {b.severity} Severity
                      </span>
                    </div>
                    <p className="text-slate-300">{b.description}</p>
                  </div>
                  <button
                    onClick={() => onNavigateTab('all')}
                    className="text-[10px] font-bold text-blue-400 hover:underline shrink-0 ml-3"
                  >
                    Resolve Link
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
