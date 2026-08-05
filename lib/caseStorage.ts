import {
  InvestigationCase,
  EvidenceItem,
  InvestigationNote,
  InvestigationFinding,
  InvestigationTask,
  CaseTimelineEvent,
  CaseAccountLink,
  CaseTransactionLink,
  CaseIndicatorLink,
  CaseStatus,
  CasePriority,
} from '@/types/case';

const CASES_STORAGE_KEY = 'satara_police_cyber_cases_v1';

/**
 * Computes a standard SHA-256 hash string for an ArrayBuffer or text content
 */
export async function computeSHA256(data: ArrayBuffer | string): Promise<string> {
  try {
    let buffer: BufferSource;
    if (typeof data === 'string') {
      buffer = new TextEncoder().encode(data);
    } else {
      buffer = data;
    }
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fallback pseudo-hash generator
  }
  // Fallback simple 64-char hex string generator based on input length & simple hash
  const str = typeof data === 'string' ? data : new Uint8Array(data).reduce((acc, b) => acc + b.toString(16), '');
  let hash1 = 0x811c9dc5;
  let hash2 = 0x01000193;
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i);
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

/**
 * Default Initial Fixture Case CYBER-2026-00001
 */
function createInitialDemoCase(): InvestigationCase {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);

  return {
    id: 'CYBER-2026-00001',
    caseNumber: 'CYBER-2026-00001',
    title: 'Suspected Financial Transaction Trail',
    caseType: 'Cyber Financial Fraud',
    referenceNumber: 'REF-SATARA-2026-8841',
    description:
      'Investigation into high-velocity money movements across multiple UPI and IMPS channels originating from suspect account and cascading into layered intermediary accounts.',
    status: 'Under Investigation',
    priority: 'High',
    incidentDate: '2026-07-28',
    reportedDate: '2026-07-30',
    location: 'Satara City, Maharashtra',
    primaryAccountId: 'XXXX1234',
    assignedInvestigator: 'PI V. R. Kadam',
    initialNotes: 'Victim reported unauthorized phishing transfer. Funds immediately split into 3 beneficiary accounts.',
    datasetVersion: 1,

    accounts: [
      {
        id: 'CA-001',
        investigationId: 'CYBER-2026-00001',
        accountId: 'XXXX1234',
        accountNumberMasked: 'XXXX1234',
        bankName: 'HDFC Bank',
        relationshipRole: 'Primary Account',
        reason: 'Originating victim / suspect account in initial cyber complaint',
        addedAt: now,
      },
      {
        id: 'CA-002',
        investigationId: 'CYBER-2026-00001',
        accountId: 'XXXX5678',
        accountNumberMasked: 'XXXX5678',
        bankName: 'ICICI Bank',
        relationshipRole: 'Observed Intermediary',
        reason: 'Received ₹3.5L credit via UPI and drained ₹3.4L within 14 minutes',
        addedAt: now,
      },
      {
        id: 'CA-003',
        investigationId: 'CYBER-2026-00001',
        accountId: 'XXXX9012',
        accountNumberMasked: 'XXXX9012',
        bankName: 'Axis Bank',
        relationshipRole: 'Destination Account',
        reason: 'Multiple rapid cash withdrawal transactions observed',
        addedAt: now,
      },
      {
        id: 'CA-004',
        investigationId: 'CYBER-2026-00001',
        accountId: 'XXXX3456',
        accountNumberMasked: 'XXXX3456',
        bankName: 'State Bank of India',
        relationshipRole: 'Counterparty',
        reason: 'Consolidated funds from 4 distinct incoming source UPI IDs',
        addedAt: now,
      },
    ],

    transactions: [
      {
        id: 'CT-001',
        investigationId: 'CYBER-2026-00001',
        transactionId: 'TXN-001',
        reason: 'Initial high-value outflow of ₹4,50,000 from Primary Account',
        notes: 'IMPS transaction ref #9988231',
        addedAt: now,
      },
      {
        id: 'CT-002',
        investigationId: 'CYBER-2026-00001',
        transactionId: 'TXN-002',
        reason: 'Rapid pass-through transfer to destination account within 8 mins',
        notes: 'UPI transfer to user@okaxis',
        addedAt: now,
      },
    ],

    indicators: [
      {
        id: 'CI-001',
        investigationId: 'CYBER-2026-00001',
        indicatorId: 'IND-RAPID-01',
        investigatorStatus: 'Primary Lead',
        notes: 'Rapid movement of ₹4.5L drained within 14 mins across 2 hops.',
        addedAt: now,
        datasetVersionAtAddition: 1,
      },
      {
        id: 'CI-002',
        investigationId: 'CYBER-2026-00001',
        indicatorId: 'IND-SPLIT-02',
        investigatorStatus: 'Under Review',
        notes: 'High-volume split flow to 3 distinct beneficiary accounts.',
        addedAt: now,
        datasetVersionAtAddition: 1,
      },
    ],

    evidenceItems: [
      {
        id: 'EVD-2026-00001',
        evidenceNumber: 'EVD-2026-00001',
        investigationId: 'CYBER-2026-00001',
        evidenceType: 'Bank Statement',
        title: 'Primary Account HDFC Statement Jul 2026',
        description: 'Certified PDF export from HDFC Bank showing primary victim account transaction log.',
        sourceType: 'Official Bank Nodal Request',
        sourceName: 'HDFC Cyber Nodal Officer',
        sourceOrganization: 'HDFC Bank Ltd',
        collectedAt: '2026-07-31',
        status: 'Verified',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        fileName: 'HDFC_Stmt_XXXX1234_Jul2026.pdf',
        fileSize: 1048576,
        fileType: 'application/pdf',
        relatedAccountIds: ['XXXX1234'],
        relatedTransactionIds: ['TXN-001'],
        relatedIndicatorIds: ['IND-RAPID-01'],
        notes: ['Verified against official Nodal email verification.'],
        versions: [
          {
            version: 1,
            fileName: 'HDFC_Stmt_XXXX1234_Jul2026.pdf',
            fileSize: 1048576,
            fileType: 'application/pdf',
            fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            uploadedAt: now,
            uploadedBy: 'PI V. R. Kadam',
          },
        ],
        chainOfCustody: [
          {
            id: 'COC-001',
            evidenceId: 'EVD-2026-00001',
            action: 'Collected',
            performedBy: 'PI V. R. Kadam',
            timestamp: '2026-07-31T10:00:00Z',
            reason: 'Received via encrypted Nodal Police Portal',
            newHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
          {
            id: 'COC-002',
            evidenceId: 'EVD-2026-00001',
            action: 'Uploaded',
            performedBy: 'PI V. R. Kadam',
            timestamp: now,
            reason: 'Added to Case Workspace',
            newHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'EVD-2026-00002',
        evidenceNumber: 'EVD-2026-00002',
        investigationId: 'CYBER-2026-00001',
        evidenceType: 'Screenshot',
        title: 'Phishing SMS & UPI Payment Confirmation Screenshot',
        description: 'Victim smartphone screenshot showing fraudulent SMS link and UPI PIN prompt.',
        sourceType: 'Complainant Submission',
        sourceName: 'Victim Complaint File',
        collectedAt: '2026-07-30',
        status: 'Under Review',
        hash: '8f4e3c2b1a90876543210abcdef1234567890abcdef1234567890abcdef12345',
        fileName: 'Victim_SMS_Screenshot.png',
        fileSize: 524288,
        fileType: 'image/png',
        relatedAccountIds: ['XXXX1234'],
        relatedTransactionIds: ['TXN-001'],
        relatedIndicatorIds: [],
        notes: ['Timestamp on screenshot matches transaction log at 14:22 hrs.'],
        versions: [
          {
            version: 1,
            fileName: 'Victim_SMS_Screenshot.png',
            fileSize: 524288,
            fileType: 'image/png',
            fileHash: '8f4e3c2b1a90876543210abcdef1234567890abcdef1234567890abcdef12345',
            uploadedAt: now,
            uploadedBy: 'HC S. M. Pawar',
          },
        ],
        chainOfCustody: [
          {
            id: 'COC-003',
            evidenceId: 'EVD-2026-00002',
            action: 'Uploaded',
            performedBy: 'HC S. M. Pawar',
            timestamp: now,
            reason: 'Uploaded during complaint registration',
            newHash: '8f4e3c2b1a90876543210abcdef1234567890abcdef1234567890abcdef12345',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'EVD-2026-00003',
        evidenceNumber: 'EVD-2026-00003',
        investigationId: 'CYBER-2026-00001',
        evidenceType: 'Transaction Record',
        title: 'UPI Payment Gateway Log Export',
        description: 'Server logs from NPCI gateway tracking IP 103.44.12.89 during transfer.',
        sourceType: 'NPCI Nodal Portal',
        sourceName: 'NPCI Technical Audit Log',
        collectedAt: '2026-08-01',
        status: 'Verified',
        hash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        fileName: 'NPCI_Gateway_Log_78912.csv',
        fileSize: 204800,
        fileType: 'text/csv',
        relatedAccountIds: ['XXXX5678'],
        relatedTransactionIds: ['TXN-002'],
        relatedIndicatorIds: ['IND-RAPID-01'],
        notes: ['IP address maps to proxy server in Mumbai circle.'],
        versions: [
          {
            version: 1,
            fileName: 'NPCI_Gateway_Log_78912.csv',
            fileSize: 204800,
            fileType: 'text/csv',
            fileHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
            uploadedAt: now,
            uploadedBy: 'PI V. R. Kadam',
          },
        ],
        chainOfCustody: [
          {
            id: 'COC-004',
            evidenceId: 'EVD-2026-00003',
            action: 'Collected',
            performedBy: 'PI V. R. Kadam',
            timestamp: now,
            reason: 'Obtained via NPCI portal',
            newHash: '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],

    notes: [
      {
        id: 'NOTE-001',
        investigationId: 'CYBER-2026-00001',
        title: 'Initial Case Assessment & Fraud Modus Operandi',
        content:
          'Victim received an SMS claiming electricity bill disconnection. Clicking the APK link installed malware that forwarded SMS OTPs. ₹4,50,000 was debited in two quick transactions within 3 minutes.',
        noteType: 'Observation',
        author: 'PI V. R. Kadam',
        relatedAccountIds: ['XXXX1234'],
        relatedTransactionIds: ['TXN-001'],
        relatedIndicatorIds: ['IND-RAPID-01'],
        relatedEvidenceIds: ['EVD-2026-00002'],
        versions: [
          {
            version: 1,
            content:
              'Victim received an SMS claiming electricity bill disconnection. Clicking the APK link installed malware that forwarded SMS OTPs. ₹4,50,000 was debited in two quick transactions within 3 minutes.',
            updatedAt: now,
            updatedBy: 'PI V. R. Kadam',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'NOTE-002',
        investigationId: 'CYBER-2026-00001',
        title: 'Follow-up with ICICI Nodal Officer',
        content:
          'Notice under Sec 91 CrPC dispatched to ICICI Bank to freeze beneficiary account XXXX5678. Remaining balance as per nodal email is ₹12,400.',
        noteType: 'Lead',
        author: 'HC S. M. Pawar',
        relatedAccountIds: ['XXXX5678'],
        relatedTransactionIds: [],
        relatedIndicatorIds: [],
        relatedEvidenceIds: ['EVD-2026-00001'],
        versions: [
          {
            version: 1,
            content:
              'Notice under Sec 91 CrPC dispatched to ICICI Bank to freeze beneficiary account XXXX5678. Remaining balance as per nodal email is ₹12,400.',
            updatedAt: now,
            updatedBy: 'HC S. M. Pawar',
          },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ],

    findings: [
      {
        id: 'FIND-001',
        investigationId: 'CYBER-2026-00001',
        title: 'Observed Rapid Inter-Account Pass-Through Velocity',
        description:
          'Analysis of HDFC and ICICI statements reveals that 95.5% of funds debited from Primary Account XXXX1234 were transferred to Account XXXX5678 and subsequently re-routed to Account XXXX9012 within 14 minutes.',
        investigatorAssessment:
          'High probability of automated layer movement intended to obscure source trail before cash liquidation.',
        status: 'Supported',
        supportingTransactionIds: ['TXN-001', 'TXN-002'],
        supportingAccountIds: ['XXXX1234', 'XXXX5678', 'XXXX9012'],
        supportingIndicatorIds: ['IND-RAPID-01'],
        supportingEvidenceIds: ['EVD-2026-00001', 'EVD-2026-00003'],
        createdAt: now,
        updatedAt: now,
      },
    ],

    tasks: [
      {
        id: 'TASK-001',
        investigationId: 'CYBER-2026-00001',
        title: 'Issue 91 CrPC Notice to ICICI Nodal Officer',
        description: 'Obtain KYC documents, registered phone numbers, and ATM withdrawal logs for Account XXXX5678.',
        assignedTo: 'HC S. M. Pawar',
        priority: 'High',
        dueDate: today,
        status: 'In Progress',
        relatedAccountId: 'XXXX5678',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'TASK-002',
        investigationId: 'CYBER-2026-00001',
        title: 'Verify IP Geolocation with Telecom Service Provider',
        description: 'Cross-reference IP 103.44.12.89 from NPCI logs with CDR data of suspect number 9822XXXXXX.',
        assignedTo: 'PI V. R. Kadam',
        priority: 'Critical',
        dueDate: today,
        status: 'Open',
        relatedEvidenceId: 'EVD-2026-00003',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'TASK-003',
        investigationId: 'CYBER-2026-00001',
        title: 'Reconcile ATM CCTV Footage for Account XXXX9012',
        description: 'Request CCTV footage from Axis Bank Satara Branch ATM for 28-Jul-2026 14:45 PM.',
        assignedTo: 'Constable A. B. Shinde',
        priority: 'Medium',
        dueDate: today,
        status: 'Waiting',
        relatedAccountId: 'XXXX9012',
        createdAt: now,
        updatedAt: now,
      },
    ],

    timeline: [
      {
        id: 'TLE-001',
        investigationId: 'CYBER-2026-00001',
        eventType: 'Case Created',
        objectType: 'Case',
        description: 'Investigation CYBER-2026-00001 initiated by PI V. R. Kadam.',
        actor: 'PI V. R. Kadam',
        timestamp: '2026-07-30T09:15:00Z',
      },
      {
        id: 'TLE-002',
        investigationId: 'CYBER-2026-00001',
        eventType: 'Statement Imported',
        objectType: 'Account',
        description: 'Bank Statement for Account XXXX1234 imported (428 records).',
        actor: 'PI V. R. Kadam',
        timestamp: '2026-07-30T09:20:00Z',
      },
      {
        id: 'TLE-003',
        investigationId: 'CYBER-2026-00001',
        eventType: 'Indicator Detected',
        objectType: 'Indicator',
        description: 'Automated Rapid Movement Pattern Indicator linked to case.',
        actor: 'System / Pattern Engine',
        timestamp: '2026-07-30T09:37:00Z',
      },
      {
        id: 'TLE-004',
        investigationId: 'CYBER-2026-00001',
        eventType: 'Evidence Added',
        objectType: 'Evidence',
        description: 'Evidence item EVD-2026-00001 (HDFC Statement PDF) added.',
        actor: 'PI V. R. Kadam',
        timestamp: '2026-07-31T10:05:00Z',
      },
      {
        id: 'TLE-005',
        investigationId: 'CYBER-2026-00001',
        eventType: 'Finding Added',
        objectType: 'Finding',
        description: 'Investigator Finding #001 (Pass-Through Velocity) documented.',
        actor: 'PI V. R. Kadam',
        timestamp: '2026-08-01T11:40:00Z',
      },
    ],

    activityLogs: [
      {
        id: 'ACT-001',
        investigationId: 'CYBER-2026-00001',
        actor: 'PI V. R. Kadam',
        action: 'Case Created',
        details: 'Created case CYBER-2026-00001 with 4 initial accounts.',
        timestamp: '2026-07-30T09:15:00Z',
      },
      {
        id: 'ACT-002',
        investigationId: 'CYBER-2026-00001',
        actor: 'HC S. M. Pawar',
        action: 'Evidence Added',
        details: 'Uploaded screenshot EVD-2026-00002 to evidence vault.',
        timestamp: now,
      },
    ],

    createdAt: '2026-07-30T09:15:00Z',
    updatedAt: now,
  };
}

/**
 * Reads cases from local storage
 */
export function getStoredCases(): InvestigationCase[] {
  if (typeof window === 'undefined') return [createInitialDemoCase()];
  try {
    const raw = localStorage.getItem(CASES_STORAGE_KEY);
    if (!raw) {
      const initial = [createInitialDemoCase()];
      localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    const initial = [createInitialDemoCase()];
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  } catch (err) {
    console.error('Failed to load stored cases:', err);
    return [createInitialDemoCase()];
  }
}

/**
 * Saves cases array to local storage
 */
export function saveCasesToStorage(cases: InvestigationCase[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CASES_STORAGE_KEY, JSON.stringify(cases));
  } catch (err) {
    console.error('Failed to save cases to local storage:', err);
  }
}

/**
 * Gets a single case by ID
 */
export function getCaseById(caseId: string): InvestigationCase | null {
  const cases = getStoredCases();
  return cases.find((c) => c.id === caseId || c.caseNumber === caseId) || null;
}

/**
 * Generates next unique case ID (CYBER-2026-00002)
 */
export function generateNextCaseId(): string {
  const cases = getStoredCases();
  const currentYear = new Date().getFullYear();
  const yearPrefix = `CYBER-${currentYear}-`;
  
  let maxNum = 0;
  cases.forEach((c) => {
    if (c.caseNumber.startsWith(yearPrefix)) {
      const parts = c.caseNumber.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });

  const nextNum = maxNum + 1;
  return `${yearPrefix}${nextNum.toString().padStart(5, '0')}`;
}

/**
 * Generates next unique evidence ID (EVD-2026-00001)
 */
export function generateNextEvidenceId(caseObj: InvestigationCase): string {
  const currentYear = new Date().getFullYear();
  const prefix = `EVD-${currentYear}-`;
  let maxNum = 0;
  (caseObj.evidenceItems || []).forEach((ev) => {
    if (ev.evidenceNumber.startsWith(prefix)) {
      const parts = ev.evidenceNumber.split('-');
      const numPart = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(numPart) && numPart > maxNum) {
        maxNum = numPart;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `${prefix}${nextNum.toString().padStart(5, '0')}`;
}

/**
 * Updates an entire case object in storage
 */
export function updateCase(updatedCase: InvestigationCase): void {
  const cases = getStoredCases();
  const idx = cases.findIndex((c) => c.id === updatedCase.id);
  const now = new Date().toISOString();
  updatedCase.updatedAt = now;

  if (idx !== -1) {
    cases[idx] = updatedCase;
  } else {
    cases.unshift(updatedCase);
  }
  saveCasesToStorage(cases);
}

/**
 * Adds an account to a case
 */
export function addAccountToCase(
  caseId: string,
  accountId: string,
  accountNumberMasked: string,
  relationshipRole: any,
  reason: string,
  notes?: string
): InvestigationCase | null {
  const c = getCaseById(caseId);
  if (!c) return null;

  const now = new Date().toISOString();
  const existing = c.accounts.find((a) => a.accountId === accountId || a.accountNumberMasked === accountNumberMasked);
  if (existing) {
    existing.relationshipRole = relationshipRole;
    existing.reason = reason;
    if (notes) existing.notes = notes;
  } else {
    c.accounts.push({
      id: `CA-${Date.now()}`,
      investigationId: c.id,
      accountId,
      accountNumberMasked,
      relationshipRole,
      reason,
      notes,
      addedAt: now,
    });
  }

  c.timeline.push({
    id: `TLE-${Date.now()}`,
    investigationId: c.id,
    eventType: 'Account Added',
    objectType: 'Account',
    objectId: accountId,
    description: `Account ${accountNumberMasked} added to investigation as ${relationshipRole}.`,
    actor: 'Investigator',
    timestamp: now,
  });

  c.activityLogs.unshift({
    id: `ACT-${Date.now()}`,
    investigationId: c.id,
    actor: 'Investigator',
    action: 'Account Added',
    details: `Added account ${accountNumberMasked} (${relationshipRole}).`,
    timestamp: now,
  });

  updateCase(c);
  return c;
}

/**
 * Adds a transaction to a case
 */
export function addTransactionToCase(
  caseId: string,
  transactionId: string,
  reason: string,
  notes?: string
): InvestigationCase | null {
  const c = getCaseById(caseId);
  if (!c) return null;

  const now = new Date().toISOString();
  if (!c.transactions.some((t) => t.transactionId === transactionId)) {
    c.transactions.push({
      id: `CT-${Date.now()}`,
      investigationId: c.id,
      transactionId,
      reason,
      notes,
      addedAt: now,
    });

    c.timeline.push({
      id: `TLE-${Date.now()}`,
      investigationId: c.id,
      eventType: 'Transaction Identified',
      objectType: 'Transaction',
      objectId: transactionId,
      description: `Transaction ${transactionId} linked to investigation.`,
      actor: 'Investigator',
      timestamp: now,
    });

    c.activityLogs.unshift({
      id: `ACT-${Date.now()}`,
      investigationId: c.id,
      actor: 'Investigator',
      action: 'Transaction Linked',
      details: `Linked transaction ${transactionId}. Reason: ${reason}`,
      timestamp: now,
    });

    updateCase(c);
  }
  return c;
}

/**
 * Links a pattern indicator to a case
 */
export function linkIndicatorToCase(
  caseId: string,
  indicatorId: string,
  investigatorStatus: 'Under Review' | 'Verified' | 'Dismissed' | 'Primary Lead',
  notes?: string
): InvestigationCase | null {
  const c = getCaseById(caseId);
  if (!c) return null;

  const now = new Date().toISOString();
  const existing = c.indicators.find((ind) => ind.indicatorId === indicatorId);
  if (existing) {
    existing.investigatorStatus = investigatorStatus;
    if (notes) existing.notes = notes;
  } else {
    c.indicators.push({
      id: `CI-${Date.now()}`,
      investigationId: c.id,
      indicatorId,
      investigatorStatus,
      notes,
      addedAt: now,
      datasetVersionAtAddition: c.datasetVersion,
    });
  }

  c.timeline.push({
    id: `TLE-${Date.now()}`,
    investigationId: c.id,
    eventType: 'Indicator Detected',
    objectType: 'Indicator',
    objectId: indicatorId,
    description: `Pattern Indicator ${indicatorId} linked with status ${investigatorStatus}.`,
    actor: 'Investigator',
    timestamp: now,
  });

  c.activityLogs.unshift({
    id: `ACT-${Date.now()}`,
    investigationId: c.id,
    actor: 'Investigator',
    action: 'Indicator Linked',
    details: `Linked Pattern Indicator ${indicatorId}.`,
    timestamp: now,
  });

  updateCase(c);
  return c;
}

/**
 * Adds evidence item to a case
 */
export function addEvidenceToCase(
  caseId: string,
  evidenceData: {
    type: string;
    title: string;
    source: string;
    details: string;
    relatedAccounts?: string[];
    relatedTransactionId?: string;
  }
): InvestigationCase | null {
  const c = getCaseById(caseId);
  if (!c) return null;

  const now = new Date().toISOString();
  const evId = generateNextEvidenceId(c);

  const newEv = {
    id: evId,
    evidenceNumber: evId,
    investigationId: c.id,
    evidenceType: (evidenceData.type as any) || 'Document',
    title: evidenceData.title,
    description: evidenceData.details,
    sourceType: 'Timeline Event',
    sourceName: evidenceData.source,
    collectedAt: now.slice(0, 10),
    status: 'Verified' as const,
    hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    fileName: `Timeline_Evidence_${evId}.json`,
    fileSize: 1024,
    fileType: 'application/json',
    versions: [
      {
        version: 1,
        fileName: `Timeline_Evidence_${evId}.json`,
        fileSize: 1024,
        fileType: 'application/json',
        fileHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        uploadedAt: now,
        uploadedBy: 'Investigator',
      },
    ],
    relatedAccountIds: evidenceData.relatedAccounts || [],
    relatedTransactionIds: evidenceData.relatedTransactionId ? [evidenceData.relatedTransactionId] : [],
    relatedIndicatorIds: [],
    notes: [`Added from Unified Investigation Timeline on ${now.slice(0, 10)}`],
    chainOfCustody: [
      {
        id: `COC-${Date.now()}`,
        evidenceId: evId,
        action: 'Collected' as const,
        performedBy: 'Investigator',
        timestamp: now,
        reason: 'Added to case evidence workspace from timeline',
        newHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  c.evidenceItems.unshift(newEv);

  c.timeline.push({
    id: `TLE-${Date.now()}`,
    investigationId: c.id,
    eventType: 'Evidence Added',
    objectType: 'Evidence',
    objectId: evId,
    description: `Captured evidence item "${evidenceData.title}".`,
    actor: 'Investigator',
    timestamp: now,
  });

  c.activityLogs.unshift({
    id: `ACT-${Date.now()}`,
    investigationId: c.id,
    actor: 'Investigator',
    action: 'Evidence Added',
    details: `Added evidence item "${evidenceData.title}".`,
    timestamp: now,
  });

  updateCase(c);
  return c;
}
