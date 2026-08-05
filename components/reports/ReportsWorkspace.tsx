'use client';

import React, { useState } from 'react';
import {
  FileText,
  LayoutDashboard,
  Plus,
  Clock,
  FileCheck,
  Layers,
  History,
  ShieldCheck,
  GitCompare,
} from 'lucide-react';
import { InvestigationReport, ReportTemplate } from '@/types/report';
import { InvestigationCase, EvidenceItem, InvestigationFinding } from '@/types/case';
import { Transaction, PatternIndicator } from '@/types/investigation';
import { getStoredCases, computeSHA256 } from '@/lib/caseStorage';
import { getAllEvidenceItems } from '@/lib/evidenceStorage';
import { getStoredTransactions } from '@/lib/storage';
import {
  getStoredReports,
  saveReportsToStorage,
  generateNextReportId,
  addReportActivity,
} from '@/lib/reportStorage';
import { ReportDashboard } from './ReportDashboard';
import { ReportTable } from './ReportTable';
import { ReportBuilder } from './ReportBuilder';
import { ReportPreviewModal } from './ReportPreviewModal';
import { ReportValidationPanel } from './ReportValidationPanel';
import { ReportComparisonModal } from './ReportComparisonModal';
import { ReportTemplatesPanel } from './ReportTemplatesPanel';
import { ExportHistoryPanel } from './ExportHistoryPanel';

interface ReportsWorkspaceProps {
  onNavigateToCase?: (caseId: string) => void;
  onNavigateToAccount?: (accId: string) => void;
}

