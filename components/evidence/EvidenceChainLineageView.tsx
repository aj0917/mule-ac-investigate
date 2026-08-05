'use client';

import React, { useState } from 'react';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  FileText,
  FileSpreadsheet,
  ArrowRightLeft,
  Users,
  Shield,
  Briefcase,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { InvestigationCase, EvidenceItem } from '@/types/case';
import { Transaction } from '@/types/investigation';
import { validateEvidenceChain, ChainValidationResult } from '@/lib/evidenceStorage';

interface EvidenceChainLineageViewProps {
  caseObj: InvestigationCase;
  allTransactions: Transaction[];
  onOpenEvidenceDetail: (ev: EvidenceItem) => void;
  onOpenAccount: (accId: string) => void;
}

export const EvidenceChainLineageView: React.FC<EvidenceChainLineageViewProps> = ({
  caseObj,
  allTransactions,
  onOpenEvidenceDetail,
  onOpenAccount,
}) => {
  const [chainResult, setChainResult] = useState<ChainValidationResult>(() =>
    validateEvidenceChain(caseObj, allTransactions)
  );
  const [isValidating, setIsValidating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const handleValidateChain = () => {
    setIsValidating(true);
    setTimeout(() => {
      const res = validateEvidenceChain(caseObj, allTransactions);
      setChainResult(res);
      setIsValidating(false);
    }, 400);
  };

  const nodeIcons = {
    'Source File': <FileSpreadsheet className="w-5 h-5 text-emerald-400" />,
    'Evidence': <FileText className="w-5 h-5 text-blue-400" />,
    'Dataset': <Layers className="w-5 h-5 text-purple-400" />,
    'Transaction': <ArrowRightLeft className="w-5 h-5 text-indigo-400" />,
    'Account': <Users className="w-5 h-5 text-cyan-400" />,
    'Pattern': <Shield className="w-5 h-5 text-amber-400" />,
    'Finding': <Briefcase className="w-5 h-5 text-emerald-400" />,
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Layers className="w-5 h-5 text-purple-400" />
            <span>Investigation Evidence Chain & Data Provenance Lineage</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end chain verification tracing raw source files to normalized transactions, pattern algorithms, and legal findings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono flex items-center space-x-2 ${
              chainResult.isComplete
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            {chainResult.isComplete ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>CHAIN COMPLETE ({chainResult.score}/100)</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4" />
                <span>CHAIN INCOMPLETE ({chainResult.score}/100)</span>
              </>
            )}
          </div>

          <button
            onClick={handleValidateChain}
            disabled={isValidating}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center space-x-2 shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span>Validate Chain</span>
          </button>
        </div>
      </div>

      {/* Visual Interactive Pipeline Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Traceability Chain Pipeline Topology
          </span>
          <span className="text-[10px] font-mono text-slate-500">Case: {caseObj.caseNumber}</span>
        </div>

        {/* Pipeline Nodes Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 relative">
          {chainResult.steps.map((step, idx) => {
            const isSelected = selectedNode === step.node;
            return (
              <div
                key={step.node}
                onClick={() => setSelectedNode(step.node)}
                className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 relative ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500 shadow-lg shadow-purple-950/40'
                    : step.status === 'Complete'
                    ? 'bg-slate-950 border-emerald-500/30 hover:border-emerald-500/60'
                    : 'bg-slate-950 border-amber-500/30 hover:border-amber-500/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold font-mono text-purple-400">STEP {idx + 1}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-bold rounded uppercase ${
                      step.status === 'Complete' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                    }`}
                  >
                    {step.status}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {nodeIcons[step.node]}
                  <h4 className="text-xs font-bold text-slate-100 truncate">{step.node}</h4>
                </div>

                <div className="text-[11px] font-mono font-bold text-slate-300">
                  {step.count} Records
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-2">{step.detail}</p>
              </div>
            );
          })}
        </div>

        {/* Broken Link Warnings */}
        {chainResult.brokenLinks.length > 0 && (
          <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
            <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5 uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Chain Integrity Warnings ({chainResult.brokenLinks.length})</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {chainResult.brokenLinks.map((b, i) => (
                <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-400">{b.from} → {b.to}</span>
                    <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-500/20 text-amber-300">
                      {b.severity}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Node Detail Breakdown */}
      {selectedNode && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            {nodeIcons[selectedNode as keyof typeof nodeIcons]}
            <span>Node Details: {selectedNode}</span>
          </h3>

          {selectedNode === 'Evidence' && (
            <div className="space-y-2">
              {(caseObj.evidenceItems || []).map((ev) => (
                <div key={ev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-blue-400">{ev.evidenceNumber}</span>
                    <span className="text-slate-200 font-semibold ml-2">{ev.title}</span>
                  </div>
                  <button
                    onClick={() => onOpenEvidenceDetail(ev)}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    View Source Evidence
                  </button>
                </div>
              ))}
            </div>
          )}

          {selectedNode === 'Account' && (
            <div className="space-y-2">
              {(caseObj.accounts || []).map((acc) => (
                <div key={acc.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-mono font-bold text-cyan-400">{acc.accountNumberMasked}</span>
                    <span className="text-slate-200 font-semibold ml-2">{acc.bankName}</span>
                  </div>
                  <button
                    onClick={() => onOpenAccount(acc.accountId)}
                    className="text-cyan-400 font-bold hover:underline"
                  >
                    Open Intelligence
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
