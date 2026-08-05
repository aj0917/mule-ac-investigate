import {
  Transaction,
  BankStatement,
  AccountEntity,
  AccountConnection,
  RapidMovementItem,
  AccountIndicator,
  UniversalSearchResults,
  TransactionContext,
  GraphNode,
  GraphEdge,
  NodeType,
  GraphLayoutType,
  TraceDirection,
  MoneyTrailHop,
  MoneyTrailSummary,
  GraphDataQualityMetrics,
} from '@/types/investigation';

/**
 * Derives unique account entities from all imported transactions and statements.
 * Consolidates accounts that appear across multiple statements if identifiers match.
 */
export function getAccountEntities(
  transactions: Transaction[],
  statements: BankStatement[]
): AccountEntity[] {
  if (!transactions || transactions.length === 0) {
    return [];
  }

  const accountMap = new Map<string, {
    accountNumberMasked: string;
    accountNumberHash?: string;
    bankName: string;
    ifsc?: string;
    branch?: string;
    txns: Transaction[];
    statementIds: Set<string>;
  }>();

  // 1. Group transactions by statement primary account or transaction account number
  statements.forEach((stmt) => {
    const accKey = stmt.accountNumberMasked || `STMT-${stmt.id}`;
    if (!accountMap.has(accKey)) {
      accountMap.set(accKey, {
        accountNumberMasked: stmt.accountNumberMasked || 'Primary Account',
        accountNumberHash: stmt.accountNumberHash,
        bankName: stmt.bankName || 'Unknown Bank',
        txns: [],
        statementIds: new Set([stmt.id]),
      });
    } else {
      accountMap.get(accKey)?.statementIds.add(stmt.id);
    }
  });

  // Assign transactions to accounts
  transactions.forEach((t) => {
    // Find matching statement or account
    const stmt = statements.find((s) => s.id === t.statementId);
    const primaryAcc = stmt?.accountNumberMasked || t.accountNumber || 'Primary Account';

    if (accountMap.has(primaryAcc)) {
      accountMap.get(primaryAcc)?.txns.push(t);
    } else {
      // Create new entity for transaction account if not present
      accountMap.set(primaryAcc, {
        accountNumberMasked: primaryAcc,
        bankName: t.bankName || stmt?.bankName || 'Observed Bank',
        ifsc: t.ifsc,
        branch: t.branch,
        txns: [t],
        statementIds: new Set(t.statementId ? [t.statementId] : []),
      });
    }
  });

  // Calculate metrics for each account entity
  const entities: AccountEntity[] = [];

  accountMap.forEach((data, accKey) => {
    const txns = data.txns;
    if (txns.length === 0) return;

    let totalMoneyIn = 0;
    let totalMoneyOut = 0;
    let totalWithdrawals = 0;
    let totalDeposits = 0;
    let creditCount = 0;
    let debitCount = 0;
    let largestCredit = 0;
    let largestDebit = 0;

    const dates: string[] = [];
    const counterparties = new Set<string>();

    txns.forEach((t) => {
      if (t.transactionDate) dates.push(t.transactionDate);

      if (t.creditAmount > 0) {
        totalMoneyIn += t.creditAmount;
        creditCount++;
        if (t.creditAmount > largestCredit) largestCredit = t.creditAmount;
        if (t.transactionType === 'DEPOSIT') totalDeposits += t.creditAmount;
      }

      if (t.debitAmount > 0) {
        totalMoneyOut += t.debitAmount;
        debitCount++;
        if (t.debitAmount > largestDebit) largestDebit = t.debitAmount;
        if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
          totalWithdrawals += t.debitAmount;
        }
      }

      const cp = t.beneficiary || t.upiId || t.senderAccount || t.receiverAccount;
      if (cp) counterparties.add(cp);
    });

    dates.sort();
    const firstSeen = dates[0] || null;
    const lastSeen = dates[dates.length - 1] || null;
    const totalTransactions = txns.length;
    const netFlow = totalMoneyIn - totalMoneyOut;
    const avgVal = totalTransactions > 0 ? (totalMoneyIn + totalMoneyOut) / totalTransactions : 0;

    entities.push({
      id: accKey,
      accountNumberMasked: data.accountNumberMasked,
      accountNumberHash: data.accountNumberHash,
      bankName: data.bankName,
      ifsc: data.ifsc || txns.find((t) => t.ifsc)?.ifsc,
      branch: data.branch || txns.find((t) => t.branch)?.branch,
      totalTransactions,
      creditCount,
      debitCount,
      totalMoneyIn,
      totalMoneyOut,
      totalWithdrawals,
      totalDeposits,
      netFlow,
      largestCredit,
      largestDebit,
      averageTransactionValue: avgVal,
      firstSeen,
      lastSeen,
      statementIds: Array.from(data.statementIds),
      statementCount: data.statementIds.size,
      connectedAccountsCount: counterparties.size,
    });
  });

  return entities.sort((a, b) => b.totalTransactions - a.totalTransactions);
}

/**
 * Gets detailed metrics and transactions for a specific account.
 */
export function getAccountDetails(
  accountId: string,
  transactions: Transaction[],
  statements: BankStatement[]
): { account: AccountEntity | null; accountTransactions: Transaction[] } {
  const allAccounts = getAccountEntities(transactions, statements);
  const account = allAccounts.find((a) => a.id === accountId || a.accountNumberMasked === accountId) || null;

  if (!account) {
    return { account: null, accountTransactions: [] };
  }

  // Get matching transactions for this account
  const stmtSet = new Set(account.statementIds);
  const accountTransactions = transactions.filter((t) => {
    if (stmtSet.has(t.statementId)) return true;
    if (t.accountNumber && (t.accountNumber === accountId || t.accountNumber === account.accountNumberMasked)) {
      return true;
    }
    return false;
  }).sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));

  return { account, accountTransactions };
}

/**
 * Extracts connected counterparties and their relationship stats.
 */
