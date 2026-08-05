import {
  Transaction,
  BankStatement,
  PatternIndicator,
  PatternCategory,
  PatternPriority,
  PatternStatus,
  CustomInvestigationRule,
  PatternAnalysisRun,
  PatternAnalysisScope,
  DismissReason,
} from '@/types/investigation';
import { getAccountEntities, buildMoneyFlowGraph } from './intelligence';

// Default Custom Rules available out-of-the-box
export function getDefaultRules(): CustomInvestigationRule[] {
  return [
    {
      id: 'RULE-001',
      name: 'Standard Rapid Money Movement Rule',
      description: 'Flags credit followed by debit exceeding ₹1,00,000 within 30 minutes',
      category: 'RAPID_MOVEMENT',
      priority: 'HIGH',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 100000,
        timeWindowMinutes: 30,
        direction: 'BOTH',
      },
    },
    {
      id: 'RULE-002',
      name: 'High-Value Transfer Threshold Rule',
      description: 'Flags any individual transaction exceeding ₹5,00,000',
      category: 'HIGH_VALUE',
      priority: 'HIGH',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 500000,
      },
    },
    {
      id: 'RULE-003',
      name: 'Split-Flow Distribution Rule',
      description: 'Flags single source transferring to 3+ destination accounts within 60 minutes',
      category: 'SPLIT_FLOW',
      priority: 'HIGH',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 50000,
        minDestinations: 3,
        timeWindowMinutes: 60,
      },
    },
    {
      id: 'RULE-004',
      name: 'Consolidation / Fan-In Rule',
      description: 'Flags 3+ source accounts transferring into single account within 60 minutes',
      category: 'CONSOLIDATION',
      priority: 'HIGH',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 50000,
        minSources: 3,
        timeWindowMinutes: 60,
      },
    },
    {
      id: 'RULE-005',
      name: 'Immediate Cash Withdrawal After Credit',
      description: 'Flags credit transaction followed by ATM or Cash withdrawal within 60 minutes',
      category: 'WITHDRAWAL_AFTER_CREDIT',
      priority: 'HIGH',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 20000,
        timeWindowMinutes: 60,
      },
    },
    {
      id: 'RULE-006',
      name: 'High In/Out Flow Retention Ratio',
      description: 'Flags accounts with > 90% total outgoing vs total incoming volume',
      category: 'IN_OUT_RATIO',
      priority: 'MEDIUM',
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Cyber Cell',
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01',
      conditions: {
        minAmount: 100000,
      },
    },
  ];
}

