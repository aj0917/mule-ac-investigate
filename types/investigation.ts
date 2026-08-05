export type TransactionChannel = 
  | 'UPI' 
  | 'IMPS' 
  | 'NEFT' 
  | 'RTGS' 
  | 'ATM' 
  | 'CASH' 
  | 'CHEQUE' 
  | 'CARD' 
  | 'OTHER' 
  | 'UNKNOWN';

export type TransactionType = 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'DEPOSIT';

export interface BankStatement {
  id: string;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
  fileSize: number;
  bankName: string;
  accountNumberMasked: string;
  accountNumberHash: string;
  periodStart: string | null;
  periodEnd: string | null;
  importedAt: string;
  rowCount: number;
  validRowCount: number;
  reviewRowCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalWithdrawals: number;
  totalDeposits: number;
  status: 'processed' | 'review_required' | 'failed';
  sourceFileRef: string;
  selectedSheet?: string;
  sheets?: { name: string; rowCount: number }[];
}

export interface Transaction {
  id: string;
  statementId: string;
  sourceSheet: string;
  sourceRowNumber: number;
  transactionDate: string; // ISO date format YYYY-MM-DD
  valueDate?: string;
  transactionId?: string;
  utr?: string;
  referenceNumber?: string;
  narration: string;
  debitAmount: number;
  creditAmount: number;
  amount: number;
  balance: number;
  transactionType: TransactionType;
  channel: TransactionChannel;
  senderAccount?: string;
  receiverAccount?: string;
  accountNumber?: string;
  beneficiary?: string;
  ifsc?: string;
  bankName?: string;
  branch?: string;
  upiId?: string;
  chequeNumber?: string;
  rawData: Record<string, any>;
  createdAt: string;
  hasReviewIssue?: boolean;
  reviewReason?: string;
}

export type SystemFieldKey = 
  | 'transaction_date'
  | 'value_date'
  | 'narration'
  | 'debit_amount'
  | 'credit_amount'
  | 'amount'
  | 'amount_type'
  | 'balance'
  | 'transaction_id'
  | 'utr'
  | 'reference_number'
  | 'transaction_type'
  | 'channel'
  | 'account_number'
  | 'sender_account'
  | 'receiver_account'
  | 'beneficiary'
  | 'ifsc'
  | 'bank_name'
  | 'branch'
  | 'upi_id'
  | 'cheque_number';

export interface SystemFieldDefinition {
  key: SystemFieldKey;
  label: string;
  required: boolean;
  description: string;
  example: string;
}

export type ColumnMappingState = Partial<Record<SystemFieldKey, string>>;

export interface SheetData {
  sheetName: string;
  rowCount: number;
  headers: string[];
  rows: Record<string, any>[];
}

export interface RawParsedFile {
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls';
  fileSize: number;
  sheets: SheetData[];
}

export type UploadStep = 
  | 'dropzone'
  | 'sheet_select'
  | 'mapping'
  | 'preview'
  | 'summary'
  | 'processing'
  | 'result'
  | 'review';

export interface DashboardMetrics {
  totalTransactions: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalWithdrawals: number;
  totalDeposits: number;
  uniqueAccounts: number;
  statementsCount: number;
  creditCount: number;
  debitCount: number;
  averageTransactionValue: number;
  largestTransaction: number;
  firstTransactionDate: string | null;
  lastTransactionDate: string | null;
}

export interface ChannelSummary {
  channel: TransactionChannel;
  count: number;
  totalAmount: number;
}

export interface AccountEntity {
  id: string; // Account identifier or masked number or UPI ID
  accountNumberMasked: string;
  accountNumberHash?: string;
  bankName: string;
  ifsc?: string;
  branch?: string;
  primaryHolder?: string;
  totalTransactions: number;
  creditCount: number;
  debitCount: number;
  totalMoneyIn: number;
  totalMoneyOut: number;
  totalWithdrawals: number;
  totalDeposits: number;
  netFlow: number;
  largestCredit: number;
  largestDebit: number;
  averageTransactionValue: number;
  firstSeen: string | null;
  lastSeen: string | null;
  statementIds: string[];
  statementCount: number;
  connectedAccountsCount: number;
}

export interface AccountConnection {
  id: string;
  counterpartyId: string;
  counterpartyName: string;
  bankName?: string;
  ifsc?: string;
  direction: 'INCOMING' | 'OUTGOING' | 'BOTH';
  transactionCount: number;
  totalReceived: number;
  totalSent: number;
  totalAmount: number;
  firstSeen: string | null;
  lastSeen: string | null;
}

export interface RapidMovementItem {
  id: string;
  incomingTxn: Transaction;
  outgoingTxn: Transaction;
  creditAmount: number;
  debitAmount: number;
  timeGapMinutes: number;
  percentageMoved: number;
}

export interface AccountIndicator {
  type: 'LOW_ACTIVITY' | 'INCREASED_VOLUME' | 'HIGH_VALUE_TXN' | 'RAPID_MOVEMENT' | 'NORMAL';
  title: string;
  description: string;
  level: 'INFO' | 'NOTICE' | 'ALERT';
  details?: string;
}

export interface UniversalSearchResults {
  query: string;
  accounts: AccountEntity[];
  transactions: Transaction[];
  connectedEntities: AccountConnection[];
  statements: BankStatement[];
  totalMatches: number;
}

export interface TransactionContext {
  current: Transaction;
  previous?: Transaction;
  next?: Transaction;
}

export type NodeType = 'ACCOUNT' | 'UPI' | 'BENEFICIARY' | 'WITHDRAWAL' | 'DEPOSIT';
export type GraphLayoutType = 'FLOW' | 'NETWORK' | 'TIMELINE';
export type TraceDirection = 'FORWARD' | 'BACKWARD' | 'BOTH';