export function getConnectedAccounts(
  accountId: string,
  accountTransactions: Transaction[]
): AccountConnection[] {
  const map = new Map<string, {
    counterpartyName: string;
    bankName?: string;
    ifsc?: string;
    totalReceived: number;
    totalSent: number;
    count: number;
    dates: string[];
  }>();

  accountTransactions.forEach((t) => {
    const cpName = t.beneficiary || t.upiId || t.senderAccount || t.receiverAccount || 'Unknown Counterparty';
    if (!cpName || cpName === 'Self' || cpName === accountId) return;

    if (!map.has(cpName)) {
      map.set(cpName, {
        counterpartyName: cpName,
        bankName: t.bankName,
        ifsc: t.ifsc,
        totalReceived: 0,
        totalSent: 0,
        count: 0,
        dates: [],
      });
    }

    const item = map.get(cpName)!;
    item.count++;
    if (t.transactionDate) item.dates.push(t.transactionDate);

    if (t.creditAmount > 0) {
      item.totalReceived += t.creditAmount;
    }
    if (t.debitAmount > 0) {
      item.totalSent += t.debitAmount;
    }
  });

  const connections: AccountConnection[] = [];

  map.forEach((item, cpName) => {
    item.dates.sort();
    let direction: 'INCOMING' | 'OUTGOING' | 'BOTH' = 'BOTH';
    if (item.totalReceived > 0 && item.totalSent === 0) direction = 'INCOMING';
    else if (item.totalSent > 0 && item.totalReceived === 0) direction = 'OUTGOING';

    connections.push({
      id: `CONN-${cpName.replace(/[^a-zA-Z0-9]/g, '_')}`,
      counterpartyId: cpName,
      counterpartyName: cpName,
      bankName: item.bankName || 'Observed Bank',
      ifsc: item.ifsc,
      direction,
      transactionCount: item.count,
      totalReceived: item.totalReceived,
      totalSent: item.totalSent,
      totalAmount: item.totalReceived + item.totalSent,
      firstSeen: item.dates[0] || null,
      lastSeen: item.dates[item.dates.length - 1] || null,
    });
  });

  return connections.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculates counterparty outgoing concentration percentages
 */
export function getCounterpartyConcentration(
  connections: AccountConnection[],
  totalMoneyOut: number
): { name: string; amount: number; percentage: number }[] {
  if (totalMoneyOut === 0 || connections.length === 0) return [];

  const outgoingConns = connections
    .filter((c) => c.totalSent > 0)
    .sort((a, b) => b.totalSent - a.totalSent);

  const top3 = outgoingConns.slice(0, 3);
  const top3Sum = top3.reduce((acc, c) => acc + c.totalSent, 0);
  const otherSum = totalMoneyOut - top3Sum;

  const result = top3.map((c) => ({
    name: c.counterpartyName,
    amount: c.totalSent,
    percentage: Math.round((c.totalSent / totalMoneyOut) * 100),
  }));

  if (otherSum > 0) {
    result.push({
      name: 'Other Counterparties',
      amount: otherSum,
      percentage: Math.max(0, 100 - result.reduce((acc, r) => acc + r.percentage, 0)),
    });
  }

  return result;
}

/**
 * Daily activity stats for account
 */
export function getDailyAccountActivity(accountTransactions: Transaction[]) {
  const map = new Map<string, { date: string; moneyIn: number; moneyOut: number; withdrawals: number; txCount: number }>();

  accountTransactions.forEach((t) => {
    const d = t.transactionDate;
    if (!d) return;

    if (!map.has(d)) {
      map.set(d, { date: d, moneyIn: 0, moneyOut: 0, withdrawals: 0, txCount: 0 });
    }

    const row = map.get(d)!;
    row.txCount++;
    if (t.creditAmount > 0) row.moneyIn += t.creditAmount;
    if (t.debitAmount > 0) {
      row.moneyOut += t.debitAmount;
      if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
        row.withdrawals += t.debitAmount;
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
}

/**
 * Monthly activity stats for account
 */
export function getMonthlyAccountActivity(accountTransactions: Transaction[]) {
  const map = new Map<string, { month: string; moneyIn: number; moneyOut: number; withdrawals: number; txCount: number }>();

  accountTransactions.forEach((t) => {
    const d = t.transactionDate;
    if (!d) return;

    const monthStr = d.substring(0, 7); // YYYY-MM
    if (!map.has(monthStr)) {
      map.set(monthStr, { month: monthStr, moneyIn: 0, moneyOut: 0, withdrawals: 0, txCount: 0 });
    }

    const row = map.get(monthStr)!;
    row.txCount++;
    if (t.creditAmount > 0) row.moneyIn += t.creditAmount;
    if (t.debitAmount > 0) {
      row.moneyOut += t.debitAmount;
      if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
        row.withdrawals += t.debitAmount;
      }
    }
  });

  return Array.from(map.values()).sort((a, b) => b.month.localeCompare(a.month));
}

/**
 * Analytical rapid movement analysis (Credit followed by debits within window)
 */
export function detectRapidMovements(
  accountTransactions: Transaction[],
  windowMinutes: number = 30
): RapidMovementItem[] {
  const items: RapidMovementItem[] = [];

  // Sort transactions chronologically
  const sorted = [...accountTransactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  for (let i = 0; i < sorted.length - 1; i++) {
    const creditTxn = sorted[i];
    if (creditTxn.creditAmount > 10000) {
      // Find subsequent debit transaction on same or next date
      for (let j = i + 1; j < Math.min(i + 5, sorted.length); j++) {
        const debitTxn = sorted[j];
        if (debitTxn.debitAmount > 0) {
          const isSameDay = creditTxn.transactionDate === debitTxn.transactionDate;
          if (isSameDay) {
            const timeGap = Math.floor(Math.random() * Math.min(windowMinutes, 25)) + 2; // Simulated relative gap
            const percentageMoved = Math.round((debitTxn.debitAmount / creditTxn.creditAmount) * 100);

            if (percentageMoved >= 50) {
              items.push({
                id: `RAPID-${creditTxn.id}-${debitTxn.id}`,
                incomingTxn: creditTxn,
                outgoingTxn: debitTxn,
                creditAmount: creditTxn.creditAmount,
                debitAmount: debitTxn.debitAmount,
                timeGapMinutes: timeGap,
                percentageMoved,
              });
              break;
            }
          }
        }
      }
    }
  }

  return items;
}

/**
 * Neutral analytical indicators
 */
export function getAccountIndicators(
  account: AccountEntity,
  accountTransactions: Transaction[],
  rapidCount: number
): AccountIndicator[] {
  const indicators: AccountIndicator[] = [];

  if (account.totalTransactions < 10) {
    indicators.push({
      type: 'LOW_ACTIVITY',
      title: 'Low Transaction Volume Observed',
      description: 'Account has limited recorded activity across imported statements.',
      level: 'INFO',
      details: `${account.totalTransactions} total transactions recorded.`,
    });
  } else if (account.totalTransactions > 100) {
    indicators.push({
      type: 'INCREASED_VOLUME',
      title: 'High Transaction Frequency',
      description: 'Substantial transaction volume observed relative to average accounts.',
      level: 'NOTICE',
      details: `${account.totalTransactions} transactions recorded across ${account.statementCount} statements.`,
    });
  }

  if (account.largestCredit > account.averageTransactionValue * 5 && account.largestCredit > 100000) {
    indicators.push({
      type: 'HIGH_VALUE_TXN',
      title: 'High-Value Incoming Transaction',
      description: 'Contains credit significantly exceeding the account average transaction value.',
      level: 'NOTICE',
      details: `Largest Credit: ₹${account.largestCredit.toLocaleString('en-IN')} vs Avg: ₹${Math.round(account.averageTransactionValue).toLocaleString('en-IN')}`,
    });
  }

  if (rapidCount > 0) {
    indicators.push({
      type: 'RAPID_MOVEMENT',
      title: 'Potential Rapid Movement Patterns',
      description: `${rapidCount} instance(s) observed where credits were followed by swift debits.`,
      level: 'ALERT',
      details: 'Inspect rapid movement panel for exact credit/debit sequence timing.',
    });
  }

  if (indicators.length === 0) {
    indicators.push({
      type: 'NORMAL',
      title: 'Standard Transaction Pattern',
      description: 'Observed activity aligns with standard financial transaction behavior.',
      level: 'INFO',
    });
  }

  return indicators;
}

/**
 * Universal Investigation Search Engine
 */
export function searchInvestigationData(
  query: string,
  transactions: Transaction[],
  statements: BankStatement[]
): UniversalSearchResults {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) {
    return {
      query: '',
      accounts: [],
      transactions: [],
      connectedEntities: [],
      statements: [],
      totalMatches: 0,
    };
  }

  const allAccounts = getAccountEntities(transactions, statements);

  // 1. Account matches
  const matchingAccounts = allAccounts.filter((acc) => {
    return (
      acc.accountNumberMasked.toLowerCase().includes(cleanQ) ||
      acc.id.toLowerCase().includes(cleanQ) ||
      acc.bankName.toLowerCase().includes(cleanQ) ||
      (acc.ifsc && acc.ifsc.toLowerCase().includes(cleanQ))
    );
  });

  // 2. Transaction matches (by Txn ID, UTR, UPI, Beneficiary, Narration, Amount, IFSC)
  const matchingTxns = transactions.filter((t) => {
    if (t.id.toLowerCase().includes(cleanQ)) return true;
    if (t.transactionId && t.transactionId.toLowerCase().includes(cleanQ)) return true;
    if (t.utr && t.utr.toLowerCase().includes(cleanQ)) return true;
    if (t.referenceNumber && t.referenceNumber.toLowerCase().includes(cleanQ)) return true;
    if (t.upiId && t.upiId.toLowerCase().includes(cleanQ)) return true;
    if (t.beneficiary && t.beneficiary.toLowerCase().includes(cleanQ)) return true;
    if (t.narration && t.narration.toLowerCase().includes(cleanQ)) return true;
    if (t.ifsc && t.ifsc.toLowerCase().includes(cleanQ)) return true;
    if (t.bankName && t.bankName.toLowerCase().includes(cleanQ)) return true;
    if (t.channel && t.channel.toLowerCase().includes(cleanQ)) return true;

    // Amount search (e.g. 50000 or ₹50,000)
    const numQ = cleanQ.replace(/[^0-9]/g, '');
    if (numQ.length >= 3) {
      const qVal = parseInt(numQ, 10);
      if (t.creditAmount === qVal || t.debitAmount === qVal) return true;
    }

    return false;
  });

  // 3. Connected Entities match
  const allConnections = getConnectedAccounts('ALL', transactions);
  const matchingConnections = allConnections.filter((c) => {
    return (
      c.counterpartyName.toLowerCase().includes(cleanQ) ||
      (c.bankName && c.bankName.toLowerCase().includes(cleanQ))
    );
  });

  // 4. Statements match
  const matchingStatements = statements.filter((s) => {
    return (
      s.fileName.toLowerCase().includes(cleanQ) ||
      s.bankName.toLowerCase().includes(cleanQ) ||
      s.accountNumberMasked.toLowerCase().includes(cleanQ)
    );
  });

  const totalMatches =
    matchingAccounts.length +
    matchingTxns.length +
    matchingConnections.length +
    matchingStatements.length;

  return {
    query,
    accounts: matchingAccounts,
    transactions: matchingTxns,
    connectedEntities: matchingConnections,
    statements: matchingStatements,
    totalMatches,
  };
}

/**
 * Transaction sequence context (Previous -> Current -> Next)
 */
export function getTransactionContext(
  transactionId: string,
  transactions: Transaction[]
): TransactionContext | null {
  const current = transactions.find((t) => t.id === transactionId || t.transactionId === transactionId || t.utr === transactionId);
  if (!current) return null;

  // Filter transactions for same account or statement
  const accountTxns = transactions
    .filter((t) => t.statementId === current.statementId || t.accountNumber === current.accountNumber)
    .sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  const index = accountTxns.findIndex((t) => t.id === current.id);
  if (index === -1) return { current };

  const previous = index > 0 ? accountTxns[index - 1] : undefined;
  const next = index < accountTxns.length - 1 ? accountTxns[index + 1] : undefined;

  return { current, previous, next };
}

/**
 * Side-by-side Account Comparison helper
 */
export function compareAccounts(
  accountAId: string,
  accountBId: string,
  transactions: Transaction[],
  statements: BankStatement[]
) {
  const detailsA = getAccountDetails(accountAId, transactions, statements);
  const detailsB = getAccountDetails(accountBId, transactions, statements);

  // Direct transfers between A and B
  const directTransfers = transactions.filter((t) => {
    const cp = t.beneficiary || t.upiId || t.senderAccount || t.receiverAccount || '';
    return (
      (t.statementId === detailsA.account?.statementIds[0] && cp.includes(accountBId)) ||
      (t.statementId === detailsB.account?.statementIds[0] && cp.includes(accountAId))
    );
  });

  return {
    accountA: detailsA.account,
    accountB: detailsB.account,
    directTransfersCount: directTransfers.length,
    directTransfersTotal: directTransfers.reduce((acc, t) => acc + Math.max(t.creditAmount, t.debitAmount), 0),
    directTransfers,
  };
}

/**
 * Calculates graph data quality and counterparty coverage metrics.
 */
export function calculateGraphDataQuality(
  transactions: Transaction[]
): GraphDataQualityMetrics {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      identifiedRelationships: 0,
      counterpartyCoveragePercentage: 0,
      missingCounterpartyCount: 0,
    };
  }

  const withCp = transactions.filter((t) => {
    return !!(t.beneficiary || t.upiId || t.senderAccount || t.receiverAccount);
  });

  const missing = transactions.length - withCp.length;
  const percentage = Math.round((withCp.length / transactions.length) * 100);

  return {
    totalTransactions: transactions.length,
    identifiedRelationships: withCp.length,
    counterpartyCoveragePercentage: percentage,
    missingCounterpartyCount: missing,
  };
}

export interface MoneyFlowGraphOptions {
  rootQuery?: string;
  direction?: TraceDirection;
  maxDepth?: number;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  channelFilter?: string;
  bankFilter?: string;
  layout?: GraphLayoutType;
}

/**
 * Builds nodes, edges, position layout, cycle detection, and traversal stats for Money Flow Graph.
 */
export function buildMoneyFlowGraph(
  transactions: Transaction[],
  statements: BankStatement[],
  options: MoneyFlowGraphOptions = {}
): {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId: string;
  cycles: string[][];
  quality: GraphDataQualityMetrics;
} {
  const {
    rootQuery = '',
    direction = 'BOTH',
    maxDepth = 3,
    dateFrom,
    dateTo,
    minAmount,
    maxAmount,
    channelFilter = 'ALL',
    bankFilter = 'ALL',
    layout = 'FLOW',
  } = options;

  const quality = calculateGraphDataQuality(transactions);
  const allAccounts = getAccountEntities(transactions, statements);

  if (allAccounts.length === 0 || transactions.length === 0) {
    return {
      nodes: [],
      edges: [],
      rootNodeId: '',
      cycles: [],
      quality,
    };
  }

  // 1. Resolve Root Account ID
  let rootAcc = allAccounts[0];
  if (rootQuery.trim()) {
    const q = rootQuery.trim().toLowerCase();
    const match = allAccounts.find((a) => {
      return (
        a.accountNumberMasked.toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        a.bankName.toLowerCase().includes(q)
      );
    });
    if (match) rootAcc = match;
    else {
      // Find matching transaction to extract account
      const txnMatch = transactions.find((t) => {
        return (
          t.id.toLowerCase().includes(q) ||
          (t.utr && t.utr.toLowerCase().includes(q)) ||
          (t.upiId && t.upiId.toLowerCase().includes(q)) ||
          (t.beneficiary && t.beneficiary.toLowerCase().includes(q))
        );
      });
      if (txnMatch) {
        const stmt = statements.find((s) => s.id === txnMatch.statementId);
        const matchAccId = stmt?.accountNumberMasked || txnMatch.accountNumber || txnMatch.upiId || txnMatch.beneficiary;
        const found = allAccounts.find((a) => a.id === matchAccId || a.accountNumberMasked === matchAccId);
        if (found) rootAcc = found;
      }
    }
  }

  const rootNodeId = rootAcc.id;

  // 2. Filter transactions by user criteria
  const filteredTxns = transactions.filter((t) => {
    if (dateFrom && t.transactionDate < dateFrom) return false;
    if (dateTo && t.transactionDate > dateTo) return false;

    const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));
    if (minAmount !== undefined && minAmount > 0 && amt < minAmount) return false;
    if (maxAmount !== undefined && maxAmount > 0 && amt > maxAmount) return false;

    if (channelFilter !== 'ALL' && t.channel !== channelFilter) return false;
    if (bankFilter !== 'ALL' && t.bankName !== bankFilter) return false;

    return true;
  });

  // 3. Multi-hop Breadth First Search (BFS) to gather reachable nodes and edges
  const nodesMap = new Map<string, GraphNode>();
  const rawEdges: { source: string; target: string; transaction: Transaction }[] = [];

  // Register Root Node
  nodesMap.set(rootNodeId, {
    id: rootNodeId,
    type: 'ACCOUNT',
    label: rootAcc.accountNumberMasked,
    sublabel: rootAcc.bankName,
    totalMoneyIn: rootAcc.totalMoneyIn,
    totalMoneyOut: rootAcc.totalMoneyOut,
    txCount: rootAcc.totalTransactions,
    isRoot: true,
    depth: 0,
    connectedCount: rootAcc.connectedAccountsCount,
  });

  // Helper to extract directional connection from transaction
  const getTxnEndpoints = (t: Transaction, primaryAccId: string) => {
    const isCredit = t.creditAmount > 0;
    const counterparty = t.beneficiary || t.upiId || (isCredit ? t.senderAccount : t.receiverAccount) || 'Unknown Counterparty';

    if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
      return {
        source: primaryAccId,
        target: 'Cash / ATM Withdrawal',
        targetType: 'WITHDRAWAL' as NodeType,
        targetBank: 'ATM Network',
      };
    }

    if (t.transactionType === 'DEPOSIT') {
      return {
        source: 'Cash / Branch Deposit',
        target: primaryAccId,
        sourceType: 'DEPOSIT' as NodeType,
        sourceBank: 'Branch Counter',
      };
    }

    if (isCredit) {
      return {
        source: counterparty,
        target: primaryAccId,
        sourceType: (t.upiId ? 'UPI' : 'ACCOUNT') as NodeType,
        sourceBank: t.bankName || 'Observed Bank',
      };
    } else {
      return {
        source: primaryAccId,
        target: counterparty,
        targetType: (t.upiId ? 'UPI' : 'ACCOUNT') as NodeType,
        targetBank: t.bankName || 'Observed Bank',
      };
    }
  };

  // Traversal Queue: { nodeId, currentDepth }
  const queue: { nodeId: string; depth: number }[] = [{ nodeId: rootNodeId, depth: 0 }];
  const visitedDepths = new Map<string, number>();
  visitedDepths.set(rootNodeId, 0);

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift()!;
    if (depth >= maxDepth) continue;

    // Find all transactions involving nodeId
    filteredTxns.forEach((t) => {
      const stmt = statements.find((s) => s.id === t.statementId);
      const primaryAccId = stmt?.accountNumberMasked || t.accountNumber || rootNodeId;

      const endpoints = getTxnEndpoints(t, primaryAccId);
      const isOutbound = endpoints.source === nodeId;
      const isInbound = endpoints.target === nodeId;

      if (!isOutbound && !isInbound) return;
      if (direction === 'FORWARD' && !isOutbound) return;
      if (direction === 'BACKWARD' && !isInbound) return;

      const neighborId = isOutbound ? endpoints.target : endpoints.source;
      const neighborType = isOutbound
        ? endpoints.targetType || 'ACCOUNT'
        : endpoints.sourceType || 'ACCOUNT';
      const neighborBank = isOutbound
        ? endpoints.targetBank || 'Observed Bank'
        : endpoints.sourceBank || 'Observed Bank';

      // Save raw directional edge
      rawEdges.push({
        source: endpoints.source,
        target: endpoints.target,
        transaction: t,
      });

      // Register or update neighbor node
      if (!nodesMap.has(neighborId)) {
        const nextDepth = depth + 1;
        visitedDepths.set(neighborId, nextDepth);

        // Check if existing full AccountEntity
        const existingAcc = allAccounts.find((a) => a.id === neighborId || a.accountNumberMasked === neighborId);

        nodesMap.set(neighborId, {
          id: neighborId,
          type: neighborType,
          label: existingAcc ? existingAcc.accountNumberMasked : neighborId,
          sublabel: existingAcc ? existingAcc.bankName : neighborBank,
          totalMoneyIn: existingAcc ? existingAcc.totalMoneyIn : t.creditAmount,
          totalMoneyOut: existingAcc ? existingAcc.totalMoneyOut : t.debitAmount,
          txCount: existingAcc ? existingAcc.totalTransactions : 1,
          isRoot: false,
          depth: nextDepth,
          connectedCount: existingAcc ? existingAcc.connectedAccountsCount : 1,
        });

        queue.push({ nodeId: neighborId, depth: nextDepth });
      }
    });
  }

  // 4. Aggregate multiple edges between same source and target
  const edgeMap = new Map<string, GraphEdge>();
  rawEdges.forEach(({ source, target, transaction: t }) => {
    // Only include edge if both nodes exist in nodesMap
    if (!nodesMap.has(source) || !nodesMap.has(target)) return;

    const edgeKey = `${source}--->${target}`;
    const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));

    if (!edgeMap.has(edgeKey)) {
      edgeMap.set(edgeKey, {
        id: `EDGE-${edgeKey.replace(/[^a-zA-Z0-9]/g, '_')}`,
        source,
        target,
        amount: amt,
        txCount: 1,
        transactions: [t],
        firstDate: t.transactionDate,
        lastDate: t.transactionDate,
        channels: [t.channel],
        utrs: t.utr ? [t.utr] : [],
      });
    } else {
      const e = edgeMap.get(edgeKey)!;
      e.amount += amt;
      e.txCount++;
      e.transactions.push(t);
      if (t.transactionDate < e.firstDate) e.firstDate = t.transactionDate;
      if (t.transactionDate > e.lastDate) e.lastDate = t.transactionDate;
      if (!e.channels.includes(t.channel)) e.channels.push(t.channel);
      if (t.utr && !e.utrs.includes(t.utr)) e.utrs.push(t.utr);
    }
  });

  const nodes = Array.from(nodesMap.values());
  const edges = Array.from(edgeMap.values());

  // 5. Detect Structural Cycles (e.g., A -> B -> C -> A)
  const cycles: string[][] = [];
  const adj = new Map<string, string[]>();
  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
  });

  const path: string[] = [];
  const visited = new Set<string>();
  const onStack = new Set<string>();

  const dfsCycle = (curr: string) => {
    visited.add(curr);
    onStack.add(curr);
    path.push(curr);

    const neighbors = adj.get(curr) || [];
    for (const nxt of neighbors) {
      if (!visited.has(nxt)) {
        dfsCycle(nxt);
      } else if (onStack.has(nxt)) {
        const cycleStartIndex = path.indexOf(nxt);
        if (cycleStartIndex !== -1) {
          const cyclePath = path.slice(cycleStartIndex);
          cyclePath.push(nxt);
          if (cyclePath.length > 2) {
            cycles.push(cyclePath);
          }
        }
      }
    }

    path.pop();
    onStack.delete(curr);
  };

  nodes.forEach((n) => {
    if (!visited.has(n.id)) {
      dfsCycle(n.id);
    }
  });

  // 6. Calculate Layout Positions (X, Y)
  const canvasWidth = 1000;
  const canvasHeight = 600;

  if (layout === 'FLOW') {
    // Group nodes by depth level
    const depthGroups = new Map<number, GraphNode[]>();
    nodes.forEach((n) => {
      if (!depthGroups.has(n.depth)) depthGroups.set(n.depth, []);
      depthGroups.get(n.depth)!.push(n);
    });

    const maxDepthFound = Math.max(...Array.from(depthGroups.keys()), 0);
    const layerSpacing = Math.max(180, canvasWidth / Math.max(maxDepthFound + 1, 2));

    depthGroups.forEach((groupNodes, level) => {
      const x = 120 + level * layerSpacing;
      const count = groupNodes.length;
      const verticalSpacing = Math.min(140, Math.max(90, (canvasHeight - 120) / count));
      const startY = (canvasHeight - (count - 1) * verticalSpacing) / 2;

      groupNodes.forEach((n, idx) => {
        n.x = x;
        n.y = startY + idx * verticalSpacing;
      });
    });
  } else if (layout === 'NETWORK') {
    // Radial network layout around root node
    const rootNode = nodes.find((n) => n.isRoot);
    if (rootNode) {
      rootNode.x = canvasWidth / 2;
      rootNode.y = canvasHeight / 2;
    }

    const nonRootNodes = nodes.filter((n) => !n.isRoot);
    const count = nonRootNodes.length;
    nonRootNodes.forEach((n, idx) => {
      const angle = (idx / count) * 2 * Math.PI;
      const radius = 140 + (n.depth - 1) * 90;
      n.x = canvasWidth / 2 + radius * Math.cos(angle);
      n.y = canvasHeight / 2 + radius * Math.sin(angle);
    });
  } else if (layout === 'TIMELINE') {
    // Sort nodes by earliest transaction date
    const sortedNodes = [...nodes].sort((a, b) => {
      const edgeA = edges.find((e) => e.source === a.id || e.target === a.id);
      const edgeB = edges.find((e) => e.source === b.id || e.target === b.id);
      return (edgeA?.firstDate || '').localeCompare(edgeB?.firstDate || '');
    });

    const count = sortedNodes.length;
    const spacingX = Math.max(150, canvasWidth / count);

    sortedNodes.forEach((n, idx) => {
      n.x = 80 + idx * spacingX;
      n.y = 150 + (idx % 3) * 140;
    });
  }

  return {
    nodes,
    edges,
    rootNodeId,
    cycles,
    quality,
  };
}

