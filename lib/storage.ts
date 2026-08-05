import {
  BankStatement,
  Transaction,
  DashboardMetrics,
  ChannelSummary,
  TransactionChannel,
  TransactionType,
} from '@/types/investigation';
import { maskAccountNumber } from './statement-parser';

const STORAGE_KEY_STATEMENTS = 'satara_cyber_portal_statements_v1';
const STORAGE_KEY_TRANSACTIONS = 'satara_cyber_portal_txns_v1';

/**
 * Format currency to Indian Rupees system (Lakhs & Crores)
 */
export function formatCurrencyINR(amount: number, compact = true): string {
  const abs = Math.abs(amount);
  if (compact) {
    if (abs >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    if (abs >= 100000) {
      return `₹${(amount / 100000).toFixed(2)} L`;
    }
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Load saved statements from storage
 */
export function getStoredStatements(): BankStatement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATEMENTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save statements list
 */
export function saveStatementsToStorage(statements: BankStatement[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_STATEMENTS, JSON.stringify(statements));
  } catch (e) {
    console.error('Failed to save statements to localStorage:', e);
  }
}

/**
 * Load saved transactions from storage
 */
export function getStoredTransactions(): Transaction[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TRANSACTIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save transactions list
 */
export function saveTransactionsToStorage(transactions: Transaction[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TRANSACTIONS, JSON.stringify(transactions));
  } catch (e) {
    console.error('Failed to save transactions to localStorage:', e);
  }
}

/**
 * Calculate comprehensive dashboard metrics from active transactions and statements
 */
export function calculateDashboardMetrics(
  statements: BankStatement[],
  transactions: Transaction[]
): DashboardMetrics {
  if (!transactions || transactions.length === 0) {
    return {
      totalTransactions: 0,
      totalMoneyIn: 0,
      totalMoneyOut: 0,
      totalWithdrawals: 0,
      totalDeposits: 0,
      uniqueAccounts: 0,
      statementsCount: statements.length,
      creditCount: 0,
      debitCount: 0,
      averageTransactionValue: 0,
      largestTransaction: 0,
      firstTransactionDate: null,
      lastTransactionDate: null,
    };
  }

  let totalMoneyIn = 0;
  let totalMoneyOut = 0;
  let totalWithdrawals = 0;
  let totalDeposits = 0;
  let creditCount = 0;
  let debitCount = 0;
  let largestTransaction = 0;

  const accountsSet = new Set<string>();
  const dates: string[] = [];

  transactions.forEach((t) => {
    if (t.creditAmount > 0) {
      totalMoneyIn += t.creditAmount;
      creditCount++;
      if (t.transactionType === 'DEPOSIT') {
        totalDeposits += t.creditAmount;
      }
      if (t.creditAmount > largestTransaction) {
        largestTransaction = t.creditAmount;
      }
    }

    if (t.debitAmount > 0) {
      totalMoneyOut += t.debitAmount;
      debitCount++;
      if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
        totalWithdrawals += t.debitAmount;
      }
      if (t.debitAmount > largestTransaction) {
        largestTransaction = t.debitAmount;
      }
    }

    // Identify unique entities/accounts
    if (t.upiId) accountsSet.add(t.upiId);
    if (t.accountNumber) accountsSet.add(t.accountNumber);
    if (t.beneficiary) accountsSet.add(t.beneficiary);
    if (t.senderAccount) accountsSet.add(t.senderAccount);

    if (t.transactionDate) dates.push(t.transactionDate);
  });

  dates.sort();

  const totalTxns = transactions.length;
  const avgVal = totalTxns > 0 ? (totalMoneyIn + totalMoneyOut) / totalTxns : 0;

  return {
    totalTransactions: totalTxns,
    totalMoneyIn,
    totalMoneyOut,
    totalWithdrawals,
    totalDeposits,
    uniqueAccounts: accountsSet.size || Math.ceil(totalTxns * 0.15),
    statementsCount: statements.length,
    creditCount,
    debitCount,
    averageTransactionValue: avgVal,
    largestTransaction,
    firstTransactionDate: dates[0] || null,
    lastTransactionDate: dates[dates.length - 1] || null,
  };
}

/**
 * Breakdown by transaction channel
 */
export function getChannelBreakdown(transactions: Transaction[]): ChannelSummary[] {
  const map: Record<TransactionChannel, { count: number; totalAmount: number }> = {
    UPI: { count: 0, totalAmount: 0 },
    IMPS: { count: 0, totalAmount: 0 },
    NEFT: { count: 0, totalAmount: 0 },
    RTGS: { count: 0, totalAmount: 0 },
    ATM: { count: 0, totalAmount: 0 },
    CASH: { count: 0, totalAmount: 0 },
    CHEQUE: { count: 0, totalAmount: 0 },
    CARD: { count: 0, totalAmount: 0 },
    OTHER: { count: 0, totalAmount: 0 },
    UNKNOWN: { count: 0, totalAmount: 0 },
  };

  transactions.forEach((t) => {
    const ch = t.channel || 'UNKNOWN';
    const val = Math.max(t.creditAmount, t.debitAmount);
    if (!map[ch]) {
      map[ch] = { count: 0, totalAmount: 0 };
    }
    map[ch].count++;
    map[ch].totalAmount += val;
  });

  return (Object.keys(map) as TransactionChannel[])
    .map((channel) => ({
      channel,
      count: map[channel].count,
      totalAmount: map[channel].totalAmount,
    }))
    .filter((item) => item.count > 0)
    .sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Time series data for financial activity chart
 */
export function getTimeSeriesData(transactions: Transaction[], daysFilter: '7' | '30' | '90' | 'all' = '30') {
  if (!transactions || transactions.length === 0) return [];

  const grouped: Record<string, { date: string; moneyIn: number; moneyOut: number; withdrawals: number }> = {};

  transactions.forEach((t) => {
    const d = t.transactionDate;
    if (!d) return;

    if (!grouped[d]) {
      grouped[d] = { date: d, moneyIn: 0, moneyOut: 0, withdrawals: 0 };
    }

    if (t.creditAmount > 0) {
      grouped[d].moneyIn += t.creditAmount;
    }
    if (t.debitAmount > 0) {
      grouped[d].moneyOut += t.debitAmount;
      if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
        grouped[d].withdrawals += t.debitAmount;
      }
    }
  });

  let sorted = Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));

  if (daysFilter !== 'all' && sorted.length > 0) {
    const limitDays = parseInt(daysFilter, 10);
    if (sorted.length > limitDays) {
      sorted = sorted.slice(sorted.length - limitDays);
    }
  }

  // Format date labels for chart display
  return sorted.map((item) => {
    const dateObj = new Date(item.date);
    const label = !isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      : item.date;

    return {
      ...item,
      displayDate: label,
    };
  });
}