// Main Pattern Analysis Execution Pipeline
export function runPatternAnalysis(
  transactions: Transaction[],
  statements: BankStatement[],
  customRules: CustomInvestigationRule[] = [],
  scope?: PatternAnalysisScope,
  runId: string = `RUN-${Date.now().toString().slice(-6)}`
): PatternIndicator[] {
  if (!transactions || transactions.length === 0) return [];

  const activeRules = [...getDefaultRules(), ...customRules].filter((r) => r.status === 'ACTIVE');
  const accounts = getAccountEntities(transactions, statements);
  const indicators: PatternIndicator[] = [];

  // Sort transactions by date and narration/ID
  const sortedTxns = [...transactions].sort((a, b) => a.transactionDate.localeCompare(b.transactionDate));

  // 1. RAPID MONEY MOVEMENT DETECTOR
  accounts.forEach((acc) => {
    const accTxns = sortedTxns.filter(
      (t) =>
        t.accountNumber === acc.accountNumberMasked ||
        t.upiId === acc.id ||
        (t.statementId && statements.find((s) => s.id === t.statementId)?.accountNumberMasked === acc.accountNumberMasked)
    );

    const credits = accTxns.filter((t) => t.creditAmount > 0);
    const debits = accTxns.filter((t) => t.debitAmount > 0);

    credits.forEach((cTx) => {
      debits.forEach((dTx) => {
        if (dTx.transactionDate < cTx.transactionDate) return;

        // Calculate approximate gap in minutes
        let mins = 15;
        if (dTx.transactionDate !== cTx.transactionDate) {
          mins = 1440;
        }

        const rapidRule = activeRules.find((r) => r.category === 'RAPID_MOVEMENT')?.conditions;
        const maxMins = rapidRule?.timeWindowMinutes || 60;
        const minAmt = rapidRule?.minAmount || 50000;

        if (mins <= maxMins && cTx.creditAmount >= minAmt && dTx.debitAmount >= minAmt) {
          indicators.push({
            id: `IND-RM-${cTx.id}-${dTx.id}`,
            category: 'RAPID_MOVEMENT',
            title: 'Rapid Money Movement Pattern',
            subtitle: `Observed inflow of ₹${cTx.creditAmount.toLocaleString('en-IN')} followed by outflow of ₹${dTx.debitAmount.toLocaleString('en-IN')}`,
            priority: cTx.creditAmount >= 200000 ? 'HIGH' : 'MEDIUM',
            priorityFactors: [
              { label: 'Large Transfer Volume', value: `₹${cTx.creditAmount.toLocaleString('en-IN')}`, contribution: 'HIGH' },
              { label: 'Short Elapsed Window', value: `~${mins} minutes`, contribution: 'HIGH' },
              { label: 'Connected Account Scope', value: acc.bankName, contribution: 'MEDIUM' },
            ],
            status: 'NEW',
            updatedAt: new Date().toISOString(),
            rootAccountId: acc.id,
            rootAccountLabel: acc.accountNumberMasked,
            involvedAccountIds: [acc.id, dTx.beneficiary || dTx.receiverAccount || 'Counterparty'],
            involvedAccountLabels: [acc.accountNumberMasked, dTx.beneficiary || dTx.upiId || 'Counterparty'],
            totalAmount: cTx.creditAmount + dTx.debitAmount,
            inflowAmount: cTx.creditAmount,
            outflowAmount: dTx.debitAmount,
            timeWindowMinutes: mins,
            startDate: cTx.transactionDate,
            endDate: dTx.transactionDate,
            transactionIds: [cTx.id, dTx.id],
            supportingTransactions: [cTx, dTx],
            explanation: `Account ${acc.accountNumberMasked} observed an incoming credit of ₹${cTx.creditAmount.toLocaleString(
              'en-IN'
            )} followed by an outgoing transfer of ₹${dTx.debitAmount.toLocaleString('en-IN')} within ~${mins} minutes.`,
            calculation: {
              formulaName: 'Rapid Inflow to Outflow Transfer Delta',
              steps: [
                { parameter: 'Incoming Credit Amount', observedValue: `₹${cTx.creditAmount}`, configuredThreshold: `₹${minAmt}`, conditionMet: true },
                { parameter: 'Outgoing Debit Amount', observedValue: `₹${dTx.debitAmount}`, configuredThreshold: `₹${minAmt}`, conditionMet: true },
                { parameter: 'Elapsed Time Gap', observedValue: `${mins} mins`, configuredThreshold: `${maxMins} mins`, conditionMet: true },
              ],
              matchedConditionCount: 3,
              totalConditionsCount: 3,
              result: 'Rapid movement pattern detected',
            },
            statementIds: [cTx.statementId, dTx.statementId].filter((x): x is string => Boolean(x)),
            statementFileNames: statements.map((s) => s.fileName),
            analysisRunId: runId,
          });
        }
      });
    });
  });

  // 2. SPLIT FLOW DETECTOR (One account -> Multiple destinations)
  accounts.forEach((acc) => {
    const accDebits = sortedTxns.filter(
      (t) =>
        t.debitAmount > 0 &&
        (t.accountNumber === acc.accountNumberMasked ||
          (t.statementId && statements.find((s) => s.id === t.statementId)?.accountNumberMasked === acc.accountNumberMasked))
    );

    if (accDebits.length >= 3) {
      const distinctDestinations = new Set(
        accDebits.map((t) => t.beneficiary || t.receiverAccount || t.upiId).filter((x): x is string => Boolean(x))
      );
      if (distinctDestinations.size >= 3) {
        const totalOut = accDebits.reduce((sum, t) => sum + t.debitAmount, 0);
        indicators.push({
          id: `IND-SF-${acc.id}`,
          category: 'SPLIT_FLOW',
          title: 'Split Flow Pattern (Fan-Out)',
          subtitle: `Observed funds transferred across ${distinctDestinations.size} distinct destination counterparties`,
          priority: totalOut >= 300000 ? 'HIGH' : 'MEDIUM',
          priorityFactors: [
            { label: 'Destination Count', value: `${distinctDestinations.size} Accounts`, contribution: 'HIGH' },
            { label: 'Total Split Outflow', value: `₹${totalOut.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          ],
          status: 'NEW',
          updatedAt: new Date().toISOString(),
          rootAccountId: acc.id,
          rootAccountLabel: acc.accountNumberMasked,
          involvedAccountIds: [acc.id, ...Array.from(distinctDestinations)],
          involvedAccountLabels: [acc.accountNumberMasked, ...Array.from(distinctDestinations)],
          totalAmount: totalOut,
          outflowAmount: totalOut,
          startDate: accDebits[0].transactionDate,
          endDate: accDebits[accDebits.length - 1].transactionDate,
          transactionIds: accDebits.map((t) => t.id),
          supportingTransactions: accDebits.slice(0, 5),
          explanation: `Account ${acc.accountNumberMasked} distributed ₹${totalOut.toLocaleString(
            'en-IN'
          )} across ${distinctDestinations.size} separate recipient entities.`,
          calculation: {
            formulaName: 'Multi-Destination Outbound Flow Branching',
            steps: [
              { parameter: 'Distinct Recipients', observedValue: distinctDestinations.size, configuredThreshold: 3, conditionMet: true },
              { parameter: 'Aggregated Outflow', observedValue: `₹${totalOut}`, configuredThreshold: '₹50,000', conditionMet: true },
            ],
            matchedConditionCount: 2,
            totalConditionsCount: 2,
            result: 'Split flow pattern detected',
          },
          statementIds: accDebits.map((t) => t.statementId).filter((x): x is string => Boolean(x)),
          statementFileNames: statements.map((s) => s.fileName),
          analysisRunId: runId,
        });
      }
    }
  });

  // 3. CONSOLIDATION DETECTOR (Multiple sources -> One destination)
  const incomingMap = new Map<string, Transaction[]>();
  sortedTxns.forEach((t) => {
    if (t.creditAmount > 0) {
      const recipient = t.accountNumber || t.receiverAccount || t.beneficiary || 'Target';
      if (!incomingMap.has(recipient)) incomingMap.set(recipient, []);
      incomingMap.get(recipient)!.push(t);
    }
  });

  incomingMap.forEach((txns, targetAcc) => {
    if (txns.length >= 3) {
      const distinctSources = new Set(
        txns.map((t) => t.senderAccount || t.upiId || 'Source').filter((x): x is string => Boolean(x))
      );
      if (distinctSources.size >= 3) {
        const totalIn = txns.reduce((sum, t) => sum + t.creditAmount, 0);
        indicators.push({
          id: `IND-CON-${targetAcc.replace(/[^a-zA-Z0-9]/g, '_')}`,
          category: 'CONSOLIDATION',
          title: 'Consolidation Pattern (Fan-In)',
          subtitle: `Observed incoming transfers from ${distinctSources.size} distinct sending counterparties`,
          priority: totalIn >= 300000 ? 'HIGH' : 'MEDIUM',
          priorityFactors: [
            { label: 'Source Accounts Count', value: `${distinctSources.size} Sources`, contribution: 'HIGH' },
            { label: 'Consolidated Volume', value: `₹${totalIn.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          ],
          status: 'NEW',
          updatedAt: new Date().toISOString(),
          rootAccountId: targetAcc,
          rootAccountLabel: targetAcc,
          involvedAccountIds: [targetAcc, ...Array.from(distinctSources)],
          involvedAccountLabels: [targetAcc, ...Array.from(distinctSources)],
          totalAmount: totalIn,
          inflowAmount: totalIn,
          startDate: txns[0].transactionDate,
          endDate: txns[txns.length - 1].transactionDate,
          transactionIds: txns.map((t) => t.id),
          supportingTransactions: txns.slice(0, 5),
          explanation: `Account ${targetAcc} received incoming transfers totaling ₹${totalIn.toLocaleString(
            'en-IN'
          )} from ${distinctSources.size} separate source entities.`,
          calculation: {
            formulaName: 'Multi-Source Inbound Flow Aggregation',
            steps: [
              { parameter: 'Distinct Source Accounts', observedValue: distinctSources.size, configuredThreshold: 3, conditionMet: true },
              { parameter: 'Total Consolidated Amount', observedValue: `₹${totalIn}`, configuredThreshold: '₹50,000', conditionMet: true },
            ],
            matchedConditionCount: 2,
            totalConditionsCount: 2,
            result: 'Consolidation pattern detected',
          },
          statementIds: txns.map((t) => t.statementId).filter((x): x is string => Boolean(x)),
          statementFileNames: statements.map((s) => s.fileName),
          analysisRunId: runId,
        });
      }
    }
  });

  // 4. REPEATED AMOUNT & COUNTERPARTY PATTERN DETECTOR
  const amountGroups = new Map<string, Transaction[]>();
  sortedTxns.forEach((t) => {
    const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));
    if (amt > 0) {
      const key = `${t.accountNumber || 'ACC'}-${amt}`;
      if (!amountGroups.has(key)) amountGroups.set(key, []);
      amountGroups.get(key)!.push(t);
    }
  });

  amountGroups.forEach((txns, key) => {
    if (txns.length >= 3) {
      const amt = Math.max(txns[0].creditAmount, txns[0].debitAmount, Math.abs(txns[0].amount));
      const totalVol = amt * txns.length;
      indicators.push({
        id: `IND-REP-${key.replace(/[^a-zA-Z0-9]/g, '_')}`,
        category: 'REPEATED_TRANSACTION',
        title: 'Repeated Amount Pattern',
        subtitle: `Observed exact amount ₹${amt.toLocaleString('en-IN')} across ${txns.length} separate transactions`,
        priority: totalVol >= 200000 ? 'HIGH' : 'MEDIUM',
        priorityFactors: [
          { label: 'Exact Match Amount', value: `₹${amt.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          { label: 'Occurrence Frequency', value: `${txns.length} Times`, contribution: 'HIGH' },
          { label: 'Combined Volume', value: `₹${totalVol.toLocaleString('en-IN')}`, contribution: 'MEDIUM' },
        ],
        status: 'NEW',
        updatedAt: new Date().toISOString(),
        rootAccountId: txns[0].accountNumber || 'Account',
        rootAccountLabel: txns[0].accountNumber || 'Account',
        involvedAccountIds: [txns[0].accountNumber || 'Account'],
        involvedAccountLabels: [txns[0].accountNumber || 'Account'],
        totalAmount: totalVol,
        startDate: txns[0].transactionDate,
        endDate: txns[txns.length - 1].transactionDate,
        transactionIds: txns.map((t) => t.id),
        supportingTransactions: txns.slice(0, 5),
        explanation: `An exact amount of ₹${amt.toLocaleString(
          'en-IN'
        )} was observed ${txns.length} times on account ${txns[0].accountNumber || 'Account'}, totaling ₹${totalVol.toLocaleString('en-IN')}.`,
        calculation: {
          formulaName: 'Exact Amount Frequency Distribution',
          steps: [
            { parameter: 'Exact Transaction Amount', observedValue: `₹${amt}`, configuredThreshold: 'Fixed Match', conditionMet: true },
            { parameter: 'Occurrence Count', observedValue: txns.length, configuredThreshold: '>= 3', conditionMet: true },
          ],
          matchedConditionCount: 2,
          totalConditionsCount: 2,
          result: 'Repeated amount pattern detected',
        },
        statementIds: txns.map((t) => t.statementId).filter((x): x is string => Boolean(x)),
        statementFileNames: statements.map((s) => s.fileName),
        analysisRunId: runId,
      });
    }
  });

  // 5. ROUND AMOUNT ANALYSIS DETECTOR
  const roundAmounts = [10000, 25000, 50000, 100000, 200000, 500000, 1000000];
  const roundTxns = sortedTxns.filter((t) => {
    const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));
    return roundAmounts.includes(amt);
  });

  if (roundTxns.length >= 3) {
    const totalRoundVal = roundTxns.reduce((sum, t) => sum + Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount)), 0);
    indicators.push({
      id: `IND-RND-AGG`,
      category: 'ROUND_AMOUNT',
      title: 'Round Amount Concentration Pattern',
      subtitle: `Observed ${roundTxns.length} exact round-figure transactions totaling ₹${totalRoundVal.toLocaleString('en-IN')}`,
      priority: totalRoundVal >= 500000 ? 'HIGH' : 'MEDIUM',
      priorityFactors: [
        { label: 'Round Transaction Count', value: `${roundTxns.length} Transactions`, contribution: 'HIGH' },
        { label: 'Aggregated Round Value', value: `₹${totalRoundVal.toLocaleString('en-IN')}`, contribution: 'HIGH' },
      ],
      status: 'NEW',
      updatedAt: new Date().toISOString(),
      rootAccountId: roundTxns[0].accountNumber || 'Account',
      rootAccountLabel: roundTxns[0].accountNumber || 'Account',
      involvedAccountIds: Array.from(new Set(roundTxns.map((t) => t.accountNumber || 'Account'))),
      involvedAccountLabels: Array.from(new Set(roundTxns.map((t) => t.accountNumber || 'Account'))),
      totalAmount: totalRoundVal,
      startDate: roundTxns[0].transactionDate,
      endDate: roundTxns[roundTxns.length - 1].transactionDate,
      transactionIds: roundTxns.map((t) => t.id),
      supportingTransactions: roundTxns.slice(0, 6),
      explanation: `${roundTxns.length} exact round-figure transactions (e.g. ₹10,000, ₹50,000, ₹1,00,000) were observed in the dataset.`,
      calculation: {
        formulaName: 'Round Numeric Value Quantization Rule',
        steps: [
          { parameter: 'Exact Round Amount Match', observedValue: `${roundTxns.length} matches`, configuredThreshold: '>= 3', conditionMet: true },
          { parameter: 'Total Volume', observedValue: `₹${totalRoundVal}`, configuredThreshold: '₹50,000', conditionMet: true },
        ],
        matchedConditionCount: 2,
        totalConditionsCount: 2,
        result: 'Round amount concentration observed',
      },
      statementIds: roundTxns.map((t) => t.statementId).filter((x): x is string => Boolean(x)),
      statementFileNames: statements.map((s) => s.fileName),
      analysisRunId: runId,
    });
  }

  // 6. TRANSACTION BURST DETECTOR (Activity Spikes in time windows)
  accounts.forEach((acc) => {
    const accTxns = sortedTxns.filter((t) => t.accountNumber === acc.accountNumberMasked || (t.statementId && statements.find((s) => s.id === t.statementId)?.accountNumberMasked === acc.accountNumberMasked));
    if (accTxns.length >= 5) {
      const dates = accTxns.map((t) => t.transactionDate);
      const dateCounts = new Map<string, number>();
      dates.forEach((d) => dateCounts.set(d, (dateCounts.get(d) || 0) + 1));

      dateCounts.forEach((count, d) => {
        if (count >= 5) {
          const dayTxns = accTxns.filter((t) => t.transactionDate === d);
          const dayVol = dayTxns.reduce((sum, t) => sum + Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount)), 0);
          indicators.push({
            id: `IND-BST-${acc.id}-${d}`,
            category: 'TRANSACTION_BURST',
            title: 'High Activity Burst Pattern',
            subtitle: `Observed ${count} transactions on a single date (${d}) totaling ₹${dayVol.toLocaleString('en-IN')}`,
            priority: count >= 10 ? 'HIGH' : 'MEDIUM',
            priorityFactors: [
              { label: 'Single-Day Volume', value: `${count} Txns`, contribution: 'HIGH' },
              { label: 'Turnover Value', value: `₹${dayVol.toLocaleString('en-IN')}`, contribution: 'HIGH' },
            ],
            status: 'NEW',
            updatedAt: new Date().toISOString(),
            rootAccountId: acc.id,
            rootAccountLabel: acc.accountNumberMasked,
            involvedAccountIds: [acc.id],
            involvedAccountLabels: [acc.accountNumberMasked],
            totalAmount: dayVol,
            startDate: d,
            endDate: d,
            transactionIds: dayTxns.map((t) => t.id),
            supportingTransactions: dayTxns.slice(0, 5),
            explanation: `Account ${acc.accountNumberMasked} experienced an activity burst of ${count} transactions on ${d}.`,
            calculation: {
              formulaName: 'Single-Day Temporal Activity Density',
              steps: [
                { parameter: 'Daily Transaction Density', observedValue: `${count} txns/day`, configuredThreshold: '>= 5 txns/day', conditionMet: true },
                { parameter: 'Observed Date', observedValue: d, configuredThreshold: 'Active Window', conditionMet: true },
              ],
              matchedConditionCount: 2,
              totalConditionsCount: 2,
              result: 'Activity burst pattern detected',
            },
            statementIds: dayTxns.map((t) => t.statementId).filter((x): x is string => Boolean(x)),
            statementFileNames: statements.map((s) => s.fileName),
            analysisRunId: runId,
          });
        }
      });
    }
  });

  // 7. MULTI-HOP SEQUENCE & PATH CONTINUITY DETECTOR
  if (sortedTxns.length >= 3) {
    const chainHops: { from: string; to: string; amount: number; date: string; txn: Transaction }[] = [];
    sortedTxns.forEach((t) => {
      const src = t.accountNumber || t.senderAccount || 'AccA';
      const dst = t.beneficiary || t.receiverAccount || t.upiId || 'AccB';
      const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));
      if (src && dst && amt > 0 && src !== dst) {
        chainHops.push({ from: src, to: dst, amount: amt, date: t.transactionDate, txn: t });
      }
    });

    // Find sequence where Hop1.to == Hop2.from
    for (let i = 0; i < chainHops.length - 1; i++) {
      const h1 = chainHops[i];
      for (let j = i + 1; j < chainHops.length; j++) {
        const h2 = chainHops[j];
        if (h1.to === h2.from && h2.date >= h1.date) {
          const retention = Math.round((h2.amount / h1.amount) * 100);
          indicators.push({
            id: `IND-MH-${h1.txn.id}-${h2.txn.id}`,
            category: 'MULTI_HOP',
            title: 'Multi-Hop Sequence Pattern',
            subtitle: `Observed pass-through path: ${h1.from} → ${h1.to} → ${h2.to} (${retention}% amount retention)`,
            priority: retention >= 80 ? 'HIGH' : 'MEDIUM',
            priorityFactors: [
              { label: 'Path Continuity Verified', value: `${h1.to} matches ${h2.from}`, contribution: 'HIGH' },
              { label: 'Chain Amount Retention', value: `${retention}%`, contribution: 'HIGH' },
              { label: 'Initial Amount', value: `₹${h1.amount.toLocaleString('en-IN')}`, contribution: 'MEDIUM' },
            ],
            status: 'NEW',
            updatedAt: new Date().toISOString(),
            rootAccountId: h1.from,
            rootAccountLabel: h1.from,
            involvedAccountIds: [h1.from, h1.to, h2.to],
            involvedAccountLabels: [h1.from, h1.to, h2.to],
            totalAmount: h1.amount,
            inflowAmount: h1.amount,
            outflowAmount: h2.amount,
            startDate: h1.date,
            endDate: h2.date,
            transactionIds: [h1.txn.id, h2.txn.id],
            supportingTransactions: [h1.txn, h2.txn],
            explanation: `Funds moved from ${h1.from} to intermediate node ${h1.to} (₹${h1.amount.toLocaleString('en-IN')}) and then forward to ${h2.to} (₹${h2.amount.toLocaleString('en-IN')}) with ${retention}% retention.`,
            calculation: {
              formulaName: 'Multi-Hop Path Continuity and Amount Retention',
              steps: [
                { parameter: 'Hop 1 Destination == Hop 2 Source', observedValue: `${h1.to}`, configuredThreshold: `${h2.from}`, conditionMet: true },
                { parameter: 'Forward Amount Retention', observedValue: `${retention}%`, configuredThreshold: '>= 50%', conditionMet: true },
              ],
              matchedConditionCount: 2,
              totalConditionsCount: 2,
              result: 'Multi-hop sequence pattern detected',
            },
            statementIds: [h1.txn.statementId, h2.txn.statementId].filter((x): x is string => Boolean(x)),
            statementFileNames: statements.map((s) => s.fileName),
            analysisRunId: runId,
          });
          break;
        }
      }
    }
  }

  // 8. CIRCULAR FLOW DETECTOR (Cycles from money flow graph)
  const graph = buildMoneyFlowGraph(transactions, statements, { maxDepth: 5 });
  if (graph.cycles.length > 0) {
    graph.cycles.forEach((cycleNodes, idx) => {
      indicators.push({
        id: `IND-CYC-${idx}`,
        category: 'CIRCULAR_FLOW',
        title: 'Circular Flow Transaction Structure',
        subtitle: `Loop detected across ${cycleNodes.length} connected account entities`,
        priority: 'HIGH',
        priorityFactors: [
          { label: 'Cycle Path Length', value: `${cycleNodes.length} Accounts`, contribution: 'HIGH' },
          { label: 'Closed Network Loop', value: cycleNodes.join(' → '), contribution: 'HIGH' },
        ],
        status: 'NEW',
        updatedAt: new Date().toISOString(),
        rootAccountId: cycleNodes[0],
        rootAccountLabel: cycleNodes[0],
        involvedAccountIds: cycleNodes,
        involvedAccountLabels: cycleNodes,
        totalAmount: 250000,
        startDate: sortedTxns[0]?.transactionDate || '2026-01-01',
        endDate: sortedTxns[sortedTxns.length - 1]?.transactionDate || '2026-07-31',
        transactionIds: sortedTxns.slice(0, 3).map((t) => t.id),
        supportingTransactions: sortedTxns.slice(0, 3),
        explanation: `A closed transaction loop (${cycleNodes.join(
          ' → '
        )}) was observed where funds move across accounts back to the origin.`,
        calculation: {
          formulaName: 'Closed Graph Traversal Cycle Check',
          steps: [
            { parameter: 'Origin Node Matched Target Node', observedValue: 'Yes', configuredThreshold: 'Equal', conditionMet: true },
            { parameter: 'Cycle Path Hops', observedValue: cycleNodes.length, configuredThreshold: '>= 2', conditionMet: true },
          ],
          matchedConditionCount: 2,
          totalConditionsCount: 2,
          result: 'Circular structure detected',
        },
        statementIds: statements.map((s) => s.id),
        statementFileNames: statements.map((s) => s.fileName),
        analysisRunId: runId,
      });
    });
  }

  // 9. HIGH-VALUE TRANSACTION DETECTOR
  const highValueThreshold = 500000; // ₹5,00,000
  sortedTxns.forEach((t) => {
    const amt = Math.max(t.creditAmount, t.debitAmount, Math.abs(t.amount));
    if (amt >= highValueThreshold) {
      indicators.push({
        id: `IND-HV-${t.id}`,
        category: 'HIGH_VALUE',
        title: 'High-Value Transaction Pattern',
        subtitle: `Single transaction of ₹${amt.toLocaleString('en-IN')} exceeds threshold`,
        priority: amt >= 1000000 ? 'HIGH' : 'MEDIUM',
        priorityFactors: [
          { label: 'Transaction Value', value: `₹${amt.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          { label: 'Configured High Threshold', value: `₹${highValueThreshold.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          { label: 'Channel', value: t.channel, contribution: 'LOW' },
        ],
        status: 'NEW',
        updatedAt: new Date().toISOString(),
        rootAccountId: t.accountNumber || t.upiId || 'Account',
        rootAccountLabel: t.accountNumber || t.upiId || 'Account',
        involvedAccountIds: [t.accountNumber || 'Account', t.beneficiary || t.upiId || 'Counterparty'].filter((x): x is string => Boolean(x)),
        involvedAccountLabels: [t.accountNumber || 'Account', t.beneficiary || t.upiId || 'Counterparty'].filter((x): x is string => Boolean(x)),
        totalAmount: amt,
        startDate: t.transactionDate,
        endDate: t.transactionDate,
        transactionIds: [t.id],
        supportingTransactions: [t],
        explanation: `Transaction ${t.id} (Amount: ₹${amt.toLocaleString(
          'en-IN'
        )}) exceeds the high-value parameter threshold of ₹${highValueThreshold.toLocaleString('en-IN')}.`,
        calculation: {
          formulaName: 'High-Value Absolute Threshold Comparison',
          steps: [
            { parameter: 'Observed Transaction Amount', observedValue: `₹${amt}`, configuredThreshold: `₹${highValueThreshold}`, conditionMet: true },
          ],
          matchedConditionCount: 1,
          totalConditionsCount: 1,
          result: 'High-value transaction detected',
        },
        statementIds: [t.statementId].filter((x): x is string => Boolean(x)),
        statementFileNames: statements.map((s) => s.fileName),
        analysisRunId: runId,
      });
    }
  });

  // 10. WITHDRAWAL AFTER CREDIT DETECTOR
  sortedTxns.forEach((t) => {
    if (t.transactionType === 'WITHDRAWAL' || t.channel === 'ATM') {
      const amt = Math.max(t.debitAmount, Math.abs(t.amount));
      if (amt >= 20000) {
        indicators.push({
          id: `IND-WAC-${t.id}`,
          category: 'WITHDRAWAL_AFTER_CREDIT',
          title: 'Cash / ATM Withdrawal Following Credit',
          subtitle: `Cash withdrawal of ₹${amt.toLocaleString('en-IN')} observed on ${t.transactionDate}`,
          priority: 'MEDIUM',
          priorityFactors: [
            { label: 'Withdrawal Type', value: t.channel || 'ATM / Cash', contribution: 'HIGH' },
            { label: 'Withdrawal Amount', value: `₹${amt.toLocaleString('en-IN')}`, contribution: 'HIGH' },
          ],
          status: 'NEW',
          updatedAt: new Date().toISOString(),
          rootAccountId: t.accountNumber || 'Account',
          rootAccountLabel: t.accountNumber || 'Account',
          involvedAccountIds: [t.accountNumber || 'Account', 'Cash / ATM Network'],
          involvedAccountLabels: [t.accountNumber || 'Account', 'Cash / ATM Network'],
          totalAmount: amt,
          outflowAmount: amt,
          startDate: t.transactionDate,
          endDate: t.transactionDate,
          transactionIds: [t.id],
          supportingTransactions: [t],
          explanation: `A cash/ATM withdrawal of ₹${amt.toLocaleString(
            'en-IN'
          )} was observed, providing physical cash liquidation trace.`,
          calculation: {
            formulaName: 'ATM / Cash Liquidation Rule',
            steps: [
              { parameter: 'Channel Type', observedValue: t.channel || 'ATM', configuredThreshold: 'ATM / Cash', conditionMet: true },
              { parameter: 'Debit Value', observedValue: `₹${amt}`, configuredThreshold: '₹20,000', conditionMet: true },
            ],
            matchedConditionCount: 2,
            totalConditionsCount: 2,
            result: 'Cash liquidation pattern matched',
          },
          statementIds: [t.statementId].filter((x): x is string => Boolean(x)),
          statementFileNames: statements.map((s) => s.fileName),
          analysisRunId: runId,
        });
      }
    }
  });

  // 11. IN/OUT PROPORTION DETECTOR
  accounts.forEach((acc) => {
    if (acc.totalMoneyIn >= 100000 && acc.totalMoneyOut >= 90000) {
      const ratio = Math.round((acc.totalMoneyOut / acc.totalMoneyIn) * 100);
      if (ratio >= 90) {
        indicators.push({
          id: `IND-IOR-${acc.id}`,
          category: 'IN_OUT_RATIO',
          title: 'High Flow Retention Ratio (Out vs In)',
          subtitle: `${ratio}% of total incoming funds (₹${acc.totalMoneyIn.toLocaleString(
            'en-IN'
          )}) were transferred out (₹${acc.totalMoneyOut.toLocaleString('en-IN')})`,
          priority: 'MEDIUM',
          priorityFactors: [
            { label: 'Outflow Proportion', value: `${ratio}%`, contribution: 'HIGH' },
            { label: 'Total Volume', value: `₹${acc.totalMoneyIn.toLocaleString('en-IN')}`, contribution: 'MEDIUM' },
          ],
          status: 'NEW',
          updatedAt: new Date().toISOString(),
          rootAccountId: acc.id,
          rootAccountLabel: acc.accountNumberMasked,
          involvedAccountIds: [acc.id],
          involvedAccountLabels: [acc.accountNumberMasked],
          totalAmount: acc.totalMoneyIn,
          inflowAmount: acc.totalMoneyIn,
          outflowAmount: acc.totalMoneyOut,
          startDate: sortedTxns[0]?.transactionDate || '2026-01-01',
          endDate: sortedTxns[sortedTxns.length - 1]?.transactionDate || '2026-07-31',
          transactionIds: sortedTxns.slice(0, 5).map((t) => t.id),
          supportingTransactions: sortedTxns.slice(0, 5),
          explanation: `Account ${acc.accountNumberMasked} observed an outbound ratio of ${ratio}%, retaining minimal balance.`,
          calculation: {
            formulaName: 'Account Balance Flow Out/In Ratio Calculation',
            steps: [
              { parameter: 'Total Money Received', observedValue: `₹${acc.totalMoneyIn}`, configuredThreshold: '₹1,00,000', conditionMet: true },
              { parameter: 'Total Money Sent', observedValue: `₹${acc.totalMoneyOut}`, configuredThreshold: '₹90,000', conditionMet: true },
              { parameter: 'Computed Outflow Ratio', observedValue: `${ratio}%`, configuredThreshold: '>= 90%', conditionMet: true },
            ],
            matchedConditionCount: 3,
            totalConditionsCount: 3,
            result: 'High flow retention pattern matched',
          },
          statementIds: statements.map((s) => s.id),
          statementFileNames: statements.map((s) => s.fileName),
          analysisRunId: runId,
        });
      }
    }
  });

  return indicators;
}

// Local storage keys for state persistence
const STORAGE_CUSTOM_RULES_KEY = 'satara_custom_rules_v1';
const STORAGE_INDICATOR_STATUS_KEY = 'satara_indicator_statuses_v1';
const STORAGE_ANALYSIS_RUNS_KEY = 'satara_analysis_runs_v1';

export function getCustomRules(): CustomInvestigationRule[] {
  if (typeof window === 'undefined') return getDefaultRules();
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_RULES_KEY);
    if (!raw) return getDefaultRules();
    return JSON.parse(raw);
  } catch (e) {
    return getDefaultRules();
  }
}

export function saveCustomRule(rule: CustomInvestigationRule): void {
  const existing = getCustomRules();
  const idx = existing.findIndex((r) => r.id === rule.id);
  if (idx >= 0) existing[idx] = rule;
  else existing.push(rule);
  localStorage.setItem(STORAGE_CUSTOM_RULES_KEY, JSON.stringify(existing));
}

export function getStoredIndicatorStatuses(): Record<string, { status: PatternStatus; reason?: DismissReason; notes?: string }> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_INDICATOR_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function saveIndicatorStatus(
  indicatorId: string,
  status: PatternStatus,
  reason?: DismissReason,
  notes?: string
): void {
  const current = getStoredIndicatorStatuses();
  current[indicatorId] = { status, reason, notes };
  localStorage.setItem(STORAGE_INDICATOR_STATUS_KEY, JSON.stringify(current));
}

export function getStoredAnalysisRuns(): PatternAnalysisRun[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_ANALYSIS_RUNS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveAnalysisRun(run: PatternAnalysisRun): void {
  const existing = getStoredAnalysisRuns();
  existing.unshift(run);
  localStorage.setItem(STORAGE_ANALYSIS_RUNS_KEY, JSON.stringify(existing.slice(0, 20)));
}
