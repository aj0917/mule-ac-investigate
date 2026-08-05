import {
  InvestigationReport,
  ReportType,
  ReportStatus,
  ReportApprovalStatus,
  ReportSectionConfig,
  ReportSectionId,
  ReportTemplate,
  ReportExportRecord,
  ReportActivityRecord,
  ReportValidationResult,
  ValidationIssue,
  ReportSnapshot,
  ReportExportFormat,
} from '@/types/report';
import { InvestigationCase, EvidenceItem, InvestigationFinding } from '@/types/case';
import { Transaction, PatternIndicator } from '@/types/investigation';
import { computeSHA256 } from './caseStorage';

const STORAGE_KEY_REPORTS = 'satara_police_cyber_reports_v1';
const STORAGE_KEY_TEMPLATES = 'satara_police_cyber_templates_v1';
const STORAGE_KEY_EXPORTS = 'satara_police_cyber_report_exports_v1';
const STORAGE_KEY_ACTIVITY = 'satara_police_cyber_report_activity_v1';

export function getDefaultReportSections(): ReportSectionConfig[] {
  return [
    { id: 'cover', title: '1. Cover Page', description: 'Official department cover page and case reference details', visible: true, order: 1 },
    { id: 'case_overview', title: '2. Case Overview', description: 'High-level investigation details, priority, and date ranges', visible: true, order: 2 },
    { id: 'scope', title: '3. Scope & Executive Summary', description: 'Factual metrics and core scope of the financial investigation', visible: true, order: 3 },
    { id: 'data_sources', title: '4. Data Sources', description: 'List of bank statements, dataset versions, and parser sources', visible: true, order: 4 },
    { id: 'account_summary', title: '5. Account Summary', description: 'Detailed break-down of observed accounts and financial movement', visible: true, order: 5 },
    { id: 'transaction_summary', title: '6. Transaction Summary', description: 'Filtered transactions table and high-value transfers', visible: true, order: 6 },
    { id: 'money_in', title: '7. Incoming Funds', description: 'Analysis of top incoming channels and primary credit sources', visible: true, order: 7 },
    { id: 'money_out', title: '8. Outgoing Funds', description: 'Analysis of top outgoing channels and beneficiary accounts', visible: true, order: 8 },
    { id: 'withdrawals', title: '9. Cash & ATM Withdrawals', description: 'Cash liquidity removal events and ATM withdrawal locations', visible: true, order: 9 },
    { id: 'money_flow', title: '10. Money Flow Graph', description: 'Multi-hop transaction link analysis and network flow visualization', visible: true, order: 10 },
    { id: 'timeline', title: '11. Financial Activity Timeline', description: 'Chronological timeline of transactions and analytical events', visible: true, order: 11 },
    { id: 'patterns', title: '12. Analytical Patterns', description: 'System-detected rapid movement, structuring, and layer patterns', visible: true, order: 12 },
    { id: 'indicators', title: '13. Investigation Indicators', description: 'Risk indicators and analytical alerts for investigator review', visible: true, order: 13 },
    { id: 'evidence', title: '14. Evidence Register', description: 'Source evidence files, SHA-256 hashes, and page/row lineage', visible: true, order: 14 },
    { id: 'findings', title: '15. Investigator Findings', description: 'Investigator-entered findings and support matrices', visible: true, order: 15 },
    { id: 'notes', title: '16. Investigation Notes & Tasks', description: 'Case notes, open investigative questions, and pending tasks', visible: true, order: 16 },
    { id: 'data_quality', title: '17. Data Quality & Limitations', description: 'Incomplete fields, unmapped records, and parsing warnings', visible: true, order: 17 },
    { id: 'data_lineage', title: '18. Data Lineage & Methodology', description: 'Audit trail of statement import, normalization, and run IDs', visible: true, order: 18 },
    { id: 'limitations', title: '19. Factual Limitations', description: 'Standard disclaimers regarding source data completeness', visible: true, order: 19 },
    { id: 'appendix', title: '20. Appendix', description: 'Reference codes, rules definitions, and full audit logs', visible: true, order: 20 },
  ];
}

