import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import {
  RawParsedFile,
  SheetData,
  SystemFieldDefinition,
  SystemFieldKey,
  ColumnMappingState,
  Transaction,
  TransactionChannel,
  TransactionType,
  BankStatement,
} from '@/types/investigation';

export const SYSTEM_FIELDS: SystemFieldDefinition[] = [
  {
    key: 'transaction_date',
    label: 'Transaction Date',
    required: true,
    description: 'Date when transaction occurred (e.g., 01/04/2026)',
    example: '01/04/2026',
  },
  {
    key: 'narration',
    label: 'Description / Narration',
    required: true,
    description: 'Full particulars, remarks, or narration string',
    example: 'UPI/6123456789/Payee/OKAXIS',
  },
  {
    key: 'debit_amount',
    label: 'Debit Amount',
    required: false,
    description: 'Money deducted / withdrawn (Debit)',
    example: '1500.00',
  },
  {
    key: 'credit_amount',
    label: 'Credit Amount',
    required: false,
    description: 'Money received / deposited (Credit)',
    example: '25000.00',
  },
  {
    key: 'amount',
    label: 'Single Amount Column',
    required: false,
    description: 'Combined amount column (if file does not separate Debit/Credit)',
    example: '-500.00 or +1200.00',
  },
  {
    key: 'balance',
    label: 'Closing Balance',
    required: false,
    description: 'Account balance after transaction',
    example: '84920.50',
  },
  {
    key: 'transaction_id',
    label: 'Transaction ID / Ref / UTR',
    required: false,
    description: 'Unique reference number, UTR, or Cheque number',
    example: 'UTR61234901823',
  },
  {
    key: 'value_date',
    label: 'Value Date',
    required: false,
    description: 'Date transaction settled / valued',
    example: '01/04/2026',
  },
  {
    key: 'account_number',
    label: 'Account Number',
    required: false,
    description: 'Statement account or counterpart account number',
    example: 'XXXX1234',
  },
  {
    key: 'channel',
    label: 'Channel / Type',
    required: false,
    description: 'UPI, IMPS, NEFT, RTGS, ATM, etc.',
    example: 'UPI',
  },
  {
    key: 'beneficiary',
    label: 'Beneficiary Name',
    required: false,
    description: 'Name of sender or receiver',
    example: 'Rajesh Sharma',
  },
  {
    key: 'ifsc',
    label: 'IFSC Code',
    required: false,
    description: 'Bank branch IFSC code',
    example: 'SBIN0001234',
  },
  {
    key: 'upi_id',
    label: 'UPI ID / VPA',
    required: false,
    description: 'Virtual Payment Address',
    example: 'user@okicici',
  },
];

/**
 * Parses CSV, XLSX, or XLS files into raw sheets and row objects
 */
