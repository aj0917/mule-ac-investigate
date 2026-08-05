export type ReportType =
  | 'Investigation Summary'
  | 'Financial Transaction Analysis'
  | 'Money Flow Report'
  | 'Account Analysis'
  | 'Pattern Analysis'
  | 'Evidence Summary'
  | 'Timeline Report'
  | 'Comprehensive Investigation Report'
  | 'Custom Investigation Report';

export type ReportStatus =
  | 'Draft'
  | 'Generating'
  | 'Generated'
  | 'Needs Review'
  | 'Finalized'
  | 'Archived';

export type ReportApprovalStatus =
  | 'Not Reviewed'
  | 'Under Review'
  | 'Reviewed'
  | 'Approved'
  | 'Returned for Revision';

export type ReportExportFormat = 'PDF' | 'CSV' | 'XLSX' | 'JSON';

export type ReportSectionId =
  | 'cover'
  | 'case_overview'
  | 'scope'
  | 'data_sources'
  | 'account_summary'
  | 'transaction_summary'
  | 'money_in'
  | 'money_out'
  | 'withdrawals'
  | 'money_flow'
  | 'timeline'
  | 'patterns'
  | 'indicators'
  | 'evidence'
  | 'findings'
  | 'notes'
  | 'data_quality'
  | 'data_lineage'
  | 'methodology'
  | 'limitations'
  | 'appendix';

export interface ReportSectionConfig {
  id: ReportSectionId;
  title: string;
  description: string;
  visible: boolean;
  order: number;
}

export interface ReportFilterConfig {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  accountIds?: string[];
  direction?: 'ALL' | 'INCOMING' | 'OUTGOING' | 'WITHDRAWAL';
  maskAccountNumbers?: boolean;
  selectedPatternIds?: string[];
  selectedTransactionIds?: string[];
  selectedEvidenceIds?: string[];
  graphHopDepth?: 1 | 2 | 3;
}

export interface ReportSnapshot {
  caseId: string;
  caseTitle: string;
  datasetVersion: string;
  analysisRun: string;
  generatedAt: string;
  totalAccounts: number;
  totalTransactions: number;
  totalIncomingAmount: number;
  totalOutgoingAmount: number;
  totalWithdrawalAmount: number;
  patternsCount: number;
  evidenceCount: number;
  findingsCount: number;
  selectedAccountIds: string[];
  selectedTransactionIds: string[];
  selectedEvidenceIds: string[];
  selectedPatternIds: string[];
  selectedFindingIds: string[];
  selectedNoteIds: string[];
}

export interface InvestigationReport {
  id: string; // e.g., RPT-2026-000001
  caseId: string;
  title: string;
  reportType: ReportType;
  description: string;
  version: number; // 1, 2, 3...
  versionLabel: string; // "V1", "V2"
  status: ReportStatus;
  approvalStatus: ReportApprovalStatus;

  datasetVersion: string; // e.g. "Dataset V04"
  analysisRun: string; // e.g. "RUN-00042"
  templateId?: string; // e.g. "TPL-001"

  dateRange: {
    start: string;
    end: string;
  };

  sections: ReportSectionConfig[];
  filters: ReportFilterConfig;
  snapshot?: ReportSnapshot;

  hash?: string; // SHA-256 hash string
  hashAlgorithm?: 'SHA-256';

  investigatorRemarks?: string;
  preparedBy?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  confidentialityLabel?: string; // Default: "Investigation Material"

  createdAt: string;
  updatedAt: string;
  finalizedAt?: string;
  lastExportAt?: string;
  lastExportFormat?: ReportExportFormat;
}

export interface ReportExportRecord {
  id: string; // EXP-2026-00001
  reportId: string;
  reportVersion: number;
  format: ReportExportFormat;
  datasetVersion: string;
  analysisRun: string;
  generatedAt: string;
  hash: string;
  status: 'Completed' | 'Failed';
  fileSize?: number;
  fileName?: string;
}

export interface ReportActivityRecord {
  id: string;
  reportId: string;
  action:
    | 'Report Created'
    | 'Data Selected'
    | 'Section Reordered'
    | 'Section Toggled'
    | 'Report Generated'
    | 'Report Reviewed'
    | 'Report Finalized'
    | 'PDF Exported'
    | 'CSV Exported'
    | 'XLSX Exported'
    | 'JSON Exported'
    | 'Report Archived';
  timestamp: string;
  actorId?: string;
  details?: string;
}

export interface ReportTemplate {
  id: string; // TPL-001
  title: string;
  description: string;
  reportType: ReportType;
  sections: ReportSectionConfig[];
  defaultFilters: ReportFilterConfig;
  version: string; // "Template V1"
  isDefault?: boolean;
}

export interface ValidationIssue {
  id: string;
  type: 'blocking' | 'warning';
  category: 'Case' | 'Dataset' | 'Analysis' | 'Accounts' | 'Transactions' | 'Evidence' | 'Patterns' | 'Findings' | 'Source';
  message: string;
  field?: string;
}

export interface ReportValidationResult {
  isValid: boolean;
  canGenerate: boolean;
  blockingErrors: ValidationIssue[];
  warnings: ValidationIssue[];
  summary: {
    accountsCount: number;
    transactionsCount: number;
    evidenceCount: number;
    patternsCount: number;
    findingsCount: number;
    warningsCount: number;
  };
}