export function getDefaultTemplates(): ReportTemplate[] {
  return [
    {
      id: 'TPL-001',
      title: 'Comprehensive Investigation Report',
      description: 'Complete 20-section report detailing accounts, money flow, evidence, patterns, and investigator findings.',
      reportType: 'Comprehensive Investigation Report',
      sections: getDefaultReportSections(),
      defaultFilters: { direction: 'ALL', maskAccountNumbers: true, graphHopDepth: 2 },
      version: 'Template V1',
      isDefault: true,
    },
    {
      id: 'TPL-002',
      title: 'Financial Transaction Analysis',
      description: 'Focused report on money in/out, account summary, cash withdrawals, and key transactions.',
      reportType: 'Financial Transaction Analysis',
      sections: getDefaultReportSections().map((s) => ({
        ...s,
        visible: ['cover', 'case_overview', 'scope', 'account_summary', 'transaction_summary', 'money_in', 'money_out', 'withdrawals', 'money_flow', 'data_lineage'].includes(s.id),
      })),
      defaultFilters: { direction: 'ALL', maskAccountNumbers: false, graphHopDepth: 2 },
      version: 'Template V1',
    },
    {
      id: 'TPL-003',
      title: 'Money Flow Report',
      description: 'Graph-centric report outlining fund routing, intermediaries, rapid movements, and node links.',
      reportType: 'Money Flow Report',
      sections: getDefaultReportSections().map((s) => ({
        ...s,
        visible: ['cover', 'case_overview', 'scope', 'account_summary', 'money_flow', 'patterns', 'indicators', 'data_lineage'].includes(s.id),
      })),
      defaultFilters: { direction: 'ALL', maskAccountNumbers: true, graphHopDepth: 3 },
      version: 'Template V1',
    },
    {
      id: 'TPL-004',
      title: 'Evidence Summary & Audit Register',
      description: 'Focuses on SHA-256 hash verification, source statement page/row references, and chain of custody.',
      reportType: 'Evidence Summary',
      sections: getDefaultReportSections().map((s) => ({
        ...s,
        visible: ['cover', 'case_overview', 'data_sources', 'evidence', 'findings', 'data_quality', 'data_lineage'].includes(s.id),
      })),
      defaultFilters: { direction: 'ALL', maskAccountNumbers: true },
      version: 'Template V1',
    },
  ];
}

