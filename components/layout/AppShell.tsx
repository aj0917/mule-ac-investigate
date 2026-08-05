'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopHeader } from './TopHeader';
import { DashboardHero } from '../dashboard/DashboardHero';
import { MetricCards } from '../dashboard/MetricCards';
import { FinancialActivityChart } from '../dashboard/FinancialActivityChart';
import { TransactionSummary } from '../dashboard/TransactionSummary';
import { TransactionChannelChart } from '../dashboard/TransactionChannelChart';
import { RecentStatements } from '../dashboard/RecentStatements';
import { EmptyState } from '../dashboard/EmptyState';
import { UploadWizard } from '../upload/UploadWizard';
import { TransactionTableModal } from '../transactions/TransactionTableModal';
import { TransactionsView } from '../transactions/TransactionsView';
import { AccountIntelligenceView } from '../accounts/AccountIntelligenceView';
import { CrossStatementWorkspace } from '../investigations/CrossStatementWorkspace';
import { MoneyFlowWorkspace } from '../money-flow/MoneyFlowWorkspace';
import { PatternsWorkspace } from '../patterns/PatternsWorkspace';
import { InvestigationsWorkspace } from '../cases/InvestigationsWorkspace';
import { TimelineWorkspace } from '../timeline/TimelineWorkspace';
import { EvidenceCenterWorkspace } from '../evidence/EvidenceCenterWorkspace';
import { ReportsWorkspace } from '../reports/ReportsWorkspace';
import { runPatternAnalysis } from '@/lib/patternEngine';
import { getStoredCases, addEvidenceToCase } from '@/lib/caseStorage';

import {
  BankStatement,
  Transaction,
  DashboardMetrics,
} from '@/types/investigation';
import {
  getStoredStatements,
  saveStatementsToStorage,
  getStoredTransactions,
  saveTransactionsToStorage,
  calculateDashboardMetrics,
  createSyntheticDemoFixture,
} from '@/lib/storage';

