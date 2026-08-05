export type EventCategory = 'SOURCE' | 'DERIVED' | 'INVESTIGATOR' | 'SYSTEM';

export type TimelineEventType =
  | 'Transaction'
  | 'Deposit'
  | 'Withdrawal'
  | 'Transfer'
  | 'Account Activity'
  | 'Indicator'
  | 'Evidence'
  | 'Investigator Note'
  | 'Finding'
  | 'Case Event';

export type TimeAccuracy = 'EXACT' | 'APPROXIMATE' | 'DATE_ONLY';

export interface TimelineEvent {
  id: string;
  timestamp: string; // ISO format YYYY-MM-DDTHH:mm:ssZ or YYYY-MM-DD
  date: string; // YYYY-MM-DD
  timeFormatted: string; // HH:mm:ss, HH:mm or "Time unavailable"
  timeAccuracy: TimeAccuracy;
  eventType: TimelineEventType;
  category: EventCategory;
  title: string;
  description: string;
  amount?: number;
  direction?: 'IN' | 'OUT' | 'NEUTRAL';
  accountId?: string;
  accountName?: string;
  counterpartyId?: string;
  counterpartyName?: string;
  channel?: string;
  caseId?: string;
  sourceLabel: string; // e.g. "Bank Statement #003", "Pattern Engine", "Case CYBER-2026-00001"
  relatedTransactionId?: string;
  relatedIndicatorId?: string;
  relatedEvidenceId?: string;
  relatedNoteId?: string;
  rawTxn?: any;
}

export type TimelineZoomLevel = 'YEAR' | 'MONTH' | 'DAY' | 'HOUR' | 'TRANSACTION';

export type TimelineViewTab =
  | 'OVERVIEW'
  | 'TRANSACTIONS'
  | 'ACCOUNT_SWIMLANE'
  | 'MONEY_FLOW'
  | 'HEATMAP'
  | 'VELOCITY'
  | 'BEFORE_AFTER'
  | 'COMPARISON'
  | 'INDICATORS';

export type DateRangePreset = 'TODAY' | 'YESTERDAY' | '7D' | '30D' | '90D' | '6M' | '1Y' | 'CASE' | 'CUSTOM';

export interface TimelineFilterState {
  caseId: string;
  accountId: string;
  startDate: string;
  endDate: string;
  channel: string;
  category: string;
  minAmount?: number;
  maxAmount?: number;
  searchQuery: string;
}

export interface DataQualityMetrics {
  totalEvents: number;
  exactTimeCount: number;
  dateOnlyCount: number;
  missingTimeCount: number;
  exactTimePercentage: number;
  dateOnlyPercentage: number;
}

export interface TimelineCluster {
  id: string;
  startTime: string;
  endTime: string;
  date: string;
  transactionCount: number;
  totalIncoming: number;
  totalOutgoing: number;
  activeAccountCount: number;
  events: TimelineEvent[];
}

export interface VelocityHop {
  hopNumber: number;
  fromAccount: string;
  toAccount: string;
  fromTxnId: string;
  toTxnId: string;
  fromTimestamp: string;
  toTimestamp: string;
  elapsedMinutes: number;
  formattedElapsed: string;
  amount: number;
  channel: string;
}

export interface VelocitySummary {
  totalHops: number;
  totalElapsedMinutes: number;
  formattedTotalElapsed: string;
  avgHopIntervalMinutes: number;
  medianHopIntervalMinutes: number;
  minHopIntervalMinutes: number;
  maxHopIntervalMinutes: number;
  hops: VelocityHop[];
}

export interface HeatmapCell {
  dayOfWeek: number; // 0 = Mon, 6 = Sun
  dayLabel: string;
  hourOfDay: number; // 0..23
  count: number;
  incoming: number;
  outgoing: number;
  totalValue: number;
}

export interface BeforeAfterContext {
  selectedTxn: TimelineEvent;
  beforeWindow: TimelineEvent[];
  afterWindow: TimelineEvent[];
  windowMinutes: number;
  beforeIncoming: number;
  beforeOutgoing: number;
  beforeCount: number;
  afterIncoming: number;
  afterOutgoing: number;
  afterCount: number;
}

export interface AccountActivityProfile {
  accountId: string;
  firstSeen: string;
  lastSeen: string;
  activeDays: number;
  totalTxns: number;
  avgTxnsPerDay: number;
  peakDay: { date: string; count: number; volume: number };
  observedGaps: { startDate: string; endDate: string; gapDays: number }[];
  newCounterpartiesTimeline: { date: string; counterparty: string; txnId: string; amount: number }[];
}

export interface PeriodComparisonData {
  periodA: {
    label: string;
    startDate: string;
    endDate: string;
    txnsCount: number;
    totalIn: number;
    totalOut: number;
    activeAccounts: number;
    counterpartiesCount: number;
  };
  periodB: {
    label: string;
    startDate: string;
    endDate: string;
    txnsCount: number;
    totalIn: number;
    totalOut: number;
    activeAccounts: number;
    counterpartiesCount: number;
  };
  diffCount: number;
  pctCount: number;
  diffVolume: number;
  pctVolume: number;
}

export interface TimelineAnnotation {
  id: string;
  caseId?: string;
  timestamp: string;
  date: string;
  annotationType: 'Observation' | 'Question' | 'Lead' | 'Important Event' | 'Follow-up';
  content: string;
  author: string;
  relatedAccountId?: string;
  relatedTxnId?: string;
  createdAt: string;
}

export interface SavedTimelineView {
  id: string;
  title: string;
  caseId?: string;
  selectedAccountIds: string[];
  dateRange: { start?: string; end?: string; preset?: DateRangePreset };
  zoomLevel: TimelineZoomLevel;
  filters: {
    channel?: string;
    txnType?: string;
    minAmount?: number;
    maxAmount?: number;
    eventCategory?: EventCategory;
  };
  createdAt: string;
}