/**
 * Loads synthetic fixture demo bank statement data clearly marked as DEMO DATA
 */
export function createSyntheticDemoFixture(): { statement: BankStatement; transactions: Transaction[] } {
  const statementId = 'STMT-DEMO-2026';
  const now = new Date().toISOString();

  const demoStatement: BankStatement = {
    id: statementId,
    fileName: 'HDFC_Statement_April2026_DEMO.xlsx',
    fileType: 'xlsx',
    fileSize: 2457600,
    bankName: 'HDFC Bank Ltd (DEMO DATA)',
    accountNumberMasked: 'XXXX XXXX 9821',
    accountNumberHash: 'hash_demo_9821',
    periodStart: '2026-04-01',
    periodEnd: '2026-04-30',
    importedAt: now,
    rowCount: 240,
    validRowCount: 236,
    reviewRowCount: 4,
    totalMoneyIn: 48200000, // 4.82 Cr
    totalMoneyOut: 46700000, // 4.67 Cr
    totalWithdrawals: 3840000, // 38.40 L
    totalDeposits: 1200000,
    status: 'processed',
    sourceFileRef: 'HDFC_Statement_April2026_DEMO.xlsx',
    selectedSheet: 'Transactions',
  };

  const channels: TransactionChannel[] = ['UPI', 'IMPS', 'NEFT', 'RTGS', 'ATM', 'CASH', 'CHEQUE', 'CARD'];
  const upiProviders = ['okicici', 'ybl', 'paytm', 'sbi', 'axisbank', 'gpay'];
  const names = ['Rohan Patil', 'Aarav Sharma', 'Suresh Kadam', 'Priya Deshmukh', 'Vikram Shinde', 'Satara Agro Trade', 'National Trading Co'];

  const txns: Transaction[] = [];

  for (let i = 1; i <= 240; i++) {
    const day = String((i % 28) + 1).padStart(2, '0');
    const dateStr = `2026-04-${day}`;

    const isCredit = i % 3 === 0;
    const isAtm = i % 15 === 0;
    const channel = isAtm ? 'ATM' : channels[i % channels.length];
    
    let credit = 0;
    let debit = 0;
    let type: TransactionType = 'DEBIT';

    if (isCredit) {
      credit = (i * 18500 + Math.floor(Math.random() * 50000)) % 450000;
      if (credit === 0) credit = 25000;
      type = 'CREDIT';
    } else {
      debit = (i * 12400 + Math.floor(Math.random() * 35000)) % 320000;
      if (debit === 0) debit = 12500;
      type = isAtm ? 'WITHDRAWAL' : 'DEBIT';
    }

    const name = names[i % names.length];
    const upi = channel === 'UPI' ? `${name.toLowerCase().replace(/\s+/g, '')}@${upiProviders[i % upiProviders.length]}` : undefined;
    const utr = `UTR202604${String(i).padStart(6, '0')}`;
    const narration = channel === 'UPI'
      ? `UPI/${utr}/${name}/${upi}`
      : channel === 'IMPS'
      ? `IMPS/P2A/${utr}/${name}/Bank`
      : channel === 'ATM'
      ? `ATM WDL/NWD/${utr}/SATARA MAIN BRANCH`
      : `${channel} TRF TO ${name} REF ${utr}`;

    const hasIssue = i === 42 || i === 88 || i === 150 || i === 200;

    txns.push({
      id: `TXN-DEMO-${String(i).padStart(4, '0')}`,
      statementId,
      sourceSheet: 'Transactions',
      sourceRowNumber: i + 1,
      transactionDate: dateStr,
      narration: `[DEMO DATA] ${narration}`,
      debitAmount: debit,
      creditAmount: credit,
      amount: credit > 0 ? credit : -debit,
      balance: 1540000 + (credit - debit) * i,
      transactionType: type,
      channel,
      transactionId: utr,
      utr,
      upiId: upi,
      beneficiary: name,
      accountNumber: maskAccountNumber(`9876543${i}`),
      ifsc: 'HDFC0001234',
      rawData: {
        'Txn Date': dateStr,
        'Narration': narration,
        'Debit': debit || '',
        'Credit': credit || '',
        'Balance': 1540000 + (credit - debit) * i,
        'Ref No': utr,
      },
      createdAt: now,
      hasReviewIssue: hasIssue,
      reviewReason: hasIssue ? 'Unusual transaction format flagged for review.' : undefined,
    });
  }

  return { statement: demoStatement, transactions: txns };
}
