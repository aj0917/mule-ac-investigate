import { Transaction, BankStatement } from './investigation';

export type MatchConfidenceLevel = 'HIGH' | 'MEDIUM' | 'CANDIDATE';
export type MatchStatus = 'UNREVIEWED' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW';
export type MatchType = 
  | 'EXACT_UTR' 
  | 'EXACT_ACCOUNT' 
  | 'EXACT_UPI' 
  | 'AMOUNT_DATE_WINDOW' 
  | 'NORMALIZED_COUNTERPARTY' 
  | 'DUPLICATE_CANDIDATE';

export interface CrossStatement {
  id: string; // e.g. STMT-000001
  originalId: string;
  bankName: string;
  accountNumber: string;
  accountNumberMasked: string;
  periodStart: string | null;
  periodEnd: string | null;
  fileName: string;
  fileHash: string;
  source: string;
  importedAt: string;
  caseId?: string;
  caseName?: string;
  datasetVersion: string;
  rowCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  qualityRating: 'HIGH' | 'MEDIUM' | 'NEEDS_REVIEW';
  status: 'active' | 'archived';
}

export interface AccountOverlap {
  id: string;
  accountNumber: string;
  normalizedAccount: string;
  accountName?: string;
  bankNames: string[];
  statementIds: string[];
  caseIds: string[];
  matchConfidence: 'EXACT' | 'NORMALIZED' | 'POSSIBLE' | 'UNRESOLVED';
  transactionCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  firstSeen: string;
  lastSeen: string;
}

export interface CrossStatementMatch {
  id: string; // e.g. MATCH-0001
  recordA: {
    transactionId: string;
    statementId: string;
    bank: string;
    account: string;
    date: string;
    amount: number;
    direction: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'DEPOSIT';
    narration: string;
    utr?: string;
    upiId?: string;
    beneficiary?: string;
  };
  recordB: {
    transactionId: string;
    statementId: string;
    bank: string;
    account: string;
    date: string;
    amount: number;
    direction: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'DEPOSIT';
    narration: string;
    utr?: string;
    upiId?: string;
    beneficiary?: string;
  };
  matchType: MatchType;
  matchSignals: {
    utrMatch: boolean;
    accountMatch: boolean;
    amountMatch: boolean;
    dateWindowDays: number;
    upiMatch: boolean;
    nameMatch: boolean;
  };
  matchScore: number; // 0 to 100
  confidenceLevel: MatchConfidenceLevel;
  explanation: string;
  status: MatchStatus;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export interface PathHopNode {
  account: string;
  bank: string;
  statementId?: string;
  caseId?: string;
}

export interface PathHopEdge {
  fromAccount: string;
  toAccount: string;
  transactionId: string;
  amount: number;
  date: string;
  channel: string;
  utr?: string;
  statementId: string;
}

export interface PathFinderResult {
  pathId: string;
  hopsCount: number;
  pathType: 'DIRECT' | '2-HOP' | '3-HOP' | 'MULTI-HOP';
  totalFlowAmount: number;
  startDate: string;
  endDate: string;
  nodes: PathHopNode[];
  edges: PathHopEdge[];
  sourceStatements: string[];
}

export interface TransactionCluster {
  clusterId: string; // CLUSTER-0001
  name: string;
  groupBy: 'ACCOUNT' | 'UTR' | 'COUNTERPARTY' | 'AMOUNT_DATE' | 'UPI';
  transactionIds: string[];
  statementIds: string[];
  accounts: string[];
  banks: string[];
  dateRange: { start: string; end: string };
  totalAmount: number;
  matchingSignals: string[];
}

export interface CrossStatementPattern {
  patternId: string; // CSP-0001
  type: 
    | 'CIRCULAR_FLOW' 
    | 'RAPID_MOVEMENT' 
    | 'HIGH_FREQUENCY' 
    | 'PASS_THROUGH' 
    | 'COMMON_COUNTERPARTY' 
    | 'SHARED_ACCOUNT_ACTIVITY';
  title: string;
  description: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  sourceStatements: string[];
  analysisRunId: string;
  rulesVersion: string;
  supportingTransactionIds: string[];
  details: {
    elapsedMinutes?: number;
    roundTripAmount?: number;
    participantAccounts?: string[];
    thresholdMet?: string;
    ruleName?: string;
  };
}

export interface CrossStatementAnalysisRun {
  id: string; // XSA-000001
  runAt: string;
  selectedStatementIds: string[];
  dateRange: { start?: string; end?: string };
  matchingRulesConfig: {
    exactAccount: boolean;
    exactUtr: boolean;
    exactUpi: boolean;
    dateWindowDays: number;
    amountTolerancePercent: number;
    normalizedName: boolean;
  };
  minAmount: number;
  maxHops: number;
  matchesFoundCount: number;
  clustersFoundCount: number;
  patternsFoundCount: number;
  snapshotHash: string;
}

export interface CrossCaseObservation {
  id: string; // CCO-0001
  title: string;
  description: string;
  caseA: { id: string; name: string };
  caseB: { id: string; name: string };
  sharedEntityType: 'ACCOUNT' | 'UTR' | 'COUNTERPARTY' | 'EVIDENCE' | 'UPI' | 'PHONE' | 'EMAIL';
  sharedEntityValue: string;
  supportingTransactionIds: string[];
  supportingEvidenceIds: string[];
  status: 'DRAFT' | 'UNDER_REVIEW' | 'CONFIRMED' | 'REJECTED' | 'FINALIZED';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SearchFilterState {
  query: string;
  searchType: 'ALL' | 'EXACT' | 'PARTIAL';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  direction?: 'ALL' | 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'DEPOSIT';
  channel?: string;
  bank?: string;
  statementIds: string[];
  caseIds: string[];
  hasPatternOnly?: boolean;
  hasEvidenceOnly?: boolean;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilterState;
  savedAt: string;
  resultCount: number;
}

export interface GlobalSearchResultGroup<T> {
  category: 'ACCOUNTS' | 'TRANSACTIONS' | 'COUNTERPARTIES' | 'STATEMENTS' | 'EVIDENCE' | 'PATTERNS' | 'CASES' | 'FINDINGS';
  count: number;
  items: T[];
}
