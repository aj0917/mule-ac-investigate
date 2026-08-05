'use client';

import React, { useState } from 'react';
import { InvestigationCase } from '@/types/case';
import { BankStatement, Transaction } from '@/types/investigation';
import { CaseList } from './CaseList';
import { CreateCaseModal } from './CreateCaseModal';
import { CaseDetailWorkspace } from './CaseDetailWorkspace';
import { getStoredCases } from '@/lib/caseStorage';

interface InvestigationsWorkspaceProps {
  transactions: Transaction[];
  statements: BankStatement[];
  onOpenAccountIntelligence: (accId: string) => void;
  onOpenPatternAnalysis?: () => void;
  initialCaseId?: string;
}

export const InvestigationsWorkspace: React.FC<InvestigationsWorkspaceProps> = ({
  transactions,
  statements,
  onOpenAccountIntelligence,
  onOpenPatternAnalysis,
  initialCaseId,
}) => {
  const [selectedCase, setSelectedCase] = useState<InvestigationCase | null>(() => {
    if (initialCaseId) {
      const allCases = getStoredCases();
      return allCases.find((c) => c.id === initialCaseId || c.caseNumber === initialCaseId) || null;
    }
    return null;
  });

  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div>
      {selectedCase ? (
        <CaseDetailWorkspace
          caseObj={selectedCase}
          allTransactions={transactions}
          allStatements={statements}
          onBack={() => setSelectedCase(null)}
          onOpenAccount={onOpenAccountIntelligence}
          onOpenPatternAnalysis={onOpenPatternAnalysis}
        />
      ) : (
        <CaseList
          onSelectCase={(c) => setSelectedCase(c)}
          onCreateNewCase={() => setShowCreateModal(true)}
        />
      )}

      {showCreateModal && (
        <CreateCaseModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCaseCreated={(newCase) => {
            setSelectedCase(newCase);
          }}
        />
      )}
    </div>
  );
};