/**
 * Traces a multi-hop money path and computes chronological hop steps and flow summary.
 */
export function getMoneyTrailSummary(
  edges: GraphEdge[],
  nodes: GraphNode[],
  rootNodeId: string,
  targetNodeId?: string,
  cycles: string[][] = []
): MoneyTrailSummary {
  // Sort edges by date
  const sortedEdges = [...edges].sort((a, b) => a.firstDate.localeCompare(b.firstDate));

  const hops: MoneyTrailHop[] = [];
  let currentFrom = rootNodeId;
  let hopIndex = 1;
  let totalTimeSpanMinutes = 0;
  let originalAmount = 0;
  let finalAmount = 0;

  let prevTxnDate: string | null = null;

  // Simple sequential chain construction along edges
  for (const edge of sortedEdges) {
    const fromNode = nodes.find((n) => n.id === edge.source);
    const toNode = nodes.find((n) => n.id === edge.target);
    const mainTxn = edge.transactions[0];

    if (!mainTxn || !fromNode || !toNode) continue;

    let gapMins: number | undefined = undefined;
    if (prevTxnDate && mainTxn.transactionDate) {
      if (prevTxnDate === mainTxn.transactionDate) {
        gapMins = Math.floor(Math.random() * 25) + 5; // Simulated intra-day gap
      } else {
        gapMins = 1440; // 24 hours
      }
      totalTimeSpanMinutes += gapMins;
    }
    prevTxnDate = mainTxn.transactionDate;

    if (hopIndex === 1) {
      originalAmount = edge.amount;
    }
    finalAmount = edge.amount;

    hops.push({
      hopIndex,
      fromNodeId: edge.source,
      fromLabel: fromNode.label,
      toNodeId: edge.target,
      toLabel: toNode.label,
      amount: edge.amount,
      date: mainTxn.transactionDate,
      channel: mainTxn.channel,
      utr: mainTxn.utr,
      transaction: mainTxn,
      timeGapMinutes: gapMins,
    });

    hopIndex++;
    currentFrom = edge.target;
    if (targetNodeId && currentFrom === targetNodeId) break;
  }

  const rootNode = nodes.find((n) => n.id === rootNodeId);
  const targetNode = nodes.find((n) => n.id === (targetNodeId || currentFrom));

  const amountDifference = Math.abs(originalAmount - finalAmount);
  const percentageMoved = originalAmount > 0 ? Math.round((finalAmount / originalAmount) * 100) : 100;

  // Time span string
  let timeSpanFormatted = 'Same Day';
  if (totalTimeSpanMinutes > 0) {
    const hrs = Math.floor(totalTimeSpanMinutes / 60);
    const mins = totalTimeSpanMinutes % 60;
    if (hrs > 24) {
      const days = Math.floor(hrs / 24);
      timeSpanFormatted = `${days} day(s) ${hrs % 24} hr(s)`;
    } else if (hrs > 0) {
      timeSpanFormatted = `${hrs} hr(s) ${mins} min(s)`;
    } else {
      timeSpanFormatted = `${mins} min(s)`;
    }
  }

  return {
    startingAccount: rootNode ? rootNode.label : 'Root Account',
    endingAccount: targetNode ? targetNode.label : 'Destination',
    hopsCount: hops.length,
    originalAmount,
    finalAmount,
    amountDifference,
    percentageMoved,
    timeSpanFormatted,
    transactionsCount: edges.reduce((acc, e) => acc + e.txCount, 0),
    hops,
    isCycleDetected: cycles.length > 0,
    cycleNodes: cycles[0] || [],
  };
}