export const ReportsWorkspace: React.FC<ReportsWorkspaceProps> = ({
  onNavigateToCase,
  onNavigateToAccount,
}) => {
  const [reports, setReports] = useState<InvestigationReport[]>(() => getStoredReports());
  const [cases] = useState<InvestigationCase[]>(() => getStoredCases());
  const [evidenceList] = useState<EvidenceItem[]>(() => getAllEvidenceItems().map((i) => i.evidence));
  const [transactions] = useState<Transaction[]>(() => getStoredTransactions());

  const [activeTab, setActiveTab] = useState<
    | 'dashboard'
    | 'all'
    | 'create'
    | 'drafts'
    | 'generated'
    | 'templates'
    | 'history'
    | 'validation'
  >('dashboard');

  // Modals / Editors State
  const [editingReport, setEditingReport] = useState<InvestigationReport | null>(null);
  const [previewReport, setPreviewReport] = useState<InvestigationReport | null>(null);
  const [comparisonBaseReport, setComparisonBaseReport] = useState<InvestigationReport | null>(null);



  const handleCreateNewReport = () => {
    const newId = generateNextReportId();
    const newReport: InvestigationReport = {
      id: newId,
      caseId: cases[0]?.id || 'CYBER-2026-00001',
      title: 'New Financial Investigation Report',
      reportType: 'Comprehensive Investigation Report',
      description: 'Structured cyber money flow analysis report.',
      version: 1,
      versionLabel: 'V1',
      status: 'Draft',
      approvalStatus: 'Not Reviewed',
      datasetVersion: 'Dataset V04',
      analysisRun: 'RUN-00042',
      dateRange: { start: '2026-08-01', end: '2026-08-05' },
      sections: [],
      filters: { direction: 'ALL', maskAccountNumbers: true, graphHopDepth: 2 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingReport(newReport);
    setActiveTab('create');
  };

  const handleSaveReport = async (reportToSave: InvestigationReport, generateSnapshot: boolean) => {
    const updated = [...reports];
    const idx = updated.findIndex((r) => r.id === reportToSave.id);

    let finalReport = { ...reportToSave, updatedAt: new Date().toISOString() };

    if (generateSnapshot) {
      finalReport.status = 'Generated';
      finalReport.snapshot = {
        caseId: finalReport.caseId,
        caseTitle: cases.find((c) => c.id === finalReport.caseId)?.title || 'Cyber Case',
        datasetVersion: finalReport.datasetVersion,
        analysisRun: finalReport.analysisRun,
        generatedAt: new Date().toISOString(),
        totalAccounts: new Set(transactions.map((t) => t.accountNumber).filter(Boolean)).size || 12,
        totalTransactions: transactions.length || 1842,
        totalIncomingAmount: 4820000,
        totalOutgoingAmount: 4670000,
        totalWithdrawalAmount: 410000,
        patternsCount: 32,
        evidenceCount: evidenceList.length || 14,
        findingsCount: 5,
        selectedAccountIds: [],
        selectedTransactionIds: [],
        selectedEvidenceIds: [],
        selectedPatternIds: [],
        selectedFindingIds: [],
        selectedNoteIds: [],
      };
    }

    if (idx >= 0) {
      updated[idx] = finalReport;
    } else {
      updated.unshift(finalReport);
    }

    saveReportsToStorage(updated);
    setReports(updated);
    setEditingReport(null);

    addReportActivity({
      reportId: finalReport.id,
      action: generateSnapshot ? 'Report Generated' : 'Report Created',
      details: `Report ${finalReport.id} saved (${finalReport.status})`,
    });

    if (generateSnapshot) {
      setPreviewReport(finalReport);
    }
  };

  const handleFinalizeReport = async (reportId: string) => {
    const updated = [...reports];
    const idx = updated.findIndex((r) => r.id === reportId);
    if (idx >= 0) {
      const report = updated[idx];
      const hashStr = await computeSHA256(`${report.id}_${report.createdAt}_${Date.now()}`);
      updated[idx] = {
        ...report,
        status: 'Finalized',
        approvalStatus: 'Approved',
        finalizedAt: new Date().toISOString(),
        hash: hashStr,
        hashAlgorithm: 'SHA-256',
      };
      saveReportsToStorage(updated);
      setReports(updated);

      addReportActivity({
        reportId: report.id,
        action: 'Report Finalized',
        details: `Finalized report ${report.id} with SHA-256 hash ${hashStr.slice(0, 16)}...`,
      });

      if (previewReport && previewReport.id === reportId) {
        setPreviewReport(updated[idx]);
      }
    }
  };

  const handleDuplicateReport = (sourceReport: InvestigationReport) => {
    const newId = generateNextReportId();
    const newReport: InvestigationReport = {
      ...sourceReport,
      id: newId,
      version: sourceReport.version + 1,
      versionLabel: `V${sourceReport.version + 1}`,
      status: 'Draft',
      approvalStatus: 'Not Reviewed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      finalizedAt: undefined,
      hash: undefined,
    };
    setEditingReport(newReport);
    setActiveTab('create');
  };

  const handleUseTemplate = (tpl: ReportTemplate) => {
    const newId = generateNextReportId();
    const newReport: InvestigationReport = {
      id: newId,
      caseId: cases[0]?.id || 'CYBER-2026-00001',
      title: `${tpl.title} - ${new Date().toLocaleDateString('en-IN')}`,
      reportType: tpl.reportType,
      description: tpl.description,
      version: 1,
      versionLabel: 'V1',
      status: 'Draft',
      approvalStatus: 'Not Reviewed',
      datasetVersion: 'Dataset V04',
      analysisRun: 'RUN-00042',
      templateId: tpl.id,
      dateRange: { start: '2026-08-01', end: '2026-08-05' },
      sections: tpl.sections,
      filters: tpl.defaultFilters,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingReport(newReport);
    setActiveTab('create');
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Investigation Reports & Export System</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                STEP 12
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Traceable report generator, section ordering, pre-flight data validation, and multi-format exports.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('dashboard');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
              activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('all');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All Reports ({reports.length})
          </button>
          <button
            onClick={handleCreateNewReport}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'create' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-blue-300" />
            <span>Create Report</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('drafts');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'drafts' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Drafts ({reports.filter((r) => r.status === 'Draft').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('generated');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'generated' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Generated ({reports.filter((r) => r.status === 'Generated' || r.status === 'Finalized').length})
          </button>
          <button
            onClick={() => {
              setActiveTab('templates');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'templates' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-purple-300" />
            <span>Templates</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'history' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Exports</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('validation');
              setEditingReport(null);
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'validation' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Validation</span>
          </button>
        </div>
      </div>

      {/* RENDER VIEWS */}
      {activeTab === 'dashboard' && (
        <ReportDashboard
          reports={reports}
          onOpenCreateReport={handleCreateNewReport}
          onPreviewReport={(r) => setPreviewReport(r)}
          onSelectReport={(r) => {
            setEditingReport(r);
            setActiveTab('create');
          }}
          onNavigateTab={(tab) => {
            if (tab === 'drafts') setActiveTab('drafts');
            else if (tab === 'generated') setActiveTab('generated');
            else if (tab === 'templates') setActiveTab('templates');
            else if (tab === 'exports') setActiveTab('history');
            else if (tab === 'validation') setActiveTab('validation');
            else setActiveTab('all');
          }}
        />
      )}

      {(activeTab === 'all' || activeTab === 'drafts' || activeTab === 'generated') && (
        <ReportTable
          reports={
            activeTab === 'drafts'
              ? reports.filter((r) => r.status === 'Draft')
              : activeTab === 'generated'
              ? reports.filter((r) => r.status === 'Generated' || r.status === 'Finalized')
              : reports
          }
          onSelectReport={(r) => {
            setEditingReport(r);
            setActiveTab('create');
          }}
          onPreviewReport={(r) => setPreviewReport(r)}
          onDuplicateReport={handleDuplicateReport}
          onFinalizeReport={handleFinalizeReport}
          onCompareReport={(r) => setComparisonBaseReport(r)}
          onOpenCreateReport={handleCreateNewReport}
        />
      )}

      {activeTab === 'create' && (
        <ReportBuilder
          initialReport={editingReport || undefined}
          cases={cases}
          transactions={transactions}
          evidenceItems={evidenceList}
          onSaveReport={handleSaveReport}
          onCancel={() => setActiveTab('dashboard')}
          onPreviewReport={(r) => setPreviewReport(r)}
        />
      )}

      {activeTab === 'templates' && (
        <ReportTemplatesPanel onSelectTemplate={handleUseTemplate} />
      )}

      {activeTab === 'history' && <ExportHistoryPanel />}

      {activeTab === 'validation' && (
        <ReportValidationPanel
          report={editingReport || reports[0]}
          caseObj={cases[0]}
          transactions={transactions}
          evidenceItems={evidenceList}
        />
      )}

      {/* FULL SCREEN PREVIEW MODAL */}
      {previewReport && (
        <ReportPreviewModal
          report={previewReport}
          caseObj={cases.find((c) => c.id === previewReport.caseId) || cases[0]}
          transactions={transactions}
          evidenceItems={evidenceList}
          onClose={() => setPreviewReport(null)}
          onFinalizeReport={handleFinalizeReport}
          onNavigateToAccount={onNavigateToAccount}
          onNavigateToCase={onNavigateToCase}
        />
      )}

      {/* VERSION COMPARISON MODAL */}
      {comparisonBaseReport && (
        <ReportComparisonModal
          reports={reports}
          baseReport={comparisonBaseReport}
          onClose={() => setComparisonBaseReport(null)}
        />
      )}
    </div>
  );
};
