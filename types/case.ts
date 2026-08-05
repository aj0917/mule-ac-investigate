export type CaseStatus =
  | 'Draft'
  | 'Open'
  | 'Under Investigation'
  | 'Evidence Review'
  | 'Awaiting Action'
  | 'Closed'
  | 'Archived';

export type CasePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type AccountRelationshipRole =
  | 'Primary Account'
  | 'Related Account'
  | 'Counterparty'
  | 'Source Account'
  | 'Destination Account'
  | 'Observed Intermediary'
  | 'Unknown';

export type EvidenceType =
  | 'Bank Statement'
  | 'Transaction Record'
  | 'Screenshot'
  | 'Document'
  | 'PDF'
  | 'Image'
  | 'Email Export'
  | 'Chat Export'
  | 'Digital File'
  | 'Other';

export type EvidenceStatus =
  | 'Collected'
  | 'Under Review'
  | 'Verified'
  | 'Disputed'
  | 'Archived';

export type ChainOfCustodyAction =
  | 'Collected'
  | 'Uploaded'
  | 'Viewed'
  | 'Verified'
  | 'Copied'
  | 'Exported'
  | 'Archived';

export interface ChainOfCustodyLog {
  id: string;
  evidenceId: string;
  action: ChainOfCustodyAction;
  performedBy: string;
  timestamp: string;
  reason?: string;
  previousHash?: string;
  newHash?: string;
}

export interface EvidenceVersion {
  version: number;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileHash: string; // SHA-256
  uploadedAt: string;
  uploadedBy: string;
  fileReference?: string; // Data URL or Blob reference
}

export type EvidenceIntegrityStatus =
  | 'Not Checked'
  | 'Verified Unchanged'
  | 'Changed'
  | 'Unable to Verify';

export type EvidenceQualityFlag =
  | 'Complete'
  | 'Partial'
  | 'Unreadable'
  | 'Missing Metadata'
  | 'Duplicate Suspected'
  | 'Source Unclear'
  | 'Needs Review';

export interface EvidenceSourceLocation {
  pageNumber?: number;
  tableNumber?: number;
  sheetName?: string;
  rowNumber?: number;
  columnRef?: string;
  sourceTextRef?: string;
  originalValue?: string;
  normalizedValue?: string;
}

export interface EvidenceReviewChecklist {
  sourceIdentified: boolean;
  fileAccessible: boolean;
  fileTypeIdentified: boolean;
  hashCalculated: boolean;
  sourceMetadataRecorded: boolean;
  relatedRecordsLinked: boolean;
  integrityChecked: boolean;
  notesAdded: boolean;
}

export interface EvidenceReview {
  status: 'Not Reviewed' | 'Under Review' | 'Reviewed' | 'Needs Clarification';
  reviewDate?: string;
  reviewerId?: string;
  observations?: string;
  issues?: string;
  checklist?: EvidenceReviewChecklist;
}