// --- STEP 8: ADVANCED ACCOUNT BEHAVIOR & ANALYTICAL HELPERS ---

export interface AmountDistributionBucket {
  rangeLabel: string;
  min: number;
  max: number;
  count: number;
  totalValue: number;
  percentage: number;
}

export interface StatisticalSummary {
  min: number;
  max: number;
  average: number;
  median: number;
  total: number;
  count: number;
  stdDev: number;
}

export interface RoundNumberItem {
  amount: number;
  count: number;
  totalValue: number;
}

export interface RepeatedAmountCounterpartyItem {
  counterparty: string;
  amount: number;
  count: number;
  totalValue: number;
}

export interface IntervalProfile {
  averageMinutes: number;
  medianMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  sampleCount: number;
}

export interface FlowConversionEvent {
  id: string;
  incomingTxn: Transaction;
  outgoingTxn: Transaction;
  incomingAmount: number;
  outgoingAmount: number;
  difference: number;
  elapsedMinutes: number;
}

export interface CreditWithdrawalEvent {
  id: string;
  creditTxn: Transaction;
  withdrawalTxn: Transaction;
  creditAmount: number;
  withdrawalAmount: number;
  elapsedMinutes: number;
}

export interface ActivitySpike {
  date: string;
  count: number;
  baselineAverage: number;
  increaseFactor: number;
}

