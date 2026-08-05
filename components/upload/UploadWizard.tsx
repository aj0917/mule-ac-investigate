'use client';

import React, { useState } from 'react';
import {
  RawParsedFile,
  ColumnMappingState,
  UploadStep,
  SystemFieldKey,
  BankStatement,
  Transaction,
} from '@/types/investigation';
import {
  parseUploadedFile,
  autoDetectColumnMapping,
  normalizeSheetToTransactions,
  maskAccountNumber,
} from '@/lib/statement-parser';

import { UploadDropzone } from './UploadDropzone';
import { SheetSelector } from './SheetSelector';
import { ColumnMapping } from './ColumnMapping';
import { StatementPreview } from './StatementPreview';
import { ImportSummary } from './ImportSummary';
import { ImportProgress } from './ImportProgress';
import { ImportResult } from './ImportResult';
import { DuplicateWarningModal } from './DuplicateWarningModal';
import { FileSpreadsheet, X, Check, ChevronRight } from 'lucide-react';

interface UploadWizardProps {
  isOpen: boolean;
  onClose: () => void;
  existingStatements: BankStatement[];
  onImportCompleted: (statement: BankStatement, transactions: Transaction[]) => void;
  onViewTransactions: () => void;
  onViewDashboard: () => void;
}

export const UploadWizard: React.FC<UploadWizardProps> = ({
  isOpen,
  onClose,
  existingStatements,
  onImportCompleted,
  onViewTransactions,
  onViewDashboard,
}) => {
  const [step, setStep] = useState<UploadStep>('dropzone');
  const [file, setFile] = useState<File | null>(null);
  const [parsedFile, setParsedFile] = useState<RawParsedFile | null>(null);
  const [selectedSheetName, setSelectedSheetName] = useState<string>('');
  const [mapping, setMapping] = useState<ColumnMappingState>({});
  const [parseError, setParseError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [duplicateWarning, setDuplicateWarning] = useState<BankStatement | null>(null);

  // Computed transactions state
  const [pendingStatement, setPendingStatement] = useState<BankStatement | null>(null);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);

  if (!isOpen) return null;

  const handleFileSelected = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);

    try {
      const parsed = await parseUploadedFile(selectedFile);
      setParsedFile(parsed);
      setIsParsing(false);

      // Check duplicate
      const duplicate = existingStatements.find((s) => s.fileName === selectedFile.name);
      if (duplicate) {
        setDuplicateWarning(duplicate);
      }

      // Default sheet
      const defaultSheet = parsed.sheets[0];
      if (defaultSheet) {
        setSelectedSheetName(defaultSheet.sheetName);
        const autoMap = autoDetectColumnMapping(defaultSheet.headers);
        setMapping(autoMap);
      }

      if (parsed.sheets.length > 1) {
        setStep('sheet_select');
      } else {
        setStep('mapping');
      }
    } catch (err: any) {
      setIsParsing(false);
      setParseError(err.message || 'File validation failed.');
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParsedFile(null);
    setSelectedSheetName('');
    setMapping({});
    setParseError(null);
    setStep('dropzone');
  };

  const handleSheetSelected = (sheetName: string) => {
    setSelectedSheetName(sheetName);
    const sheet = parsedFile?.sheets.find((s) => s.sheetName === sheetName);
    if (sheet) {
      const autoMap = autoDetectColumnMapping(sheet.headers);
      setMapping(autoMap);
    }
  };

  const handleChangeMapping = (key: SystemFieldKey, selectedHeader: string) => {
    setMapping((prev) => ({
      ...prev,
      [key]: selectedHeader || undefined,
    }));
  };

  const handleAutoMap = () => {
    const sheet = parsedFile?.sheets.find((s) => s.sheetName === selectedSheetName);
    if (sheet) {
      setMapping(autoDetectColumnMapping(sheet.headers));
    }
  };

  const currentSheet = parsedFile?.sheets.find((s) => s.sheetName === selectedSheetName);

  // Calculate summary metrics for ready stage
  const computeNormalizedData = () => {
    if (!currentSheet || !file) return null;
    const stmtId = `STMT-${Date.now()}`;
    const { transactions, reviewRequiredCount } = normalizeSheetToTransactions(
      stmtId,
      selectedSheetName,
      currentSheet.rows,
      mapping
    );

    let totalMoneyIn = 0;
    let totalMoneyOut = 0;
    let totalWithdrawals = 0;
    let totalDeposits = 0;

    transactions.forEach((t) => {
      if (t.creditAmount > 0) totalMoneyIn += t.creditAmount;
      if (t.debitAmount > 0) totalMoneyOut += t.debitAmount;
      if (t.transactionType === 'WITHDRAWAL') totalWithdrawals += t.debitAmount;
      if (t.transactionType === 'DEPOSIT') totalDeposits += t.creditAmount;
    });

    const dates = transactions.map((t) => t.transactionDate).filter(Boolean).sort();
    const periodStart = dates[0] || null;
    const periodEnd = dates[dates.length - 1] || null;

    const bankName = file.name.toUpperCase().includes('HDFC')
      ? 'HDFC Bank'
      : file.name.toUpperCase().includes('SBI')
      ? 'State Bank of India'
      : file.name.toUpperCase().includes('ICICI')
      ? 'ICICI Bank'
      : file.name.toUpperCase().includes('AXIS')
      ? 'Axis Bank'
      : 'Nationalized Bank';

    const statementObj: BankStatement = {
      id: stmtId,
      fileName: file.name,
      fileType: file.name.split('.').pop() as any,
      fileSize: file.size,
      bankName,
      accountNumberMasked: maskAccountNumber(''),
      accountNumberHash: `hash_${Date.now()}`,
      periodStart,
      periodEnd,
      importedAt: new Date().toISOString(),
      rowCount: transactions.length,
      validRowCount: transactions.length - reviewRequiredCount,
      reviewRowCount: reviewRequiredCount,
      totalMoneyIn,
      totalMoneyOut,
      totalWithdrawals,
      totalDeposits,
      status: reviewRequiredCount > 0 ? 'review_required' : 'processed',
      sourceFileRef: file.name,
      selectedSheet: selectedSheetName,
      sheets: parsedFile?.sheets.map((s) => ({ name: s.sheetName, rowCount: s.rowCount })),
    };

    return { statement: statementObj, transactions };
  };

  const handleProceedToSummary = () => {
    const data = computeNormalizedData();
    if (data) {
      setPendingStatement(data.statement);
      setPendingTransactions(data.transactions);
      setStep('summary');
    }
  };

  const handleConfirmImport = () => {
    setStep('processing');
  };

  const handleProcessingComplete = () => {
    if (pendingStatement && pendingTransactions.length >= 0) {
      onImportCompleted(pendingStatement, pendingTransactions);
      setStep('result');
    }
  };

  // Step indicator wizard navigation
  const wizardSteps = [
    { id: 'dropzone', label: '1. File Upload' },
    { id: 'sheet_select', label: '2. Select Sheet' },
    { id: 'mapping', label: '3. Column Mapping' },
    { id: 'preview', label: '4. Preview' },
    { id: 'summary', label: '5. Confirm' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      {/* Duplicate warning modal overlay */}
      {duplicateWarning && (
        <DuplicateWarningModal
          existingStatement={duplicateWarning}
          onClose={() => setDuplicateWarning(null)}
          onImportAnyway={() => setDuplicateWarning(null)}
          onReviewExisting={() => {
            setDuplicateWarning(null);
            onClose();
            onViewTransactions();
          }}
        />
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
        {/* Wizard Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">Upload Bank Statement</h2>
              <p className="text-[11px] text-slate-400">
                Import transaction data for financial investigation and money-flow analysis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Progress Steps Bar */}
        {step !== 'processing' && step !== 'result' && (
          <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center space-x-2 text-xs font-mono overflow-x-auto">
            {wizardSteps.map((s, idx) => {
              const isCurrent = step === s.id;
              const isCompleted =
                (s.id === 'dropzone' && parsedFile) ||
                (s.id === 'sheet_select' && (step === 'mapping' || step === 'preview' || step === 'summary')) ||
                (s.id === 'mapping' && (step === 'preview' || step === 'summary')) ||
                (s.id === 'preview' && step === 'summary');

              return (
                <React.Fragment key={s.id}>
                  <button
                    disabled={!parsedFile && s.id !== 'dropzone'}
                    onClick={() => setStep(s.id as any)}
                    className={`flex items-center space-x-1 whitespace-nowrap px-2.5 py-1 rounded-md transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white font-semibold'
                        : isCompleted
                        ? 'text-emerald-400 hover:bg-slate-900'
                        : 'text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{s.label}</span>
                  </button>
                  {idx < wizardSteps.length - 1 && <span className="text-slate-700">/</span>}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Wizard Body Content */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 space-y-5">
          {step === 'dropzone' && (
            <UploadDropzone
              onFileSelected={handleFileSelected}
              selectedFile={file}
              onRemoveFile={handleRemoveFile}
              error={parseError}
            />
          )}

          {step === 'sheet_select' && parsedFile && (
            <SheetSelector
              sheets={parsedFile.sheets}
              selectedSheetName={selectedSheetName}
              onSelectSheet={handleSheetSelected}
              onContinue={() => setStep('mapping')}
            />
          )}

          {step === 'mapping' && currentSheet && (
            <ColumnMapping
              headers={currentSheet.headers}
              mapping={mapping}
              onChangeMapping={handleChangeMapping}
              onAutoMap={handleAutoMap}
            />
          )}

          {step === 'preview' && currentSheet && (
            <StatementPreview
              sheetName={selectedSheetName}
              headers={currentSheet.headers}
              rows={currentSheet.rows}
              mapping={mapping}
            />
          )}

          {step === 'summary' && pendingStatement && (
            <ImportSummary
              fileName={pendingStatement.fileName}
              selectedSheetName={selectedSheetName}
              totalRows={pendingStatement.rowCount}
              validRowsCount={pendingStatement.validRowCount}
              reviewRowsCount={pendingStatement.reviewRowCount}
              estimatedCredits={pendingStatement.totalMoneyIn}
              estimatedDebits={pendingStatement.totalMoneyOut}
              dateRangeStr={
                pendingStatement.periodStart && pendingStatement.periodEnd
                  ? `${pendingStatement.periodStart} – ${pendingStatement.periodEnd}`
                  : 'Full Range'
              }
              onConfirmImport={handleConfirmImport}
              onBackToMapping={() => setStep('mapping')}
            />
          )}

          {step === 'processing' && (
            <ImportProgress onComplete={handleProcessingComplete} />
          )}

          {step === 'result' && pendingStatement && (
            <ImportResult
              importedCount={pendingStatement.rowCount}
              reviewCount={pendingStatement.reviewRowCount}
              dateRangeStr={
                pendingStatement.periodStart && pendingStatement.periodEnd
                  ? `${pendingStatement.periodStart} – ${pendingStatement.periodEnd}`
                  : 'Full Range'
              }
              moneyIn={pendingStatement.totalMoneyIn}
              moneyOut={pendingStatement.totalMoneyOut}
              withdrawals={pendingStatement.totalWithdrawals}
              onViewTransactions={() => {
                onClose();
                onViewTransactions();
              }}
              onViewDashboard={() => {
                onClose();
                onViewDashboard();
              }}
              onImportAnother={handleRemoveFile}
            />
          )}
        </div>

        {/* Wizard Footer Navigation Controls */}
        {step !== 'processing' && step !== 'result' && step !== 'summary' && (
          <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
            <div>
              {file && (
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors"
                >
                  Reset / Clear File
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {step === 'mapping' && parsedFile && parsedFile.sheets.length > 1 && (
                <button
                  onClick={() => setStep('sheet_select')}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg border border-slate-800"
                >
                  Back to Sheets
                </button>
              )}

              {step === 'mapping' && (
                <button
                  onClick={() => setStep('preview')}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 font-medium"
                >
                  Preview Statement
                </button>
              )}

              {step === 'preview' && (
                <button
                  onClick={() => setStep('mapping')}
                  className="text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg border border-slate-800"
                >
                  Back to Mapping
                </button>
              )}

              {(step === 'mapping' || step === 'preview') && (
                <button
                  onClick={handleProceedToSummary}
                  className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors shadow-md"
                >
                  <span>Continue to Import</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