export interface GraphNode {
  id: string;
  type: NodeType;
  label: string;
  sublabel: string;
  totalMoneyIn: number;
  totalMoneyOut: number;
  txCount: number;
  isRoot: boolean;
  depth: number;
  connectedCount: number;
  x?: number;
  y?: number;
  isExpanded?: boolean;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  amount: number;
  txCount: number;
  transactions: Transaction[];
  firstDate: string;
  lastDate: string;
  channels: TransactionChannel[];
  utrs: string[];
  isHighlighted?: boolean;
}

export interface MoneyTrailHop {
  hopIndex: number;
  fromNodeId: string;
  fromLabel: string;
  toNodeId: string;
  toLabel: string;
  amount: number;
  date: string;
  channel: TransactionChannel;
  utr?: string;
  transaction: Transaction;
  timeGapMinutes?: number;
}

export interface MoneyTrailSummary {
  startingAccount: string;
  endingAccount: string;
  hopsCount: number;
  originalAmount: number;
  finalAmount: number;
  amountDifference: number;
  percentageMoved: number;
  timeSpanFormatted: string;
  transactionsCount: number;
  hops: MoneyTrailHop[];
  isCycleDetected: boolean;
  cycleNodes?: string[];
}

export interface GraphDataQualityMetrics {
  totalTransactions: number;
  identifiedRelationships: number;
  counterpartyCoveragePercentage: number;
  missingCounterpartyCount: number;
}

// ==========================================
// STEP 5: PATTERN ANALYSIS ENGINE TYPES
// ==========================================

export type PatternCategory =
  | 'RAPID_MOVEMENT'
  | 'SPLIT_FLOW'
  | 'CONSOLIDATION'
  | 'MULTI_HOP'
  | 'CIRCULAR_FLOW'
  | 'HIGH_VALUE'
  | 'UNUSUAL_AMOUNT'
  | 'ACTIVITY_CHANGE'
  | 'NEW_COUNTERPARTY'
  | 'CONCENTRATION'
  | 'ROUND_AMOUNT'
  | 'REPEATED_TRANSACTION'
  | 'LOW_TO_HIGH_ACTIVITY'
  | 'WITHDRAWAL_AFTER_CREDIT'
  | 'MULTIPLE_DEBITS_AFTER_CREDIT'
  | 'TRANSACTION_BURST'
  | 'IN_OUT_RATIO';

export type PatternPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type PatternStatus = 'NEW' | 'UNDER_REVIEW' | 'REVIEWED' | 'DISMISSED' | 'IMPORTANT';

export type DismissReason =
  | 'KNOWN_BUSINESS_ACTIVITY'
  | 'DUPLICATE_SOURCE'
  | 'EXPECTED_TRANSACTION'
  | 'DATA_ISSUE'
  | 'FALSE_POSITIVE'
  | 'OTHER';

export interface PriorityFactor {
  label: string;
  value: string;
  contribution: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CalculationStep {
  parameter: string;
  observedValue: string | number;
  configuredThreshold: string | number;
  conditionMet: boolean;
  notes?: string;
}

export interface PatternCalculationDetails {
  formulaName: string;
  steps: CalculationStep[];
  matchedConditionCount: number;
  totalConditionsCount: number;
  result: string;
}

export interface PatternIndicator {
  id: string;
  category: PatternCategory;
  title: string;
  subtitle: string;
  priority: PatternPriority;
  priorityFactors: PriorityFactor[];
  status: PatternStatus;
  dismissReason?: DismissReason;
  dismissNotes?: string;
  updatedAt: string;
  
  // Entities Involved
  rootAccountId: string;
  rootAccountLabel: string;
  involvedAccountIds: string[];
  involvedAccountLabels: string[];
  
  // Amounts & Time
  totalAmount: number;
  inflowAmount?: number;
  outflowAmount?: number;
  timeWindowMinutes?: number;
  startDate: string;
  endDate: string;
  
  // Supporting Data
  transactionIds: string[];
  supportingTransactions: Transaction[];
  explanation: string;
  calculation: PatternCalculationDetails;
  
  // Traceability
  statementIds: string[];
  statementFileNames: string[];
  
  // Analysis Run Meta
  analysisRunId: string;
}

export interface PatternAnalysisScope {
  selectedStatementIds: string[];
  totalStatementsCount: number;
  totalTransactionsCount: number;
  totalAccountsCount: number;
  dateFrom?: string;
  dateTo?: string;
  channels: TransactionChannel[];
}

export interface PatternAnalysisRun {
  id: string;
  datasetVersion: string;
  startedAt: string;
  completedAt?: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  scope: PatternAnalysisScope;
  indicatorsCount: number;
  priorityBreakdown: {
    high: number;
    medium: number;
    low: number;
  };
  warnings?: string[];
}

export interface PatternRuleCondition {
  minAmount?: number;
  maxAmount?: number;
  timeWindowMinutes?: number;
  minCount?: number;
  minDestinations?: number;
  minSources?: number;
  direction?: 'INCOMING' | 'OUTGOING' | 'BOTH';
  channels?: TransactionChannel[];
  thresholdMultiplier?: number; // E.g. 3x historical median
}

export interface CustomInvestigationRule {
  id: string;
  name: string;
  description: string;
  category: PatternCategory;
  priority: PatternPriority;
  status: 'ACTIVE' | 'INACTIVE';
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  conditions: PatternRuleCondition;
}

export interface PatternAnalysisFilterState {
  category: PatternCategory | 'ALL';
  priority: PatternPriority | 'ALL';
  status: PatternStatus | 'ALL';
  searchQuery: string;
  accountFilter: string;
  bankFilter: string;
  dateFrom: string;
  dateTo: string;
  minAmount: string;
  maxAmount: string;
}