export async function parseUploadedFile(file: File): Promise<RawParsedFile> {
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  
  if (fileExtension === 'csv') {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: 'greedy',
        dynamicTyping: false,
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error('The uploaded CSV file contains no transaction rows.'));
            return;
          }
          const rawRows = results.data as Record<string, any>[];
          const headers = results.meta.fields || (rawRows[0] ? Object.keys(rawRows[0]) : []);
          
          resolve({
            fileName: file.name,
            fileType: 'csv',
            fileSize: file.size,
            sheets: [
              {
                sheetName: 'Main Statement',
                rowCount: rawRows.length,
                headers,
                rows: rawRows,
              },
            ],
          });
        },
        error: (err) => {
          reject(new Error(`CSV Parse Error: ${err.message}`));
        },
      });
    });
  }

  if (fileExtension === 'xlsx' || fileExtension === 'xls') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            reject(new Error('The Excel file contains no valid sheets.'));
            return;
          }

          const sheets: SheetData[] = [];

          for (const sheetName of workbook.SheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            // Convert to json objects with headers
            const rawJson = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
              defval: '',
              raw: false,
            });

            if (rawJson.length > 0) {
              const headers = Object.keys(rawJson[0]);
              sheets.push({
                sheetName,
                rowCount: rawJson.length,
                headers,
                rows: rawJson,
              });
            } else {
              sheets.push({
                sheetName,
                rowCount: 0,
                headers: [],
                rows: [],
              });
            }
          }

          if (sheets.length === 0) {
            reject(new Error('No transaction rows found in any worksheet.'));
            return;
          }

          resolve({
            fileName: file.name,
            fileType: fileExtension as 'xlsx' | 'xls',
            fileSize: file.size,
            sheets,
          });
        } catch (err: any) {
          reject(new Error(`Excel File Integrity Error: ${err.message || 'Corrupted or unreadable workbook.'}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file from storage.'));
      reader.readAsArrayBuffer(file);
    });
  }

  throw new Error('Unsupported file format. Please upload CSV, XLSX, or XLS files.');
}

/**
 * Auto-detect column mapping based on standard bank statement headers
 */
export function autoDetectColumnMapping(headers: string[]): ColumnMappingState {
  const mapping: ColumnMappingState = {};

  const cleanHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '');

  headers.forEach((header) => {
    const cleaned = cleanHeader(header);

    // Date
    if (!mapping.transaction_date) {
      if (
        cleaned.includes('txndate') ||
        cleaned.includes('transactiondate') ||
        cleaned.includes('postdate') ||
        cleaned.includes('valuedate') ||
        cleaned === 'date' ||
        cleaned.includes('transdate')
      ) {
        mapping.transaction_date = header;
      }
    }

    // Narration
    if (!mapping.narration) {
      if (
        cleaned.includes('narration') ||
        cleaned.includes('particular') ||
        cleaned.includes('description') ||
        cleaned.includes('remarks') ||
        cleaned.includes('details')
      ) {
        mapping.narration = header;
      }
    }

    // Debit Amount
    if (!mapping.debit_amount) {
      if (
        cleaned.includes('debit') ||
        cleaned.includes('withdrawal') ||
        cleaned.includes('dramount') ||
        cleaned.includes('dr')
      ) {
        mapping.debit_amount = header;
      }
    }

    // Credit Amount
    if (!mapping.credit_amount) {
      if (
        cleaned.includes('credit') ||
        cleaned.includes('deposit') ||
        cleaned.includes('cramount') ||
        cleaned.includes('cr')
      ) {
        mapping.credit_amount = header;
      }
    }

    // Single Amount
    if (!mapping.amount && !mapping.debit_amount && !mapping.credit_amount) {
      if (cleaned === 'amount' || cleaned === 'amt' || cleaned === 'transactionamount') {
        mapping.amount = header;
      }
    }

    // Balance
    if (!mapping.balance) {
      if (
        cleaned.includes('balance') ||
        cleaned.includes('closingbal') ||
        cleaned.includes('runningbal') ||
        cleaned === 'bal'
      ) {
        mapping.balance = header;
      }
    }

    // Reference / UTR
    if (!mapping.transaction_id && !mapping.utr) {
      if (
        cleaned.includes('utr') ||
        cleaned.includes('refno') ||
        cleaned.includes('chqno') ||
        cleaned.includes('chequeno') ||
        cleaned.includes('txnid') ||
        cleaned.includes('referenceno')
      ) {
        mapping.transaction_id = header;
      }
    }

    // Account Number
    if (!mapping.account_number) {
      if (cleaned.includes('account') || cleaned.includes('accno') || cleaned.includes('acno')) {
        mapping.account_number = header;
      }
    }

    // Beneficiary
    if (!mapping.beneficiary) {
      if (cleaned.includes('beneficiary') || cleaned.includes('payee') || cleaned.includes('name')) {
        mapping.beneficiary = header;
      }
    }

    // Channel
    if (!mapping.channel) {
      if (cleaned.includes('channel') || cleaned.includes('type') || cleaned.includes('mode')) {
        mapping.channel = header;
      }
    }
  });

  return mapping;
}

/**
 * Normalizes dates from various bank formats into standard YYYY-MM-DD
 */
export function normalizeDate(rawVal: any): string | null {
  if (!rawVal) return null;

  const str = String(rawVal).trim();
  if (!str) return null;

  // Check ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.substring(0, 10);
  }

  // Check DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
  const ddmmyyyy = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})/);
  if (ddmmyyyy) {
    let day = parseInt(ddmmyyyy[1], 10);
    let month = parseInt(ddmmyyyy[2], 10);
    let year = parseInt(ddmmyyyy[3], 10);
    if (year < 100) year += 2000;

    // Standard swap if month > 12
    if (month > 12 && day <= 12) {
      const temp = day;
      day = month;
      month = temp;
    }

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Check DD-MMM-YYYY (e.g., 01-Apr-2026 or 15-OCT-26)
  const ddmmmyyyy = str.match(/^(\d{1,2})[\/\-\s]([A-Za-z]{3})[\/\-\s](\d{2,4})/);
  if (ddmmmyyyy) {
    const day = parseInt(ddmmmyyyy[1], 10);
    let year = parseInt(ddmmmyyyy[3], 10);
    if (year < 100) year += 2000;

    const monthsMap: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };
    const monthStr = monthsMap[ddmmmyyyy[2].toLowerCase()];
    if (monthStr && day >= 1 && day <= 31) {
      return `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
    }
  }

  // JS Date parsing fallback
  const parsedDate = new Date(str);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toISOString().substring(0, 10);
  }

  return null;
}