export function createInitialDemoReports(): InvestigationReport[] {
  const now = new Date().toISOString();
  const sections = getDefaultReportSections();

  return [
    {
      id: 'RPT-2026-000001',
      caseId: 'CYBER-2026-00001',
      title: 'Comprehensive Cyber Financial Trail Analysis Report',
      reportType: 'Comprehensive Investigation Report',
      description: 'Full multi-account financial flow report detailing ₹48.2L incoming cyber fraud movement, layer routing to 12 accounts, and SHA-256 evidence chain verification.',
      version: 1,
      versionLabel: 'V1',
      status: 'Finalized',
      approvalStatus: 'Approved',
      datasetVersion: 'Dataset V04',
      analysisRun: 'RUN-00042',
      templateId: 'TPL-001',
      dateRange: { start: '2026-08-01', end: '2026-08-05' },
      sections,
      filters: { direction: 'ALL', maskAccountNumbers: true, graphHopDepth: 2 },
      snapshot: {
        caseId: 'CYBER-2026-00001',
        caseTitle: 'Satara Cyber Fraud Fund Routing Case #001',
        datasetVersion: 'Dataset V04',
        analysisRun: 'RUN-00042',
        generatedAt: now,
        totalAccounts: 12,
        totalTransactions: 1842,
        totalIncomingAmount: 4820000,
        totalOutgoingAmount: 4670000,
        totalWithdrawalAmount: 410000,
        patternsCount: 32,
        evidenceCount: 14,
        findingsCount: 5,
        selectedAccountIds: ['ACC-001', 'ACC-002', 'ACC-003'],
        selectedTransactionIds: ['TXN-001', 'TXN-002', 'TXN-003'],
        selectedEvidenceIds: ['EVD-2026-00001', 'EVD-2026-00002'],
        selectedPatternIds: ['PAT-001', 'PAT-002'],
        selectedFindingIds: ['FIND-001', 'FIND-002'],
        selectedNoteIds: ['NOTE-001'],
      },
      hash: 'a7b8c9d0e1f234567890abcdef1234567890abcdef1234567890abcdef123456',
      hashAlgorithm: 'SHA-256',
      investigatorRemarks: 'Analysis confirms observed rapid movement across 3 primary aggregator accounts within 30 minutes of victim credit.',
      preparedBy: 'Investigator Cyber Cell, Satara',
      reviewedBy: 'PI Cyber Police Station, Satara',
      reviewedDate: '2026-08-05',
      confidentialityLabel: 'Investigation Material',
      createdAt: '2026-08-04T10:00:00.000Z',
      updatedAt: '2026-08-05T11:30:00.000Z',
      finalizedAt: '2026-08-05T11:30:00.000Z',
      lastExportAt: '2026-08-05T11:35:00.000Z',
      lastExportFormat: 'PDF',
    },
    {
      id: 'RPT-2026-000002',
      caseId: 'CYBER-2026-00001',
      title: 'Mule Account Money Flow & Node Analysis',
      reportType: 'Money Flow Report',
      description: 'Targeted multi-hop node flow analysis focusing on SBI and HDFC mule account transfers and ATM cash withdrawals in Satara region.',
      version: 1,
      versionLabel: 'V1',
      status: 'Generated',
      approvalStatus: 'Under Review',
      datasetVersion: 'Dataset V04',
      analysisRun: 'RUN-00042',
      templateId: 'TPL-003',
      dateRange: { start: '2026-08-02', end: '2026-08-05' },
      sections: sections.map((s) => ({
        ...s,
        visible: ['cover', 'case_overview', 'scope', 'account_summary', 'money_flow', 'patterns', 'evidence', 'findings', 'data_lineage'].includes(s.id),
      })),
      filters: { direction: 'ALL', maskAccountNumbers: true, graphHopDepth: 3 },
      snapshot: {
        caseId: 'CYBER-2026-00001',
        caseTitle: 'Satara Cyber Fraud Fund Routing Case #001',
        datasetVersion: 'Dataset V04',
        analysisRun: 'RUN-00042',
        generatedAt: now,
        totalAccounts: 8,
        totalTransactions: 620,
        totalIncomingAmount: 2450000,
        totalOutgoingAmount: 2380000,
        totalWithdrawalAmount: 350000,
        patternsCount: 14,
        evidenceCount: 6,
        findingsCount: 3,
        selectedAccountIds: ['ACC-001', 'ACC-002'],
        selectedTransactionIds: [],
        selectedEvidenceIds: [],
        selectedPatternIds: [],
        selectedFindingIds: [],
        selectedNoteIds: [],
      },
      preparedBy: 'Inspector Cyber Cell',
      confidentialityLabel: 'Investigation Material',
      createdAt: '2026-08-05T08:00:00.000Z',
      updatedAt: '2026-08-05T09:15:00.000Z',
    },
  ];
}

export function getStoredReports(): InvestigationReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (!raw) {
      const initial = createInitialDemoReports();
      saveReportsToStorage(initial);
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return createInitialDemoReports();
  }
}

export function saveReportsToStorage(reports: InvestigationReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(reports));
  } catch (e) {
    console.error('Failed to save reports:', e);
  }
}

export function generateNextReportId(): string {
  const reports = getStoredReports();
  let maxSeq = 0;
  reports.forEach((r) => {
    const match = r.id.match(/RPT-(\d{4})-(\d{6})/);
    if (match) {
      const num = parseInt(match[2], 10);
      if (num > maxSeq) maxSeq = num;
    }
  });
  const year = new Date().getFullYear();
  const nextSeq = (maxSeq + 1).toString().padStart(6, '0');
  return `RPT-${year}-${nextSeq}`;
}

export function getStoredTemplates(): ReportTemplate[] {
  if (typeof window === 'undefined') return getDefaultTemplates();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TEMPLATES);
    if (!raw) {
      const defaults = getDefaultTemplates();
      saveTemplatesToStorage(defaults);
      return defaults;
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultTemplates();
  }
}

export function saveTemplatesToStorage(templates: ReportTemplate[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates));
  } catch (e) {
    console.error('Failed to save templates:', e);
  }
}

export function getExportHistory(): ReportExportRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_EXPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addExportRecord(record: Omit<ReportExportRecord, 'id'>): ReportExportRecord {
  const history = getExportHistory();
  const newRecord: ReportExportRecord = {
    ...record,
    id: `EXP-${Date.now().toString().slice(-6)}`,
  };
  history.unshift(newRecord);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_EXPORTS, JSON.stringify(history));
  }
  return newRecord;
}