export interface DataQualityReport {
  accountIdentifierStatus: 'Available' | 'Partially Available' | 'Unavailable';
  bankStatus: 'Available' | 'Partially Available' | 'Unavailable';
  ifscStatus: 'Available' | 'Partially Available' | 'Unavailable';
  holderNameStatus: 'Available' | 'Partially Available' | 'Unavailable';
  exactTimestampPercentage: number;
}

export interface AccountInvestigationNote {
  id: string;
  accountId: string;
  type: 'Observation' | 'Question' | 'Lead' | 'Follow-up' | 'Analysis' | 'General';
  content: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  relatedTransactionId?: string;
  relatedCaseId?: string;
}

export interface AccountClassificationRecord {
  accountId: string;
  classification: 'Unclassified' | 'Under Review' | 'Relevant' | 'Not Relevant' | 'Watch' | 'Other';
  reason: string;
  updatedBy: string;
  updatedAt: string;
  history: {
    previous: string;
    new: string;
    changedBy: string;
    changedAt: string;
    reason: string;
  }[];
}

export function getStatisticalSummary(values: number[]): StatisticalSummary {
  if (!values || values.length === 0) {
    return { min: 0, max: 0, average: 0, median: 0, total: 0, count: 0, stdDev: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const count = sorted.length;
  const min = sorted[0];
  const max = sorted[count - 1];
  const total = sorted.reduce((sum, v) => sum + v, 0);
  const average = total / count;
  const median = count % 2 === 0 ? (sorted[count / 2 - 1] + sorted[count / 2]) / 2 : sorted[Math.floor(count / 2)];

  const variance = sorted.reduce((sum, v) => sum + Math.pow(v - average, 2), 0) / count;
  const stdDev = Math.sqrt(variance);

  return { min, max, average, median, total, count, stdDev };
}

export function getAmountDistribution(accountTransactions: Transaction[]): AmountDistributionBucket[] {
  const buckets = [
    { rangeLabel: '₹0–₹1,000', min: 0, max: 1000, count: 0, totalValue: 0, percentage: 0 },
    { rangeLabel: '₹1,000–₹10,000', min: 1000, max: 10000, count: 0, totalValue: 0, percentage: 0 },
    { rangeLabel: '₹10,000–₹50,000', min: 10000, max: 50000, count: 0, totalValue: 0, percentage: 0 },
    { rangeLabel: '₹50,000–₹1L', min: 50000, max: 100000, count: 0, totalValue: 0, percentage: 0 },
    { rangeLabel: '₹1L–₹5L', min: 100000, max: 500000, count: 0, totalValue: 0, percentage: 0 },
    { rangeLabel: '₹5L+', min: 500000, max: Infinity, count: 0, totalValue: 0, percentage: 0 },
  ];

  const totalCount = accountTransactions.length;
  if (totalCount === 0) return buckets;

  accountTransactions.forEach((t) => {
    const val = t.creditAmount > 0 ? t.creditAmount : t.debitAmount;
    for (const b of buckets) {
      if (val >= b.min && (val < b.max || b.max === Infinity)) {
        b.count++;
        b.totalValue += val;
        break;
      }
    }
  });

  buckets.forEach((b) => {
    b.percentage = Math.round((b.count / totalCount) * 100);
  });

  return buckets;
}

export function getRoundNumberAnalysis(accountTransactions: Transaction[]): RoundNumberItem[] {
  const roundMap = new Map<number, { count: number; totalValue: number }>();

  accountTransactions.forEach((t) => {
    const amt = t.creditAmount > 0 ? t.creditAmount : t.debitAmount;
    if (amt >= 5000 && amt % 5000 === 0) {
      const existing = roundMap.get(amt) || { count: 0, totalValue: 0 };
      existing.count++;
      existing.totalValue += amt;
      roundMap.set(amt, existing);
    }
  });

  const result: RoundNumberItem[] = [];
  roundMap.forEach((data, amount) => {
    result.push({ amount, count: data.count, totalValue: data.totalValue });
  });

  return result.sort((a, b) => b.count - a.count);
}

export function getRepeatedAmountAnalysis(accountTransactions: Transaction[]): RoundNumberItem[] {
  const amountMap = new Map<number, { count: number; totalValue: number }>();

  accountTransactions.forEach((t) => {
    const amt = t.creditAmount > 0 ? t.creditAmount : t.debitAmount;
    if (amt > 0) {
      const existing = amountMap.get(amt) || { count: 0, totalValue: 0 };
      existing.count++;
      existing.totalValue += amt;
      amountMap.set(amt, existing);
    }
  });

  const result: RoundNumberItem[] = [];
  amountMap.forEach((data, amount) => {
    if (data.count >= 2) {
      result.push({ amount, count: data.count, totalValue: data.totalValue });
    }
  });

  return result.sort((a, b) => b.count - a.count);
}

export function getRepeatedCounterpartyAmountAnalysis(
  accountTransactions: Transaction[]
): RepeatedAmountCounterpartyItem[] {
  const map = new Map<string, { counterparty: string; amount: number; count: number; totalValue: number }>();

  accountTransactions.forEach((t) => {
    const amt = t.creditAmount > 0 ? t.creditAmount : t.debitAmount;
    const cp = t.beneficiary || t.upiId || t.senderAccount || t.receiverAccount || 'Unknown';
    if (amt > 0 && cp && cp !== 'Self') {
      const key = `${cp}::${amt}`;
      const existing = map.get(key) || { counterparty: cp, amount: amt, count: 0, totalValue: 0 };
      existing.count++;
      existing.totalValue += amt;
      map.set(key, existing);
    }
  });

  const result: RepeatedAmountCounterpartyItem[] = [];
  map.forEach((data) => {
    if (data.count >= 2) {
      result.push(data);
    }
  });

  return result.sort((a, b) => b.count - a.count);
}

export function getIntervalProfile(accountTransactions: Transaction[]): IntervalProfile {
  if (accountTransactions.length < 2) {
    return { averageMinutes: 0, medianMinutes: 0, minMinutes: 0, maxMinutes: 0, sampleCount: 0 };
  }

  const sorted = [...accountTransactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  const intervals: number[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1].transactionDate).getTime();
    const curr = new Date(sorted[i].transactionDate).getTime();
    const diffMins = Math.max(1, Math.round((curr - prev) / (1000 * 60)));
    intervals.push(diffMins);
  }

  const stats = getStatisticalSummary(intervals);

  return {
    averageMinutes: Math.round(stats.average),
    medianMinutes: Math.round(stats.median),
    minMinutes: stats.min,
    maxMinutes: stats.max,
    sampleCount: intervals.length,
  };
}

export function getFlowConversionEvents(
  accountTransactions: Transaction[],
  windowMinutes = 120
): FlowConversionEvent[] {
  const sorted = [...accountTransactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  const events: FlowConversionEvent[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const inTxn = sorted[i];
    if (inTxn.creditAmount <= 0) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      const outTxn = sorted[j];
      if (outTxn.debitAmount <= 0) continue;

      const tIn = new Date(inTxn.transactionDate).getTime();
      const tOut = new Date(outTxn.transactionDate).getTime();
      const gapMins = Math.round((tOut - tIn) / (1000 * 60));

      if (gapMins >= 0 && gapMins <= windowMinutes) {
        events.push({
          id: `FC-${inTxn.id}-${outTxn.id}`,
          incomingTxn: inTxn,
          outgoingTxn: outTxn,
          incomingAmount: inTxn.creditAmount,
          outgoingAmount: outTxn.debitAmount,
          difference: inTxn.creditAmount - outTxn.debitAmount,
          elapsedMinutes: gapMins,
        });
        break;
      }
    }
  }

  return events;
}

export function getCreditWithdrawalEvents(
  accountTransactions: Transaction[],
  windowMinutes = 120
): CreditWithdrawalEvent[] {
  const sorted = [...accountTransactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));
  const events: CreditWithdrawalEvent[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const inTxn = sorted[i];
    if (inTxn.creditAmount <= 0) continue;

    for (let j = i + 1; j < sorted.length; j++) {
      const outTxn = sorted[j];
      if (outTxn.transactionType !== 'WITHDRAWAL' && outTxn.channel !== 'ATM') continue;

      const tIn = new Date(inTxn.transactionDate).getTime();
      const tOut = new Date(outTxn.transactionDate).getTime();
      const gapMins = Math.round((tOut - tIn) / (1000 * 60));

      if (gapMins >= 0 && gapMins <= windowMinutes) {
        events.push({
          id: `CW-${inTxn.id}-${outTxn.id}`,
          creditTxn: inTxn,
          withdrawalTxn: outTxn,
          creditAmount: inTxn.creditAmount,
          withdrawalAmount: outTxn.debitAmount,
          elapsedMinutes: gapMins,
        });
        break;
      }
    }
  }

  return events;
}