export interface EvidenceCollection {
  id: string; // COL-00001
  title: string;
  description: string;
  investigationId: string;
  collectionDate: string;
  source: string;
  evidenceIds: string[];
  status: 'Open' | 'Under Review' | 'Complete' | 'Archived';
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceIntegrityCheck {
  id: string;
  evidenceId: string;
  algorithm: 'SHA-256';
  storedHash: string;
  calculatedHash: string;
  result: EvidenceIntegrityStatus;
  checkedAt: string;
  notes?: string;
}

export interface EvidenceItem {
  id: string; // EVD-2026-00001
  evidenceNumber: string;
  investigationId: string;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  sourceType: string;
  sourceName: string;
  sourceOrganization?: string;
  collectedAt: string;
  status: EvidenceStatus;
  integrityStatus?: EvidenceIntegrityStatus;
  hash: string; // SHA-256 hex string
  storageReference?: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileDataUrl?: string; // Embedded data preview for local uploads
  sourceLocation?: EvidenceSourceLocation;
  collectionId?: string;
  tags?: string[];
  qualityFlags?: EvidenceQualityFlag[];
  derivedDatasetId?: string;
  parserVersion?: string;
  normalizerVersion?: string;
  analysisVersion?: string;
  review?: EvidenceReview;
  relatedAccountIds: string[];
  relatedTransactionIds: string[];
  relatedIndicatorIds: string[];
  relatedFindingIds?: string[];
  notes: string[];
  versions: EvidenceVersion[];
  chainOfCustody: ChainOfCustodyLog[];
  createdAt: string;
  updatedAt: string;
}

export type NoteType =
  | 'Observation'
  | 'Question'
  | 'Lead'
  | 'Follow-up'
  | 'Analysis'
  | 'Finding Draft'
  | 'General';

export interface NoteVersion {
  version: number;
  content: string;
  updatedAt: string;
  updatedBy: string;
}

export interface InvestigationNote {
  id: string;
  investigationId: string;
  title: string;
  content: string;
  noteType: NoteType;
  author: string;
  relatedAccountIds: string[];
  relatedTransactionIds: string[];
  relatedIndicatorIds: string[];
  relatedEvidenceIds: string[];
  versions: NoteVersion[];
  createdAt: string;
  updatedAt: string;
}

export type FindingStatus =
  | 'Draft'
  | 'Under Review'
  | 'Supported'
  | 'Needs More Evidence'
  | 'Rejected'
  | 'Finalized';

export interface InvestigationFinding {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  investigatorAssessment: string;
  status: FindingStatus;
  supportingTransactionIds: string[];
  supportingAccountIds: string[];
  supportingIndicatorIds: string[];
  supportingEvidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export type TaskStatus =
  | 'Open'
  | 'In Progress'
  | 'Waiting'
  | 'Completed'
  | 'Cancelled';

export interface InvestigationTask {
  id: string;
  investigationId: string;
  title: string;
  description: string;
  assignedTo: string;
  priority: CasePriority;
  dueDate: string;
  status: TaskStatus;
  relatedAccountId?: string;
  relatedTransactionId?: string;
  relatedEvidenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimelineEventType =
  | 'Case Created'
  | 'Statement Imported'
  | 'Transaction Identified'
  | 'Account Added'
  | 'Indicator Detected'
  | 'Evidence Added'
  | 'Note Added'
  | 'Finding Added'
  | 'Status Changed'
  | 'Task Created'
  | 'System Event';

export interface CaseTimelineEvent {
  id: string;
  investigationId: string;
  eventType: TimelineEventType;
  objectType: 'Case' | 'Account' | 'Transaction' | 'Indicator' | 'Evidence' | 'Note' | 'Finding' | 'Task' | 'System';
  objectId?: string;
  description: string;
  actor: string;
  timestamp: string;
  source?: string;
}

export interface CaseAccountLink {
  id: string;
  investigationId: string;
  accountId: string; // Account Number or Hash or Entity ID
  accountNumberMasked: string;
  bankName?: string;
  relationshipRole: AccountRelationshipRole;
  reason: string;
  notes?: string;
  addedAt: string;
}

export interface CaseTransactionLink {
  id: string;
  investigationId: string;
  transactionId: string;
  reason: string;
  notes?: string;
  addedAt: string;
}

export interface CaseIndicatorLink {
  id: string;
  investigationId: string;
  indicatorId: string;
  investigatorStatus: 'Under Review' | 'Verified' | 'Dismissed' | 'Primary Lead';
  notes?: string;
  addedAt: string;
  datasetVersionAtAddition?: number;
}

export interface CaseActivityLog {
  id: string;
  investigationId: string;
  actor: string;
  action: string;
  details: string;
  timestamp: string;
}

export type QuestionStatus = 'Open' | 'Investigating' | 'Answered' | 'Not Applicable';

export interface InvestigationQuestion {
  id: string;
  investigationId: string;
  question: string;
  status: QuestionStatus;
  relatedAccountIds: string[];
  relatedTransactionIds: string[];
  relatedEvidenceIds: string[];
  relatedFindingIds: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestigationSnapshot {
  id: string;
  investigationId: string;
  datasetVersion: number;
  analysisRunId: string;
  createdAt: string;
  description: string;
  accountsCount: number;
  transactionsCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  patternsCount: number;
  evidenceCount: number;
  findingsCount: number;
}

export interface CaseBookmark {
  id: string;
  investigationId: string;
  itemType: 'Account' | 'Transaction' | 'Pattern' | 'Evidence' | 'Finding' | 'Timeline';
  itemId: string;
  label: string;
  addedAt: string;
}

export interface InvestigationCase {
  id: string; // CYBER-2026-00001
  caseNumber: string; // Same as id
  title: string;
  caseType: string;
  referenceNumber?: string;
  description: string;
  status: CaseStatus;
  priority: CasePriority;
  incidentDate: string;
  reportedDate: string;
  location: string;
  primaryAccountId?: string;
  assignedInvestigator: string;
  initialNotes?: string;
  datasetVersion: number;
  analysisRunId?: string;
  isStarred?: boolean;
  
  // Embedded or referenced sub-collections
  accounts: CaseAccountLink[];
  transactions: CaseTransactionLink[];
  indicators: CaseIndicatorLink[];
  evidenceItems: EvidenceItem[];
  notes: InvestigationNote[];
  questions?: InvestigationQuestion[];
  findings: InvestigationFinding[];
  tasks: InvestigationTask[];
  snapshots?: InvestigationSnapshot[];
  bookmarks?: CaseBookmark[];
  timeline: CaseTimelineEvent[];
  activityLogs: CaseActivityLog[];

  createdAt: string;
  updatedAt: string;
}