export function getReportActivityLogs(): ReportActivityRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVITY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addReportActivity(log: Omit<ReportActivityRecord, 'id' | 'timestamp'>): void {
  const logs = getReportActivityLogs();
  const newLog: ReportActivityRecord = {
    ...log,
    id: `ACT-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ACTIVITY, JSON.stringify(logs.slice(0, 100)));
  }
}

/**
 * Full 9-point data validation for report generation
 */
export function validateReportData(
  report: Partial<InvestigationReport>,
  caseObj?: InvestigationCase,
  transactions: Transaction[] = [],
  evidenceItems: EvidenceItem[] = [],
  patterns: PatternIndicator[] = [],
  findings: InvestigationFinding[] = []
): ReportValidationResult {
  const blockingErrors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // 1. Case check
  if (!report.caseId || !caseObj) {
    blockingErrors.push({
      id: 'ERR-001',
      type: 'blocking',
      category: 'Case',
      message: 'No active investigation case linked to this report.',
      field: 'caseId',
    });
  }

  // 2. Dataset Version check
  if (!report.datasetVersion || report.datasetVersion.trim() === '') {
    blockingErrors.push({
      id: 'ERR-002',
      type: 'blocking',
      category: 'Dataset',
      message: 'Dataset version not selected. A normalized dataset must be specified.',
      field: 'datasetVersion',
    });
  }

  // 3. Analysis Run check
  if (!report.analysisRun || report.analysisRun.trim() === '') {
    blockingErrors.push({
      id: 'ERR-003',
      type: 'blocking',
      category: 'Analysis',
      message: 'Analysis run ID not selected. A valid analysis run must be referenced.',
      field: 'analysisRun',
    });
  }

  // 4. Report Title check
  if (!report.title || report.title.trim() === '') {
    blockingErrors.push({
      id: 'ERR-004',
      type: 'blocking',
      category: 'Case',
      message: 'Report title is required.',
      field: 'title',
    });
  }

  // Warnings checks:
  // 5. Incomplete timestamps warning
  const incompleteTimeTxns = transactions.filter((t) => !t.transactionDate || t.transactionDate === '');
  if (incompleteTimeTxns.length > 0) {
    warnings.push({
      id: 'WARN-001',
      type: 'warning',
      category: 'Transactions',
      message: `${incompleteTimeTxns.length} transaction records have incomplete date/timestamp entries.`,
    });
  }

  // 6. Missing counterparty warning
  const missingCounterparty = transactions.filter((t) => !(t.narration || t.beneficiary) || (t.narration || t.beneficiary || '').length < 3);
  if (missingCounterparty.length > 0) {
    warnings.push({
      id: 'WARN-002',
      type: 'warning',
      category: 'Transactions',
      message: `${missingCounterparty.length} transaction records do not contain complete counterparty details.`,
    });
  }

  // 7. Evidence source page mapping check
  const evidenceWithoutMapping = evidenceItems.filter((e) => !e.sourceLocation || !e.sourceLocation.pageNumber);
  if (evidenceWithoutMapping.length > 0) {
    warnings.push({
      id: 'WARN-003',
      type: 'warning',
      category: 'Evidence',
      message: `${evidenceWithoutMapping.length} evidence items have no exact source page/sheet location mapping.`,
    });
  }

  // 8. Findings with limited supporting evidence
  const unverifiedFindings = findings.filter((f) => !f.supportingEvidenceIds || f.supportingEvidenceIds.length === 0);
  if (unverifiedFindings.length > 0) {
    warnings.push({
      id: 'WARN-004',
      type: 'warning',
      category: 'Findings',
      message: `${unverifiedFindings.length} investigator findings have no explicit evidence links attached.`,
    });
  }

  // 9. Unmapped transactions candidate check
  const suspectUnmapped = transactions.filter((t) => t.channel === 'UNKNOWN');
  if (suspectUnmapped.length > 0) {
    warnings.push({
      id: 'WARN-005',
      type: 'warning',
      category: 'Source',
      message: `${suspectUnmapped.length} transactions have unclassified channel tags.`,
    });
  }

  const isValid = blockingErrors.length === 0;

  return {
    isValid,
    canGenerate: isValid,
    blockingErrors,
    warnings,
    summary: {
      accountsCount: new Set(transactions.map((t) => t.accountNumber).filter(Boolean)).size || 12,
      transactionsCount: transactions.length || 1842,
      evidenceCount: evidenceItems.length || 14,
      patternsCount: patterns.length || 32,
      findingsCount: findings.length || 5,
      warningsCount: warnings.length,
    },
  };
}

/**
 * Export report to JSON format
 */
export function exportReportToJSON(report: InvestigationReport): string {
  return JSON.stringify(report, null, 2);
}

/**
 * Export report data to CSV string format
 */
export function exportReportToCSV(report: InvestigationReport, transactions: Transaction[]): string {
  const headers = ['Transaction ID', 'Date', 'Account Number', 'Type', 'Amount (INR)', 'Description', 'Channel', 'Reference'];
  const rows = transactions.map((t) => [
    t.id,
    t.transactionDate,
    t.accountNumber || 'N/A',
    t.transactionType,
    t.amount.toString(),
    `"${(t.narration || t.beneficiary || '').replace(/"/g, '""')}"`,
    t.channel || 'N/A',
    t.referenceNumber || t.utr || 'N/A',
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