/**
 * Normalizes financial amounts from string representations
 */
export function normalizeAmount(rawVal: any): number {
  if (rawVal === undefined || rawVal === null) return 0;
  if (typeof rawVal === 'number') return isNaN(rawVal) ? 0 : rawVal;

  let str = String(rawVal).trim();
  if (!str || str === '-' || str === '—' || str === 'N/A') return 0;

  // Remove currency symbols, commas, spaces
  let isNegative = str.includes('(') && str.includes(')');
  str = str.replace(/[₹$INR,\s]/gi, '').replace('(', '').replace(')', '');

  if (str.toLowerCase().endsWith('dr')) {
    isNegative = true;
    str = str.replace(/dr/gi, '');
  } else if (str.toLowerCase().endsWith('cr')) {
    str = str.replace(/cr/gi, '');
  }

  const val = parseFloat(str);
  if (isNaN(val)) return 0;

  return isNegative ? -Math.abs(val) : val;
}

/**
 * Infer Channel (UPI, IMPS, NEFT, RTGS, ATM, etc.) and Type (CREDIT, DEBIT, WITHDRAWAL, DEPOSIT)
 */
export function inferChannelAndType(
  narration: string,
  debit: number,
  credit: number,
  rawChannelField?: string
): { channel: TransactionChannel; transactionType: TransactionType } {
  const text = (narration + ' ' + (rawChannelField || '')).toUpperCase();

  let channel: TransactionChannel = 'OTHER';

  if (text.includes('UPI/') || text.includes('@UPI') || text.includes('UPI-') || text.includes('VPA/')) {
    channel = 'UPI';
  } else if (text.includes('IMPS/') || text.includes('IMPS-') || text.includes('P2A/')) {
    channel = 'IMPS';
  } else if (text.includes('NEFT') || text.includes('NFT')) {
    channel = 'NEFT';
  } else if (text.includes('RTGS')) {
    channel = 'RTGS';
  } else if (
    text.includes('ATM') ||
    text.includes('NWD') ||
    text.includes('WDL') ||
    text.includes('CASH WDL') ||
    text.includes('CASH WITHDRAWAL')
  ) {
    channel = 'ATM';
  } else if (text.includes('POS') || text.includes('CARD') || text.includes('ECOM') || text.includes('VISA') || text.includes('MASTER')) {
    channel = 'CARD';
  } else if (text.includes('CHQ') || text.includes('CHEQUE') || text.includes('CLEARING') || text.includes('CLG')) {
    channel = 'CHEQUE';
  } else if (text.includes('BY CASH') || text.includes('DEP CASH') || text.includes('CASH DEP') || text.includes('CASH DEPOSIT')) {
    channel = 'CASH';
  } else if (rawChannelField) {
    channel = 'OTHER';
  } else {
    channel = 'UNKNOWN';
  }

  let transactionType: TransactionType;

  if (debit > 0) {
    if (channel === 'ATM' || text.includes('CASH WDL') || text.includes('WITHDRAWAL')) {
      transactionType = 'WITHDRAWAL';
    } else {
      transactionType = 'DEBIT';
    }
  } else if (credit > 0) {
    if (channel === 'CASH' || text.includes('CASH DEP') || text.includes('DEPOSIT')) {
      transactionType = 'DEPOSIT';
    } else {
      transactionType = 'CREDIT';
    }
  } else {
    transactionType = 'DEBIT';
  }

  return { channel, transactionType };
}

/**
 * Extract UPI ID, UTR, Beneficiary or Accounts from narration string
 */
