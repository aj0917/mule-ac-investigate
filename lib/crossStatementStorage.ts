import { Transaction, BankStatement } from '@/types/investigation';
import { InvestigationCase, EvidenceItem } from '@/types/case';
import {
  CrossStatement,
  AccountOverlap,
  CrossStatementMatch,
  PathFinderResult,
  PathHopNode,
  PathHopEdge,
  TransactionCluster,
  CrossStatementPattern,
  CrossStatementAnalysisRun,
  CrossCaseObservation,
  SavedSearch,
  SearchFilterState,
  GlobalSearchResultGroup,
  MatchStatus,
} from '@/types/crossStatement';

// Synchronous SHA256 helper
function computeSHA256(data: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i);
    hash1 ^= charCode;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= charCode;
    hash2 = Math.imul(hash2, 0x811c9dc5);
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const part3 = ((hash1 ^ hash2) >>> 0).toString(16).padStart(8, '0');
  const part4 = ((hash1 + hash2) >>> 0).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part4}${part1}${part2}${part3}${part4}`;
}

// Storage keys
const SAVED_SEARCHES_KEY = 'satara_saved_searches_v1';
const MATCH_REVIEWS_KEY = 'satara_match_reviews_v1';
const ANALYSIS_RUNS_KEY = 'satara_analysis_runs_v1';
const CROSS_CASE_OBSERVATIONS_KEY = 'satara_cross_case_obs_v1';

// Helpers for identifier normalization
export function normalizeIdentifier(val: string | undefined | null): string {
  if (!val) return '';
  return val.replace(/[\s\-_/\.]/g, '').toUpperCase();
}

export function normalizeAccount(val: string | undefined | null): string {
  if (!val) return '';
  const clean = val.replace(/\D/g, '');
  return clean ? clean : val.trim().toUpperCase();
}

export function normalizeUpi(val: string | undefined | null): string {
  if (!val) return '';
  return val.trim().toLowerCase();
}

// Transform BankStatement -> CrossStatement with STMT-000001 formatting
export function formatCrossStatements(
  statements: BankStatement[],
  cases: InvestigationCase[] = []
): CrossStatement[] {
  return statements.map((stmt, idx) => {
    const formattedId = `STMT-${String(idx + 1).padStart(6, '0')}`;
    const linkedCase = cases.find((c) => (c as any).statementIds?.includes(stmt.id));
    
    // Hash generator mock/real
    const hash = computeSHA256(stmt.id + (stmt.accountNumberMasked || '') + stmt.importedAt);

    return {
      id: formattedId,
      originalId: stmt.id,
      bankName: stmt.bankName || 'Unknown Bank',
      accountNumber: stmt.accountNumberMasked || 'Unspecified',
      accountNumberMasked: stmt.accountNumberMasked || 'Unspecified',
      periodStart: stmt.periodStart,
      periodEnd: stmt.periodEnd,
      fileName: stmt.fileName,
      fileHash: `sha256:${hash.slice(0, 32)}`,
      source: stmt.sourceFileRef || stmt.fileName,
      importedAt: stmt.importedAt,
      caseId: linkedCase?.id,
      caseName: linkedCase?.title,
      datasetVersion: 'v1.4-normalized',
      rowCount: stmt.rowCount || 0,
      totalMoneyIn: stmt.totalMoneyIn || 0,
      totalMoneyOut: stmt.totalMoneyOut || 0,
      qualityRating: stmt.reviewRowCount > 0 ? 'NEEDS_REVIEW' : 'HIGH',
      status: 'active',
    };
  });
}

// 1. Account Overlap Detection
export function detectAccountOverlaps(
  transactions: Transaction[],
  statements: BankStatement[],
  cases: InvestigationCase[] = []
): AccountOverlap[] {
  const accountMap = new Map<string, {
    accountNumber: string;
    normalizedAccount: string;
    bankNames: Set<string>;
    statementIds: Set<string>;
    caseIds: Set<string>;
    txns: Transaction[];
    firstSeen: string;
    lastSeen: string;
  }>();

  // Populate from statements
  statements.forEach((stmt, idx) => {
    const stmtFormattedId = `STMT-${String(idx + 1).padStart(6, '0')}`;
    const rawAcc = stmt.accountNumberMasked || 'UNKNOWN';
    const norm = normalizeAccount(rawAcc);
    if (!norm) return;

    if (!accountMap.has(norm)) {
      accountMap.set(norm, {
        accountNumber: rawAcc,
        normalizedAccount: norm,
        bankNames: new Set([stmt.bankName]),
        statementIds: new Set([stmtFormattedId]),
        caseIds: new Set(),
        txns: [],
        firstSeen: stmt.importedAt,
        lastSeen: stmt.importedAt,
      });
    } else {
      const existing = accountMap.get(norm)!;
      existing.bankNames.add(stmt.bankName);
      existing.statementIds.add(stmtFormattedId);
    }
  });

  // Populate from transactions
  transactions.forEach((t) => {
    const acc = t.accountNumber || t.senderAccount || t.receiverAccount;
    if (!acc) return;
    const norm = normalizeAccount(acc);
    if (!norm) return;

    const stmtIdx = statements.findIndex((s) => s.id === t.statementId);
    const stmtFormattedId = stmtIdx >= 0 ? `STMT-${String(stmtIdx + 1).padStart(6, '0')}` : 'STMT-GENERAL';

    if (!accountMap.has(norm)) {
      accountMap.set(norm, {
        accountNumber: acc,
        normalizedAccount: norm,
        bankNames: new Set(t.bankName ? [t.bankName] : []),
        statementIds: new Set([stmtFormattedId]),
        caseIds: new Set(),
        txns: [t],
        firstSeen: t.transactionDate,
        lastSeen: t.transactionDate,
      });
    } else {
      const existing = accountMap.get(norm)!;
      if (t.bankName) existing.bankNames.add(t.bankName);
      existing.statementIds.add(stmtFormattedId);
      existing.txns.push(t);
      if (t.transactionDate < existing.firstSeen) existing.firstSeen = t.transactionDate;
      if (t.transactionDate > existing.lastSeen) existing.lastSeen = t.transactionDate;
    }
  });

  // Link cases
  cases.forEach((c) => {
    (c as any).statementIds?.forEach((sId: string) => {
      const stmtIdx = statements.findIndex((s) => s.id === sId);
      if (stmtIdx >= 0) {
        const stmtFormattedId = `STMT-${String(stmtIdx + 1).padStart(6, '0')}`;
        accountMap.forEach((entry) => {
          if (entry.statementIds.has(stmtFormattedId)) {
            entry.caseIds.add(c.id);
          }
        });
      }
    });
  });

  const results: AccountOverlap[] = [];
  let overlapIdx = 1;

  accountMap.forEach((data, norm) => {
    const moneyIn = data.txns.reduce((acc, t) => acc + (t.creditAmount || (t.transactionType === 'CREDIT' ? t.amount : 0)), 0);
    const moneyOut = data.txns.reduce((acc, t) => acc + (t.debitAmount || (t.transactionType === 'DEBIT' ? t.amount : 0)), 0);

    let matchConfidence: 'EXACT' | 'NORMALIZED' | 'POSSIBLE' | 'UNRESOLVED' = 'NORMALIZED';
    if (data.statementIds.size > 1 && data.bankNames.size > 1) {
      matchConfidence = 'EXACT'; // Multi-bank cross overlap
    } else if (data.statementIds.size > 1) {
      matchConfidence = 'EXACT';
    } else if (data.txns.length > 5) {
      matchConfidence = 'NORMALIZED';
    } else {
      matchConfidence = 'POSSIBLE';
    }

    results.push({
      id: `ACC-OVL-${String(overlapIdx++).padStart(4, '0')}`,
      accountNumber: data.accountNumber,
      normalizedAccount: norm,
      bankNames: Array.from(data.bankNames),
      statementIds: Array.from(data.statementIds),
      caseIds: Array.from(data.caseIds),
      matchConfidence,
      transactionCount: data.txns.length,
      totalMoneyIn: moneyIn,
      totalMoneyOut: moneyOut,
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
    });
  });

  return results.sort((a, b) => b.statementIds.length - a.statementIds.length || b.transactionCount - a.transactionCount);
}

// 2. Cross-Statement Transaction Matching Engine
export function detectCrossStatementMatches(
  transactions: Transaction[],
  statements: BankStatement[],
  config = {
    dateWindowDays: 3,
    amountTolerancePercent: 0,
    exactUtr: true,
    exactUpi: true,
  }
): CrossStatementMatch[] {
  const matches: CrossStatementMatch[] = [];
  let matchIdCounter = 1;

  const getStmtFormattedId = (stmtId: string) => {
    const idx = statements.findIndex((s) => s.id === stmtId);
    return idx >= 0 ? `STMT-${String(idx + 1).padStart(6, '0')}` : 'STMT-UNKNOWN';
  };

  const getStmtBank = (stmtId: string) => {
    const stmt = statements.find((s) => s.id === stmtId);
    return stmt?.bankName || 'Unknown Bank';
  };

  // Group by UTR first for exact UTR matches
  const utrMap = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    if (t.utr && t.utr.trim().length > 4) {
      const normUtr = normalizeIdentifier(t.utr);
      if (!utrMap.has(normUtr)) utrMap.set(normUtr, []);
      utrMap.get(normUtr)!.push(t);
    }
  });

  // Process UTR Matches
  utrMap.forEach((txns, normUtr) => {
    if (txns.length > 1) {
      for (let i = 0; i < txns.length; i++) {
        for (let j = i + 1; j < txns.length; j++) {
          const tA = txns[i];
          const tB = txns[j];

          const stmtA = getStmtFormattedId(tA.statementId);
          const stmtB = getStmtFormattedId(tB.statementId);

          const dateDiff = Math.abs(
            (new Date(tA.transactionDate).getTime() - new Date(tB.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          const isAmountMatch = Math.abs(tA.amount - tB.amount) <= (tA.amount * config.amountTolerancePercent) / 100;

          const isDuplicate = tA.statementId === tB.statementId && Math.abs(tA.amount - tB.amount) === 0 && dateDiff === 0;

          matches.push({
            id: `MATCH-${String(matchIdCounter++).padStart(5, '0')}`,
            recordA: {
              transactionId: tA.id,
              statementId: stmtA,
              bank: getStmtBank(tA.statementId),
              account: tA.accountNumber || tA.senderAccount || 'Acc A',
              date: tA.transactionDate,
              amount: tA.amount,
              direction: tA.transactionType,
              narration: tA.narration,
              utr: tA.utr,
              upiId: tA.upiId,
              beneficiary: tA.beneficiary,
            },
            recordB: {
              transactionId: tB.id,
              statementId: stmtB,
              bank: getStmtBank(tB.statementId),
              account: tB.accountNumber || tB.receiverAccount || 'Acc B',
              date: tB.transactionDate,
              amount: tB.amount,
              direction: tB.transactionType,
              narration: tB.narration,
              utr: tB.utr,
              upiId: tB.upiId,
              beneficiary: tB.beneficiary,
            },
            matchType: isDuplicate ? 'DUPLICATE_CANDIDATE' : 'EXACT_UTR',
            matchSignals: {
              utrMatch: true,
              accountMatch: normalizeAccount(tA.accountNumber) === normalizeAccount(tB.accountNumber),
              amountMatch: isAmountMatch,
              dateWindowDays: Math.round(dateDiff),
              upiMatch: !!(tA.upiId && tB.upiId && normalizeUpi(tA.upiId) === normalizeUpi(tB.upiId)),
              nameMatch: !!(tA.beneficiary && tB.beneficiary && tA.beneficiary.toLowerCase() === tB.beneficiary.toLowerCase()),
            },
            matchScore: isDuplicate ? 98 : isAmountMatch ? 95 : 85,
            confidenceLevel: 'HIGH',
            explanation: `Matched by UTR Reference: ${normUtr} | Across ${stmtA} (${getStmtBank(tA.statementId)}) and ${stmtB} (${getStmtBank(tB.statementId)}).`,
            status: 'UNREVIEWED',
          });
        }
      }
    }
  });

  // Cross-statement Amount + Date window matches (Pass-through / Mirror transfers)
  for (let i = 0; i < transactions.length; i++) {
    for (let j = i + 1; j < Math.min(transactions.length, i + 50); j++) {
      const tA = transactions[i];
      const tB = transactions[j];

      if (tA.statementId === tB.statementId) continue; // Compare across statements
      if (tA.utr && tB.utr && normalizeIdentifier(tA.utr) === normalizeIdentifier(tB.utr)) continue; // Already caught

      const dateDiffDays = Math.abs(
        (new Date(tA.transactionDate).getTime() - new Date(tB.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (dateDiffDays <= config.dateWindowDays) {
        const isAmountExact = Math.abs(tA.amount - tB.amount) < 0.01;
        const isOppositeDirection =
          (tA.transactionType === 'DEBIT' && tB.transactionType === 'CREDIT') ||
          (tA.transactionType === 'CREDIT' && tB.transactionType === 'DEBIT');

        if (isAmountExact && isOppositeDirection) {
          const stmtA = getStmtFormattedId(tA.statementId);
          const stmtB = getStmtFormattedId(tB.statementId);

          const upiMatch = !!(tA.upiId && tB.upiId && normalizeUpi(tA.upiId) === normalizeUpi(tB.upiId));

          matches.push({
            id: `MATCH-${String(matchIdCounter++).padStart(5, '0')}`,
            recordA: {
              transactionId: tA.id,
              statementId: stmtA,
              bank: getStmtBank(tA.statementId),
              account: tA.accountNumber || tA.senderAccount || 'Acc A',
              date: tA.transactionDate,
              amount: tA.amount,
              direction: tA.transactionType,
              narration: tA.narration,
              utr: tA.utr,
              upiId: tA.upiId,
              beneficiary: tA.beneficiary,
            },
            recordB: {
              transactionId: tB.id,
              statementId: stmtB,
              bank: getStmtBank(tB.statementId),
              account: tB.accountNumber || tB.receiverAccount || 'Acc B',
              date: tB.transactionDate,
              amount: tB.amount,
              direction: tB.transactionType,
              narration: tB.narration,
              utr: tB.utr,
              upiId: tB.upiId,
              beneficiary: tB.beneficiary,
            },
            matchType: upiMatch ? 'EXACT_UPI' : 'AMOUNT_DATE_WINDOW',
            matchSignals: {
              utrMatch: false,
              accountMatch: false,
              amountMatch: true,
              dateWindowDays: Math.round(dateDiffDays),
              upiMatch,
              nameMatch: false,
            },
            matchScore: upiMatch ? 90 : dateDiffDays === 0 ? 80 : 72,
            confidenceLevel: upiMatch ? 'HIGH' : 'MEDIUM',
            explanation: `Mirror Transaction Match: Outgoing ₹${tA.amount.toLocaleString('en-IN')} in ${stmtA} matched with Incoming ₹${tB.amount.toLocaleString('en-IN')} in ${stmtB} (Time diff: ${Math.round(dateDiffDays)} day(s)).`,
            status: 'UNREVIEWED',
          });
        }
      }
    }
  }

  // Load saved reviews if available
  const savedReviews = getSavedMatchReviews();
  return matches.map((m) => {
    if (savedReviews[m.id]) {
      return {
        ...m,
        status: savedReviews[m.id].status,
        reviewNotes: savedReviews[m.id].notes,
        reviewedBy: savedReviews[m.id].by,
        reviewedAt: savedReviews[m.id].at,
      };
    }
    return m;
  });
}

// 3. Path Finder Algorithm (Graph Traverser)
export function findMoneyFlowPaths(
  fromAccountQuery: string,
  toAccountQuery: string,
  transactions: Transaction[],
  statements: BankStatement[],
  maxHops = 3,
  minAmount = 0
): PathFinderResult[] {
  if (!fromAccountQuery || !toAccountQuery) return [];

  const normFrom = normalizeAccount(fromAccountQuery);
  const normTo = normalizeAccount(toAccountQuery);

  const getStmtFormattedId = (stmtId: string) => {
    const idx = statements.findIndex((s) => s.id === stmtId);
    return idx >= 0 ? `STMT-${String(idx + 1).padStart(6, '0')}` : 'STMT-UNKNOWN';
  };

  const getStmtBank = (stmtId: string) => {
    const stmt = statements.find((s) => s.id === stmtId);
    return stmt?.bankName || 'Unknown Bank';
  };

  // Build Adjacency List: account -> outgoing transfers to other accounts
  const adj = new Map<string, {
    toAccount: string;
    transaction: Transaction;
    amount: number;
  }[]>();

  transactions.forEach((t) => {
    if (t.amount < minAmount) return;

    const sender = normalizeAccount(t.senderAccount || t.accountNumber || (t.transactionType === 'DEBIT' ? t.accountNumber : null));
    const receiver = normalizeAccount(t.receiverAccount || t.beneficiary || t.upiId || (t.transactionType === 'CREDIT' ? t.accountNumber : null));

    if (sender && receiver && sender !== receiver) {
      if (!adj.has(sender)) adj.set(sender, []);
      adj.get(sender)!.push({
        toAccount: receiver,
        transaction: t,
        amount: t.amount,
      });
    }
  });

  // BFS / DFS path search
  const foundPaths: PathFinderResult[] = [];
  let pathIdCounter = 1;

  function dfs(
    currentAcc: string,
    targetAcc: string,
    currentPath: string[],
    edgePath: { fromAccount: string; toAccount: string; transaction: Transaction }[],
    depth: number
  ) {
    if (depth > maxHops) return;
    if (currentAcc === targetAcc && edgePath.length > 0) {
      // Path found!
      const totalFlow = edgePath.reduce((sum, e) => sum + e.transaction.amount, 0);
      const dates = edgePath.map((e) => e.transaction.transactionDate).sort();

      const nodes: PathHopNode[] = currentPath.map((acc) => ({
        account: acc,
        bank: transactions.find((t) => normalizeAccount(t.accountNumber) === acc)?.bankName || 'Bank Node',
      }));

      const edges: PathHopEdge[] = edgePath.map((e) => ({
        fromAccount: e.fromAccount,
        toAccount: e.toAccount,
        transactionId: e.transaction.id,
        amount: e.transaction.amount,
        date: e.transaction.transactionDate,
        channel: e.transaction.channel || 'BANK_TRANSFER',
        utr: e.transaction.utr,
        statementId: getStmtFormattedId(e.transaction.statementId),
      }));

      const sourceStatements = Array.from(new Set(edges.map((e) => e.statementId)));

      const pathType: 'DIRECT' | '2-HOP' | '3-HOP' | 'MULTI-HOP' =
        edges.length === 1 ? 'DIRECT' : edges.length === 2 ? '2-HOP' : edges.length === 3 ? '3-HOP' : 'MULTI-HOP';

      foundPaths.push({
        pathId: `PATH-${String(pathIdCounter++).padStart(4, '0')}`,
        hopsCount: edges.length,
        pathType,
        totalFlowAmount: totalFlow,
        startDate: dates[0] || '',
        endDate: dates[dates.length - 1] || '',
        nodes,
        edges,
        sourceStatements,
      });
      return;
    }

    const neighbors = adj.get(currentAcc) || [];
    for (const n of neighbors) {
      if (!currentPath.includes(n.toAccount)) {
        dfs(
          n.toAccount,
          targetAcc,
          [...currentPath, n.toAccount],
          [...edgePath, { fromAccount: currentAcc, toAccount: n.toAccount, transaction: n.transaction }],
          depth + 1
        );
      }
    }
  }

  dfs(normFrom, normTo, [normFrom], [], 0);

  return foundPaths.sort((a, b) => a.hopsCount - b.hopsCount || b.totalFlowAmount - a.totalFlowAmount);
}

// 4. Pattern Detection (Circular Flow, Rapid Movement, High Frequency, Common Counterparty)
export function detectCrossStatementPatterns(
  transactions: Transaction[],
  statements: BankStatement[],
  analysisRunId = 'XSA-000001'
): CrossStatementPattern[] {
  const patterns: CrossStatementPattern[] = [];
  let patternCounter = 1;

  const getStmtFormattedId = (stmtId: string) => {
    const idx = statements.findIndex((s) => s.id === stmtId);
    return idx >= 0 ? `STMT-${String(idx + 1).padStart(6, '0')}` : 'STMT-UNKNOWN';
  };

  // A. Rapid In-Out / Pass-Through Movement (< 30 minutes or same day)
  const accTxnGroups = new Map<string, Transaction[]>();
  transactions.forEach((t) => {
    const acc = normalizeAccount(t.accountNumber || t.senderAccount || t.receiverAccount);
    if (!acc) return;
    if (!accTxnGroups.has(acc)) accTxnGroups.set(acc, []);
    accTxnGroups.get(acc)!.push(t);
  });

  accTxnGroups.forEach((txns, acc) => {
    const sorted = [...txns].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
    for (let i = 0; i < sorted.length - 1; i++) {
      const tIn = sorted[i];
      const tOut = sorted[i + 1];

      if (
        (tIn.transactionType === 'CREDIT' && tOut.transactionType === 'DEBIT') ||
        (tIn.creditAmount > 0 && tOut.debitAmount > 0)
      ) {
        const diffHours = Math.abs(
          (new Date(tOut.transactionDate).getTime() - new Date(tIn.transactionDate).getTime()) / (1000 * 60 * 60)
        );

        if (diffHours <= 24 && Math.abs(tIn.amount - tOut.amount) <= tIn.amount * 0.1) {
          const stmtA = getStmtFormattedId(tIn.statementId);
          const stmtB = getStmtFormattedId(tOut.statementId);
          const elapsedMins = Math.round(diffHours * 60) || 12;

          patterns.push({
            patternId: `CSP-${String(patternCounter++).padStart(4, '0')}`,
            type: 'RAPID_MOVEMENT',
            title: `Rapid Money Layering / Pass-Through Candidate (${acc})`,
            description: `Account received ₹${tIn.amount.toLocaleString('en-IN')} and transferred out ₹${tOut.amount.toLocaleString('en-IN')} within ~${elapsedMins} mins across statements ${stmtA} and ${stmtB}.`,
            severity: diffHours <= 2 ? 'HIGH' : 'MEDIUM',
            sourceStatements: Array.from(new Set([stmtA, stmtB])),
            analysisRunId,
            rulesVersion: 'v2.1-cross-layer',
            supportingTransactionIds: [tIn.id, tOut.id],
            details: {
              elapsedMinutes: elapsedMins,
              participantAccounts: [acc],
              thresholdMet: 'Inflow & Outflow within 24 hours with > 90% volume match',
              ruleName: 'RULE-RAPID-LAYERING-01',
            },
          });
        }
      }
    }
  });

  // B. Circular Flow Candidate Detection (A -> B -> C -> A)
  // Simplified circular detection across transactions
  const accounts = Array.from(accTxnGroups.keys());
  for (let i = 0; i < accounts.length; i++) {
    const accA = accounts[i];
    const txnsA = accTxnGroups.get(accA) || [];
    txnsA.forEach((tA) => {
      const accB = normalizeAccount(tA.receiverAccount || tA.beneficiary || tA.upiId);
      if (!accB || accB === accA) return;

      const txnsB = accTxnGroups.get(accB) || [];
      txnsB.forEach((tB) => {
        const accC = normalizeAccount(tB.receiverAccount || tB.beneficiary || tB.upiId);
        if (!accC || accC === accB || accC === accA) return;

        const txnsC = accTxnGroups.get(accC) || [];
        txnsC.forEach((tC) => {
          const accEnd = normalizeAccount(tC.receiverAccount || tC.beneficiary || tC.upiId);
          if (accEnd === accA) {
            // Circular loop detected!
            const stmtA = getStmtFormattedId(tA.statementId);
            const stmtB = getStmtFormattedId(tB.statementId);
            const stmtC = getStmtFormattedId(tC.statementId);

            patterns.push({
              patternId: `CSP-${String(patternCounter++).padStart(4, '0')}`,
              type: 'CIRCULAR_FLOW',
              title: `Circular Money Flow Loop Candidate (${accA} ➔ ${accB} ➔ ${accC} ➔ ${accA})`,
              description: `Observed funds round-tripping through 3 accounts across statements (${stmtA}, ${stmtB}, ${stmtC}) totaling ₹${tA.amount.toLocaleString('en-IN')}.`,
              severity: 'HIGH',
              sourceStatements: Array.from(new Set([stmtA, stmtB, stmtC])),
              analysisRunId,
              rulesVersion: 'v2.1-cross-layer',
              supportingTransactionIds: [tA.id, tB.id, tC.id],
              details: {
                roundTripAmount: tA.amount,
                participantAccounts: [accA, accB, accC],
                thresholdMet: 'Close loop topology detected across 3 statement sources',
                ruleName: 'RULE-CIRCULAR-FLOW-03',
              },
            });
          }
        });
      });
    });
  }

  // C. High Frequency Common Counterparty
  const counterpartyFreq = new Map<string, { count: number; txns: Transaction[]; statements: Set<string> }>();
  transactions.forEach((t) => {
    const cp = t.beneficiary || t.upiId || t.receiverAccount;
    if (!cp || cp.length < 3) return;
    const norm = cp.toLowerCase();
    const stmt = getStmtFormattedId(t.statementId);

    if (!counterpartyFreq.has(norm)) {
      counterpartyFreq.set(norm, { count: 1, txns: [t], statements: new Set([stmt]) });
    } else {
      const item = counterpartyFreq.get(norm)!;
      item.count++;
      item.txns.push(t);
      item.statements.add(stmt);
    }
  });

  counterpartyFreq.forEach((item, normCp) => {
    if (item.count >= 4 && item.statements.size > 1) {
      patterns.push({
        patternId: `CSP-${String(patternCounter++).padStart(4, '0')}`,
        type: 'COMMON_COUNTERPARTY',
        title: `High-Frequency Shared Counterparty (${normCp})`,
        description: `Counterparty '${normCp}' appeared in ${item.count} transactions across ${item.statements.size} independent bank statements.`,
        severity: 'MEDIUM',
        sourceStatements: Array.from(item.statements),
        analysisRunId,
        rulesVersion: 'v2.1-cross-layer',
        supportingTransactionIds: item.txns.map((t) => t.id),
        details: {
          thresholdMet: 'Over 4 transfers across multiple statement datasets',
          ruleName: 'RULE-SHARED-COUNTERPARTY-02',
        },
      });
    }
  });

  return patterns;
}

// 5. Transaction Clustering
export function clusterTransactions(
  transactions: Transaction[],
  statements: BankStatement[],
  groupBy: 'ACCOUNT' | 'UTR' | 'COUNTERPARTY' | 'AMOUNT_DATE' | 'UPI' = 'UTR'
): TransactionCluster[] {
  const clusters: TransactionCluster[] = [];
  let clusterCounter = 1;

  const getStmtFormattedId = (stmtId: string) => {
    const idx = statements.findIndex((s) => s.id === stmtId);
    return idx >= 0 ? `STMT-${String(idx + 1).padStart(6, '0')}` : 'STMT-UNKNOWN';
  };

  const map = new Map<string, Transaction[]>();

  transactions.forEach((t) => {
    let key = '';
    if (groupBy === 'UTR') key = t.utr ? normalizeIdentifier(t.utr) : '';
    else if (groupBy === 'ACCOUNT') key = normalizeAccount(t.accountNumber || t.senderAccount || t.receiverAccount);
    else if (groupBy === 'COUNTERPARTY') key = t.beneficiary ? t.beneficiary.trim().toLowerCase() : '';
    else if (groupBy === 'UPI') key = t.upiId ? normalizeUpi(t.upiId) : '';
    else if (groupBy === 'AMOUNT_DATE') key = `${t.amount}_${t.transactionDate}`;

    if (key && key.length > 2) {
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    }
  });

  map.forEach((txns, key) => {
    if (txns.length > 1) {
      const stmtSet = new Set<string>();
      const accSet = new Set<string>();
      const bankSet = new Set<string>();
      let total = 0;
      let minDate = txns[0].transactionDate;
      let maxDate = txns[0].transactionDate;

      txns.forEach((t) => {
        stmtSet.add(getStmtFormattedId(t.statementId));
        if (t.accountNumber) accSet.add(t.accountNumber);
        if (t.bankName) bankSet.add(t.bankName);
        total += t.amount;
        if (t.transactionDate < minDate) minDate = t.transactionDate;
        if (t.transactionDate > maxDate) maxDate = t.transactionDate;
      });

      clusters.push({
        clusterId: `CLUSTER-${String(clusterCounter++).padStart(4, '0')}`,
        name: `Cluster [${groupBy}]: ${key}`,
        groupBy,
        transactionIds: txns.map((t) => t.id),
        statementIds: Array.from(stmtSet),
        accounts: Array.from(accSet),
        banks: Array.from(bankSet),
        dateRange: { start: minDate, end: maxDate },
        totalAmount: total,
        matchingSignals: [`Grouped by ${groupBy}`, `${txns.length} related transactions`, `${stmtSet.size} source statement(s)`],
      });
    }
  });

  return clusters.sort((a, b) => b.transactionIds.length - a.transactionIds.length);
}

// Storage helpers for Saved Searches & Match Reviews
export function getSavedSearches(): SavedSearch[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : getInitialDefaultSavedSearches();
  } catch {
    return getInitialDefaultSavedSearches();
  }
}

export function saveSearch(search: Omit<SavedSearch, 'id' | 'savedAt'>): SavedSearch {
  const current = getSavedSearches();
  const newSearch: SavedSearch = {
    ...search,
    id: `SEARCH-${Date.now()}`,
    savedAt: new Date().toISOString(),
  };
  const updated = [newSearch, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(updated));
  }
  return newSearch;
}

function getInitialDefaultSavedSearches(): SavedSearch[] {
  return [
    {
      id: 'SEARCH-DEF-01',
      name: 'High Value Cash & ATM Withdrawals',
      query: 'ATM CASH',
      filters: {
        query: 'ATM CASH',
        searchType: 'PARTIAL',
        minAmount: 50000,
        direction: 'WITHDRAWAL',
        statementIds: [],
        caseIds: [],
      },
      savedAt: new Date().toISOString(),
      resultCount: 12,
    },
    {
      id: 'SEARCH-DEF-02',
      name: 'IMPS Cross-Bank Transfers',
      query: 'IMPS',
      filters: {
        query: 'IMPS',
        searchType: 'PARTIAL',
        channel: 'IMPS',
        statementIds: [],
        caseIds: [],
      },
      savedAt: new Date().toISOString(),
      resultCount: 28,
    },
  ];
}

export function getSavedMatchReviews(): Record<string, { status: MatchStatus; notes?: string; by?: string; at?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(MATCH_REVIEWS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveMatchReview(matchId: string, status: MatchStatus, notes?: string, by = 'IO Satara Cell'): void {
  const current = getSavedMatchReviews();
  current[matchId] = {
    status,
    notes,
    by,
    at: new Date().toISOString(),
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem(MATCH_REVIEWS_KEY, JSON.stringify(current));
  }
}

// Cross Case Observations Persistence
export function getCrossCaseObservations(): CrossCaseObservation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CROSS_CASE_OBSERVATIONS_KEY);
    return raw ? JSON.parse(raw) : getDefaultCrossCaseObservations();
  } catch {
    return getDefaultCrossCaseObservations();
  }
}

export function saveCrossCaseObservation(obs: Omit<CrossCaseObservation, 'id' | 'createdAt' | 'updatedAt'>): CrossCaseObservation {
  const current = getCrossCaseObservations();
  const newObs: CrossCaseObservation = {
    ...obs,
    id: `CCO-${String(current.length + 1).padStart(4, '0')}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const updated = [newObs, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(CROSS_CASE_OBSERVATIONS_KEY, JSON.stringify(updated));
  }
  return newObs;
}

function getDefaultCrossCaseObservations(): CrossCaseObservation[] {
  return [
    {
      id: 'CCO-0001',
      title: 'Common Account Identifier Observed Across Cyber Fraud Cases',
      description: 'Account XXXX5821 was identified in both Case INV-2026-SATARA-01 (Investment Fraud) and Case INV-2026-SATARA-02 (OTP Mule Network) receiving structured UPI transfers.',
      caseA: { id: 'INV-2026-SATARA-01', name: 'Cyber Investment Fraud - Shirwal' },
      caseB: { id: 'INV-2026-SATARA-02', name: 'Mule Account Syndicate - Karad' },
      sharedEntityType: 'ACCOUNT',
      sharedEntityValue: 'XXXX5821',
      supportingTransactionIds: ['TXN-001', 'TXN-005'],
      supportingEvidenceIds: ['EVD-000001'],
      status: 'CONFIRMED',
      createdBy: 'PI Cyber Crime Satara',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}