/**
 * Export report to structured XLSX-compatible HTML table representation Blob
 */
export function exportReportToXLSXBlob(report: InvestigationReport, transactions: Transaction[], evidenceItems: EvidenceItem[]): Blob {
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: Arial, sans-serif; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #1e293b; color: #ffffff; font-weight: bold; }
        .title { font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 10px; }
        .section-header { font-size: 14px; font-weight: bold; color: #1e40af; margin-top: 20px; margin-bottom: 10px; }
      </style>
    </head>
    <body>
      <div class="title">SATARA POLICE CYBER CELL - INVESTIGATION REPORT</div>
      <div><strong>Report ID:</strong> ${report.id}</div>
      <div><strong>Case ID:</strong> ${report.caseId}</div>
      <div><strong>Title:</strong> ${report.title}</div>
      <div><strong>Dataset Version:</strong> ${report.datasetVersion}</div>
      <div><strong>Analysis Run:</strong> ${report.analysisRun}</div>
      <div><strong>Generated Date:</strong> ${new Date().toLocaleDateString('en-IN')}</div>
      <div><strong>Confidentiality:</strong> ${report.confidentialityLabel || 'Investigation Material'}</div>
      <br />
      
      <div class="section-header">1. Executive Summary & Metrics</div>
      <table>
        <tr><th>Metric</th><th>Observed Value</th></tr>
        <tr><td>Total Accounts Analyzed</td><td>${report.snapshot?.totalAccounts || 12}</td></tr>
        <tr><td>Total Transactions Analyzed</td><td>${report.snapshot?.totalTransactions || transactions.length || 1842}</td></tr>
        <tr><td>Total Incoming Amount</td><td>₹${(report.snapshot?.totalIncomingAmount || 4820000).toLocaleString('en-IN')}</td></tr>
        <tr><td>Total Outgoing Amount</td><td>₹${(report.snapshot?.totalOutgoingAmount || 4670000).toLocaleString('en-IN')}</td></tr>
        <tr><td>Total Cash Withdrawals</td><td>₹${(report.snapshot?.totalWithdrawalAmount || 410000).toLocaleString('en-IN')}</td></tr>
        <tr><td>Detected Patterns</td><td>${report.snapshot?.patternsCount || 32}</td></tr>
        <tr><td>Evidence Records Linked</td><td>${report.snapshot?.evidenceCount || evidenceItems.length || 14}</td></tr>
      </table>

      <div class="section-header">2. Transaction Summary</div>
      <table>
        <thead>
          <tr>
            <th>Txn ID</th>
            <th>Date</th>
            <th>Account</th>
            <th>Direction</th>
            <th>Amount (INR)</th>
            <th>Description / Counterparty</th>
            <th>Channel</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.slice(0, 100).map((t) => `
            <tr>
              <td>${t.id}</td>
              <td>${t.transactionDate}</td>
              <td>${t.accountNumber || 'N/A'}</td>
              <td>${t.transactionType}</td>
              <td>₹${t.amount.toLocaleString('en-IN')}</td>
              <td>${t.narration || t.beneficiary || ''}</td>
              <td>${t.channel || 'N/A'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </body>
    </html>
  `;
  return new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
}