export function extractNarrationMetadata(narration: string) {
  let upiId: string | undefined;
  let utr: string | undefined;
  let beneficiary: string | undefined;

  // Extract UPI ID (e.g., user@okicici, 9876543210@ybl)
  const upiMatch = narration.match(/([a-zA-Z0-9\.\_\-]+@[a-zA-Z0-9]+)/);
  if (upiMatch) {
    upiId = upiMatch[1];
  }

  // Extract UTR or Txn ID (12 to 16 digit numbers following UPI/IMPS/NEFT)
  const utrMatch = narration.match(/(?:UPI|IMPS|NEFT|RTGS|REF|UTR)[\/\:\-]?([A-Za-z0-9]{9,22})/i);
  if (utrMatch) {
    utr = utrMatch[1];
  }

  // Extract potential name after UPI/ or IMPS/
  const nameMatch = narration.match(/(?:UPI|IMPS)\/[0-9]+\/([A-Za-z\s]+)\//);
  if (nameMatch) {
    beneficiary = nameMatch[1].trim();
  }

  return { upiId, utr, beneficiary };
}

/**
 * Masks account number for privacy rules (e.g. XXXX XXXX 1234)
 */
export function maskAccountNumber(acc: string): string {
  if (!acc) return 'XXXX XXXX 1234';
  const clean = acc.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length <= 4) return `XXXX ${clean}`;
  const last4 = clean.substring(clean.length - 4);
  return `XXXX XXXX ${last4}`;
}

/**
 * Converts selected raw sheet rows into normalized Transactions
 */
export function normalizeSheetToTransactions(
  statementId: string,
  sheetName: string,
  rows: Record<string, any>[],
  mapping: ColumnMappingState
): { transactions: Transaction[]; reviewRequiredCount: number } {
  const transactions: Transaction[] = [];
  let reviewRequiredCount = 0;

  rows.forEach((row, idx) => {
    const rawDate = mapping.transaction_date ? row[mapping.transaction_date] : null;
    const normalizedDate = normalizeDate(rawDate);

    const narration = mapping.narration ? String(row[mapping.narration] || '') : 'No description provided';

    let debit = 0;
    let credit = 0;

    if (mapping.debit_amount && row[mapping.debit_amount] !== undefined) {
      debit = Math.abs(normalizeAmount(row[mapping.debit_amount]));
    }

    if (mapping.credit_amount && row[mapping.credit_amount] !== undefined) {
      credit = Math.abs(normalizeAmount(row[mapping.credit_amount]));
    }

    if (!mapping.debit_amount && !mapping.credit_amount && mapping.amount) {
      const amtVal = normalizeAmount(row[mapping.amount]);
      if (amtVal < 0) {
        debit = Math.abs(amtVal);
      } else {
        credit = amtVal;
      }
    }

    const balance = mapping.balance ? normalizeAmount(row[mapping.balance]) : 0;
    const rawRef = mapping.transaction_id ? String(row[mapping.transaction_id] || '') : '';
    const rawChannel = mapping.channel ? String(row[mapping.channel] || '') : '';

    const { channel, transactionType } = inferChannelAndType(narration, debit, credit, rawChannel);
    const metadata = extractNarrationMetadata(narration);

    let hasIssue = false;
    let issueReason = '';

    if (!normalizedDate) {
      hasIssue = true;
      issueReason = 'Invalid or missing transaction date.';
    } else if (debit === 0 && credit === 0) {
      hasIssue = true;
      issueReason = 'Transaction amount is zero or unreadable.';
    }

    if (hasIssue) reviewRequiredCount++;

    const finalDate = normalizedDate || new Date().toISOString().substring(0, 10);
    const txnAmount = credit > 0 ? credit : -debit;

    transactions.push({
      id: `TXN-${statementId.substring(0, 8)}-${idx + 1}`,
      statementId,
      sourceSheet: sheetName,
      sourceRowNumber: idx + 2, // 1-indexed header + 1
      transactionDate: finalDate,
      narration: narration || 'Bank Transaction',
      debitAmount: debit,
      creditAmount: credit,
      amount: txnAmount,
      balance,
      transactionType,
      channel,
      transactionId: rawRef || metadata.utr,
      utr: metadata.utr || rawRef,
      upiId: metadata.upiId,
      beneficiary: metadata.beneficiary || (mapping.beneficiary ? String(row[mapping.beneficiary] || '') : undefined),
      accountNumber: mapping.account_number ? String(row[mapping.account_number] || '') : undefined,
      ifsc: mapping.ifsc ? String(row[mapping.ifsc] || '') : undefined,
      rawData: row,
      createdAt: new Date().toISOString(),
      hasReviewIssue: hasIssue,
      reviewReason: issueReason,
    });
  });

  return { transactions, reviewRequiredCount };
}
