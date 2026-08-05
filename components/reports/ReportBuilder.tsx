'use client';

import React, { useState } from 'react';
import {
  FileText,
  Sliders,
  Eye,
  EyeOff,
  MoveUp,
  MoveDown,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Database,
  Cpu,
  Layers,
  FileCheck,
  AlertTriangle,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  InvestigationReport,
  ReportType,
  ReportSectionConfig,
  ReportFilterConfig,
} from '@/types/report';
import { InvestigationCase, EvidenceItem, InvestigationFinding } from '@/types/case';
import { Transaction, PatternIndicator } from '@/types/investigation';
import { getDefaultReportSections, getDefaultTemplates } from '@/lib/reportStorage';
import { ReportValidationPanel } from './ReportValidationPanel';

interface ReportBuilderProps {
  initialReport?: Partial<InvestigationReport>;
  cases: InvestigationCase[];
  transactions?: Transaction[];
  evidenceItems?: EvidenceItem[];
  patterns?: PatternIndicator[];
  findings?: InvestigationFinding[];
  onSaveReport: (report: InvestigationReport, generateSnapshot: boolean) => void;
  onCancel: () => void;
  onPreviewReport: (report: InvestigationReport) => void;
}

export const ReportBuilder: React.FC<ReportBuilderProps> = ({
  initialReport,
  cases,
  transactions = [],
  evidenceItems = [],
  patterns = [],
  findings = [],
  onSaveReport,
  onCancel,
  onPreviewReport,
}) => {
  const [activeTab, setActiveTab] = useState<'configure' | 'sections' | 'validation'>('configure');

  const [caseId, setCaseId] = useState<string>(initialReport?.caseId || cases[0]?.id || 'CYBER-2026-00001');
  const [title, setTitle] = useState<string>(
    initialReport?.title || 'Comprehensive Financial Investigation & Fraud Routing Analysis'
  );
  const [reportType, setReportType] = useState<ReportType>(
    initialReport?.reportType || 'Comprehensive Investigation Report'
  );
  const [description, setDescription] = useState<string>(
    initialReport?.description ||
      'Detailed analytical investigation report covering bank statement analysis, fund routing nodes, ATM cash liquidity events, and SHA-256 evidence chain.'
  );

  const [datasetVersion, setDatasetVersion] = useState<string>(initialReport?.datasetVersion || 'Dataset V04');
  const [analysisRun, setAnalysisRun] = useState<string>(initialReport?.analysisRun || 'RUN-00042');
  const [templateId, setTemplateId] = useState<string>(initialReport?.templateId || 'TPL-001');

  const [dateRange, setDateRange] = useState({
    start: initialReport?.dateRange?.start || '2026-08-01',
    end: initialReport?.dateRange?.end || '2026-08-05',
  });

  const [sections, setSections] = useState<ReportSectionConfig[]>(
    initialReport?.sections && initialReport.sections.length > 0
      ? initialReport.sections
      : getDefaultReportSections()
  );

  const [filters, setFilters] = useState<ReportFilterConfig>({
    direction: initialReport?.filters?.direction || 'ALL',
    maskAccountNumbers: initialReport?.filters?.maskAccountNumbers ?? true,
    graphHopDepth: initialReport?.filters?.graphHopDepth || 2,
  });

  const [confidentialityLabel, setConfidentialityLabel] = useState<string>(
    initialReport?.confidentialityLabel || 'Investigation Material'
  );
  const [investigatorRemarks, setInvestigatorRemarks] = useState<string>(
    initialReport?.investigatorRemarks || ''
  );

  // Apply template configuration
  const handleApplyTemplate = (tplId: string) => {
    setTemplateId(tplId);
    const templates = getDefaultTemplates();
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl) {
      setReportType(tpl.reportType);
      setSections(tpl.sections);
      setFilters(tpl.defaultFilters);
    }
  };

  // Section visibility toggle
  const toggleSectionVisibility = (secId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, visible: !s.visible } : s))
    );
  };

  // Move section up/down
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === sections.length - 1)) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;
    // Re-assign order indices
    setSections(newSections.map((s, idx) => ({ ...s, order: idx + 1 })));
  };

  // Build current report object state
  const currentReportState: InvestigationReport = {
    id: initialReport?.id || 'RPT-2026-000001',
    caseId,
    title,
    reportType,
    description,
    version: initialReport?.version || 1,
    versionLabel: initialReport?.versionLabel || 'V1',
    status: initialReport?.status || 'Draft',
    approvalStatus: initialReport?.approvalStatus || 'Not Reviewed',
    datasetVersion,
    analysisRun,
    templateId,
    dateRange,
    sections,
    filters,
    confidentialityLabel,
    investigatorRemarks,
    preparedBy: initialReport?.preparedBy || 'Investigator Cyber Cell',
    createdAt: initialReport?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleSaveDraft = () => {
    onSaveReport(currentReportState, false);
  };

  const handleGenerate = () => {
    onSaveReport({ ...currentReportState, status: 'Generated' }, true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Investigation Report Builder</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {currentReportState.id}
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure dataset versions, analysis runs, section ordering, and filter thresholds for immutable reporting.
            </p>
          </div>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('configure')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'configure' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            1. Report Meta & Dataset
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors ${
              activeTab === 'sections' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            2. Sections & Reordering ({sections.filter((s) => s.visible).length}/{sections.length})
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3.5 py-1.5 rounded-lg transition-colors flex items-center space-x-1 ${
              activeTab === 'validation' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>3. Data Validation</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CONFIGURE META & DATASET */}
      {activeTab === 'configure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-blue-400" />
                <span>Basic Report Information</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Report Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                    placeholder="Enter descriptive report title..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Target Investigation Case</label>
                    <select
                      value={caseId}
                      onChange={(e) => setCaseId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                    >
                      {cases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Report Type</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as ReportType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value="Comprehensive Investigation Report">Comprehensive Investigation Report</option>
                      <option value="Financial Transaction Analysis">Financial Transaction Analysis</option>
                      <option value="Money Flow Report">Money Flow Report</option>
                      <option value="Account Analysis">Account Analysis</option>
                      <option value="Pattern Analysis">Pattern Analysis</option>
                      <option value="Evidence Summary">Evidence Summary</option>
                      <option value="Timeline Report">Timeline Report</option>
                      <option value="Custom Investigation Report">Custom Investigation Report</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Description & Purpose</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* DATASET VERSION & ANALYSIS RUN SELECTION */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Database className="w-4 h-4 text-purple-400" />
                <span>Report Dataset & Analysis Run Binding</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1.5">
                    <span>Normalized Dataset Version</span>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">*REQUIRED</span>
                  </label>
                  <select
                    value={datasetVersion}
                    onChange={(e) => setDatasetVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-500"
                  >
                    <option value="Dataset V04">Dataset V04 (Current Normalized Master)</option>
                    <option value="Dataset V03">Dataset V03 (Previous Batch Import)</option>
                    <option value="Dataset V02">Dataset V02 (Initial Statement Parse)</option>
                    <option value="Dataset V01">Dataset V01 (Raw Imports)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center space-x-1.5">
                    <span>Pattern Engine Analysis Run</span>
                    <span className="text-[10px] text-purple-400 font-mono font-bold">*REQUIRED</span>
                  </label>
                  <select
                    value={analysisRun}
                    onChange={(e) => setAnalysisRun(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-cyan-300 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  >
                    <option value="RUN-00042">RUN-00042 (Completed 05 Aug 2026)</option>
                    <option value="RUN-00041">RUN-00041 (Completed 04 Aug 2026)</option>
                    <option value="RUN-00040">RUN-00040 (Completed 03 Aug 2026)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center space-x-3">
                <Cpu className="w-5 h-5 text-blue-400 shrink-0" />
                <span>
                  The report generator locks to the chosen dataset version and analysis run, preserving exact data lineage back to original statement files.
                </span>
              </div>
            </div>

            {/* INVESTIGATOR REMARKS & DISCLAIMERS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Investigator Remarks & Confidentiality Header</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Investigator Remarks & Analytical Conclusions
                  </label>
                  <textarea
                    rows={3}
                    value={investigatorRemarks}
                    onChange={(e) => setInvestigatorRemarks(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="Enter explicit investigator remarks (clearly distinguished from system-generated observations)..."
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Confidentiality Label</label>
                    <input
                      type="text"
                      value={confidentialityLabel}
                      onChange={(e) => setConfidentialityLabel(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Money Flow Hop Depth</label>
                    <select
                      value={filters.graphHopDepth || 2}
                      onChange={(e) =>
                        setFilters({ ...filters, graphHopDepth: parseInt(e.target.value, 10) as 1 | 2 | 3 })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>1 Hop (Direct Counterparties Only)</option>
                      <option value={2}>2 Hops (Primary + Secondary Mule Layer)</option>
                      <option value={3}>3 Hops (Full Multi-Hop Network Topology)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR: TEMPLATES & SNAPSHOT QUICK ACTIONS */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2 border-b border-slate-800 pb-3">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Pre-Built Report Templates</span>
              </h3>

              <div className="space-y-2 text-xs">
                {getDefaultTemplates().map((tpl) => (
                  <button
                    key={tpl.id}
                    onClick={() => handleApplyTemplate(tpl.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      templateId === tpl.id
                        ? 'bg-blue-600/20 border-blue-500/50 text-slate-100 font-semibold'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{tpl.title}</span>
                      {templateId === tpl.id && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* PRIVACY MASKING TOGGLE */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-100">Privacy & Masking Controls</h3>
              <label className="flex items-center space-x-3 p-3 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.maskAccountNumbers}
                  onChange={(e) => setFilters({ ...filters, maskAccountNumbers: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-0"
                />
                <span className="text-xs text-slate-200">
                  Mask sensitive account numbers in report tables (e.g., XXXXXX1234)
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SECTIONS REORDERING & VISIBILITY */}
      {activeTab === 'sections' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Report Section Structure & Ordering</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Drag or use arrow buttons to reorder sections. Toggle visibility to include or exclude specific report chapters.
              </p>
            </div>
            <button
              onClick={() => setSections(getDefaultReportSections())}
              className="px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-800 flex items-center space-x-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default Sections</span>
            </button>
          </div>

          <div className="space-y-2 max-w-3xl">
            {sections.map((sec, idx) => (
              <div
                key={sec.id}
                className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                  sec.visible
                    ? 'bg-slate-950 border-slate-800 text-slate-200'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-center font-mono text-xs font-bold text-slate-400">{idx + 1}</span>
                  <div>
                    <span className="text-xs font-bold block">{sec.title}</span>
                    <span className="text-[11px] text-slate-400 block">{sec.description}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => moveSection(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    <MoveUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => moveSection(idx, 'down')}
                    disabled={idx === sections.length - 1}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 disabled:opacity-30"
                  >
                    <MoveDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleSectionVisibility(sec.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1 border ${
                      sec.visible
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {sec.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{sec.visible ? 'Visible' : 'Hidden'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DATA VALIDATION */}
      {activeTab === 'validation' && (
        <ReportValidationPanel
          report={currentReportState}
          caseObj={cases.find((c) => c.id === caseId)}
          transactions={transactions}
          evidenceItems={evidenceItems}
          patterns={patterns}
          findings={findings}
          onFixField={(f) => setActiveTab('configure')}
          onProceedToGenerate={handleGenerate}
        />
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSaveDraft}
            className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 text-xs font-bold border border-slate-800 transition-colors"
          >
            Save Draft
          </button>
          <button
            onClick={() => onPreviewReport(currentReportState)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors flex items-center space-x-1.5"
          >
            <Eye className="w-4 h-4" />
            <span>Preview Report</span>
          </button>
          <button
            onClick={handleGenerate}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md flex items-center space-x-2 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            <span>Generate Final Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