export const AppShell: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isTxnTableOpen, setIsTxnTableOpen] = useState<boolean>(false);
  const [selectedTxnStatementId, setSelectedTxnStatementId] = useState<string | undefined>(undefined);

  // Selected Account ID for Account Intelligence tab
  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(undefined);

  // Universal Search Query for Investigations tab
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Core Investigation Data State - initialize to [] for SSR parity
  const [mounted, setMounted] = useState<boolean>(false);
  const [statements, setStatements] = useState<BankStatement[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatements(getStoredStatements());
      setTransactions(getStoredTransactions());
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const hasData = statements.length > 0 && transactions.length > 0;
  const metrics: DashboardMetrics = calculateDashboardMetrics(statements, transactions);

  // Listen to custom header search event
  useEffect(() => {
    const handleHeaderSearch = (e: any) => {
      if (e.detail) {
        setSearchQuery(e.detail);
        setCurrentTab('investigations');
      }
    };
    window.addEventListener('OPEN_UNIVERSAL_SEARCH', handleHeaderSearch);
    return () => window.removeEventListener('OPEN_UNIVERSAL_SEARCH', handleHeaderSearch);
  }, []);

  const handleImportCompleted = (newStatement: BankStatement, newTxns: Transaction[]) => {
    const updatedStmts = [newStatement, ...statements.filter((s) => s.id !== newStatement.id)];
    const updatedTxns = [...newTxns, ...transactions];

    setStatements(updatedStmts);
    setTransactions(updatedTxns);

    saveStatementsToStorage(updatedStmts);
    saveTransactionsToStorage(updatedTxns);
  };

  const handleDeleteStatement = (statementId: string) => {
    const updatedStmts = statements.filter((s) => s.id !== statementId);
    const updatedTxns = transactions.filter((t) => t.statementId !== statementId);

    setStatements(updatedStmts);
    setTransactions(updatedTxns);

    saveStatementsToStorage(updatedStmts);
    saveTransactionsToStorage(updatedTxns);
  };

  const handleLoadDemoFixture = () => {
    const { statement, transactions: demoTxns } = createSyntheticDemoFixture();
    const updatedStmts = [statement, ...statements.filter((s) => s.id !== statement.id)];
    const updatedTxns = [...demoTxns, ...transactions];

    setStatements(updatedStmts);
    setTransactions(updatedTxns);

    saveStatementsToStorage(updatedStmts);
    saveTransactionsToStorage(updatedTxns);
  };

  const handleClearData = () => {
    if (confirm('Are you sure you want to reset all imported statements and transactions in this investigation?')) {
      setStatements([]);
      setTransactions([]);
      saveStatementsToStorage([]);
      saveTransactionsToStorage([]);
    }
  };

  const handleOpenAccountIntelligence = (accId: string) => {
    setSelectedAccountId(accId);
    setCurrentTab('accounts');
  };

  const handleOpenMoneyFlow = (accId: string) => {
    setSelectedAccountId(accId);
    setSearchQuery(accId);
    setCurrentTab('money-flow');
  };

  const handleOpenTxnsModal = (stmtId?: string) => {
    setSelectedTxnStatementId(stmtId);
    setCurrentTab('transactions');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased">
      {/* Persistent Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content Outer Frame */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          sidebarCollapsed ? 'pl-16' : 'pl-0 md:pl-64'
        }`}
      >
        {/* Persistent Top Header */}
        <TopHeader
          currentTab={currentTab}
          hasData={hasData}
          activeCaseName={statements[0] ? `INV-${statements[0].id.substring(5, 12)}` : 'INV-2026-SATARA'}
          onOpenUpload={() => setIsUploadOpen(true)}
          onLoadDemoFixture={!hasData ? handleLoadDemoFixture : undefined}
        />

        {/* Main Workspace Area */}
        <main className="flex-1 p-4 lg:p-6 space-y-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && (
            <>
              {/* Dashboard Hero Header */}
              <DashboardHero
                hasData={hasData}
                statementsCount={statements.length}
                onOpenUpload={() => setIsUploadOpen(true)}
                onLoadDemoFixture={handleLoadDemoFixture}
                onClearData={handleClearData}
                onOpenTransactions={() => handleOpenTxnsModal()}
              />

              {!hasData ? (
                /* Empty state when no statements exist */
                <EmptyState
                  onOpenUpload={() => setIsUploadOpen(true)}
                  onLoadDemoFixture={handleLoadDemoFixture}
                />
              ) : (
                /* Filled Dashboard Layout */
                <div className="space-y-6">
                  {/* Summary Metric Cards with Click to Navigate */}
                  <div
                    onClick={() => setCurrentTab('transactions')}
                    className="cursor-pointer"
                    title="Click to open Transactions Intelligence Workspace"
                  >
                    <MetricCards metrics={metrics} hasData={hasData} />
                  </div>

                  {/* Financial Activity Timeline Chart */}
                  <FinancialActivityChart transactions={transactions} hasData={hasData} />

                  {/* Transaction Activity Summary & Channel Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TransactionSummary metrics={metrics} hasData={hasData} />
                    <TransactionChannelChart transactions={transactions} hasData={hasData} />
                  </div>

                  {/* Recent Statements Table */}
                  <RecentStatements
                    statements={statements}
                    onOpenTransactions={(stmtId) => handleOpenTxnsModal(stmtId)}
                    onDeleteStatement={handleDeleteStatement}
                    onOpenUpload={() => setIsUploadOpen(true)}
                  />
                </div>
              )}
            </>
          )}

          {currentTab === 'statements' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 p-5 rounded-xl border border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">Bank Statements Directory</h2>
                  <p className="text-xs text-slate-400">
                    Manage imported CSV, XLSX, and XLS statement files for cyber money flow investigation.
                  </p>
                </div>
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-lg text-xs transition-colors shadow-md"
                >
                  + Upload Statement
                </button>
              </div>

              <RecentStatements
                statements={statements}
                onOpenTransactions={(stmtId) => handleOpenTxnsModal(stmtId)}
                onDeleteStatement={handleDeleteStatement}
                onOpenUpload={() => setIsUploadOpen(true)}
              />
            </div>
          )}

          {currentTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              statements={statements}
              onSelectAccount={(accId) => handleOpenAccountIntelligence(accId)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentTab === 'accounts' && (
            <AccountIntelligenceView
              initialAccountId={selectedAccountId}
              transactions={transactions}
              statements={statements}
              onOpenMoneyFlow={(accId) => handleOpenMoneyFlow(accId)}
            />
          )}

          {currentTab === 'investigations' && (
            <CrossStatementWorkspace
              initialQuery={searchQuery}
              transactions={transactions}
              statements={statements}
              cases={getStoredCases()}
              onOpenAccountIntelligence={(accId) => handleOpenAccountIntelligence(accId)}
            />
          )}

          {currentTab === 'money-flow' && (
            <MoneyFlowWorkspace
              initialRootQuery={searchQuery || selectedAccountId || ''}
              transactions={transactions}
              statements={statements}
              onOpenAccountIntelligence={(accId) => handleOpenAccountIntelligence(accId)}
              onOpenUpload={() => setIsUploadOpen(true)}
            />
          )}

          {currentTab === 'patterns' && (
            <PatternsWorkspace
              transactions={transactions}
              statements={statements}
              onOpenAccount={(accId) => handleOpenAccountIntelligence(accId)}
              onShowOnGraph={(accId) => handleOpenMoneyFlow(accId)}
            />
          )}

          {currentTab === 'timeline' && (
            <TimelineWorkspace
              statements={statements}
              transactions={transactions}
              indicators={runPatternAnalysis(transactions, statements)}
              cases={getStoredCases()}
              selectedAccount={selectedAccountId}
              onSelectTransaction={(txnId) => {
                setSelectedTxnStatementId(undefined);
                setCurrentTab('transactions');
              }}
              onOpenAccountIntelligence={(accId) => handleOpenAccountIntelligence(accId)}
              onOpenPatternEngine={() => setCurrentTab('patterns')}
              onAddEvidenceToCase={(caseId, event) => {
                addEvidenceToCase(caseId, {
                  type: 'TRANSACTION',
                  title: event.title,
                  source: event.sourceLabel,
                  details: event.description,
                  relatedAccounts: event.accountId ? [event.accountId] : [],
                  relatedTransactionId: event.relatedTransactionId,
                });
                alert(`Added timeline event "${event.title}" as official evidence to Case.`);
              }}
            />
          )}

          {currentTab === 'cases' && (
            <InvestigationsWorkspace
              transactions={transactions}
              statements={statements}
              onOpenAccountIntelligence={(accId) => handleOpenAccountIntelligence(accId)}
              onOpenPatternAnalysis={() => setCurrentTab('patterns')}
            />
          )}

          {currentTab === 'evidence' && (
            <EvidenceCenterWorkspace
              onNavigateToCase={() => setCurrentTab('cases')}
              onNavigateToAccount={(accId) => handleOpenAccountIntelligence(accId)}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsWorkspace
              onNavigateToCase={() => setCurrentTab('cases')}
              onNavigateToAccount={(accId) => handleOpenAccountIntelligence(accId)}
            />
          )}
        </main>
      </div>

      {/* Upload Wizard Modal */}
      <UploadWizard
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        existingStatements={statements}
        onImportCompleted={handleImportCompleted}
        onViewTransactions={() => handleOpenTxnsModal()}
        onViewDashboard={() => setCurrentTab('dashboard')}
      />

      {/* Transactions Inspector Modal */}
      <TransactionTableModal
        isOpen={isTxnTableOpen}
        onClose={() => setIsTxnTableOpen(false)}
        transactions={transactions}
        statementFilterId={selectedTxnStatementId}
      />
    </div>
  );
};