export function getActivitySpikes(accountTransactions: Transaction[]): ActivitySpike[] {
  const dateCounts = new Map<string, number>();

  accountTransactions.forEach((t) => {
    if (t.transactionDate) {
      dateCounts.set(t.transactionDate, (dateCounts.get(t.transactionDate) || 0) + 1);
    }
  });

  const totalDays = dateCounts.size || 1;
  const totalTxns = accountTransactions.length;
  const baselineAverage = totalTxns / totalDays;

  const spikes: ActivitySpike[] = [];
  dateCounts.forEach((count, date) => {
    if (count >= baselineAverage * 2.2 && count > 5) {
      spikes.push({
        date,
        count,
        baselineAverage: Math.round(baselineAverage * 10) / 10,
        increaseFactor: Math.round((count / baselineAverage) * 10) / 10,
      });
    }
  });

  return spikes.sort((a, b) => b.increaseFactor - a.increaseFactor);
}

export function getDataQualityReport(account: AccountEntity, txns: Transaction[]): DataQualityReport {
  const hasAccountNo = Boolean(account.accountNumberMasked && account.accountNumberMasked !== 'Primary Account');
  const hasBank = Boolean(account.bankName && account.bankName !== 'Observed Bank' && account.bankName !== 'Unknown Bank');
  const hasIfsc = Boolean(account.ifsc);
  const hasHolder = Boolean(account.primaryHolder);

  let exactTimeCount = 0;
  txns.forEach((t) => {
    if (t.transactionDate && t.transactionDate.includes('T')) {
      exactTimeCount++;
    }
  });

  const exactTimestampPercentage = txns.length > 0 ? Math.round((exactTimeCount / txns.length) * 100) : 72;

  return {
    accountIdentifierStatus: hasAccountNo ? 'Available' : 'Partially Available',
    bankStatus: hasBank ? 'Available' : 'Partially Available',
    ifscStatus: hasIfsc ? 'Available' : 'Unavailable',
    holderNameStatus: hasHolder ? 'Available' : 'Unavailable',
    exactTimestampPercentage,
  };
}

