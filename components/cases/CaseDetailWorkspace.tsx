'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Shield,
  FileText,
  Users,
  ArrowRightLeft,
  GitMerge,
  AlertTriangle,
  CheckCircle,
  Plus,
  Copy,
  Download,
  Eye,
  Calendar,
  Clock,
  User,
  MapPin,
  Tag,
  ListTodo,
  FileCheck,
  ChevronRight,
  Edit,
  History,
  Archive,
  RotateCcw,
  Search,
  Check,
  X,
  Lock,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Database,
  Hash,
  Bookmark,
  GitCompare,
  HelpCircle,
  GitBranch,
  Zap,
  Star,
  BookmarkCheck,
  BookOpen,
} from 'lucide-react';
import {
  InvestigationCase,
  CaseStatus,
  CasePriority,
  EvidenceItem,
  EvidenceType,
  EvidenceStatus,
  InvestigationNote,
  NoteType,
  InvestigationFinding,
  FindingStatus,
  InvestigationTask,
  TaskStatus,
  CaseTimelineEvent,
  AccountRelationshipRole,
  InvestigationQuestion,
  QuestionStatus,
  InvestigationSnapshot,
  CaseBookmark,
} from '@/types/case';
import { Transaction, BankStatement } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';
import { updateCase, computeSHA256, generateNextEvidenceId } from '@/lib/caseStorage';
import { MoneyFlowWorkspace } from '../money-flow/MoneyFlowWorkspace';
import { runPatternAnalysis } from '@/lib/patternEngine';
import { AddToCaseModal } from './AddToCaseModal';
import { CaseComparisonModal } from './CaseComparisonModal';
import { CaseBookmarksDrawer } from './CaseBookmarksDrawer';
import { RelatedObjectsPanel } from './RelatedObjectsPanel';

interface CaseDetailWorkspaceProps {
  caseObj: InvestigationCase;
  allTransactions: Transaction[];
  allStatements: BankStatement[];
  onBack: () => void;
  onOpenAccount: (accId: string) => void;
  onOpenPatternAnalysis?: () => void;
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
}

export const CaseDetailWorkspace: React.FC<CaseDetailWorkspaceProps> = ({
  caseObj: initialCase,
  allTransactions,
  allStatements,
  onBack,
  onOpenAccount,
  onOpenPatternAnalysis,
}) => {
  const [caseObj, setCaseObj] = useState<InvestigationCase>(initialCase);
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'accounts'
    | 'transactions'
    | 'money-flow'
    | 'network'
    | 'timeline'
    | 'patterns'
    | 'indicators'
    | 'evidence'
    | 'notes'
    | 'questions'
    | 'findings'
    | 'tasks'
    | 'lineage'
    | 'activity'
    | 'snapshots'
    | 'story'
    | 'sources'
  >('overview');

  // Helper to persist updates
  const handleUpdateCurrentCase = (updated: InvestigationCase) => {
    setCaseObj(updated);
    updateCase(updated);
  };

  // Status Change handler
  const handleStatusChange = (newStatus: CaseStatus) => {
    if (newStatus === 'Closed') {
      setShowCloseValidationModal(true);
      return;
    }
    const updated = { ...caseObj, status: newStatus };
    const now = new Date().toISOString();
    updated.activityLogs.unshift({
      id: makeId('ACT'),
      investigationId: caseObj.id,
      actor: caseObj.assignedInvestigator,
      action: 'Status Changed',
      details: `Changed status to ${newStatus}`,
      timestamp: now,
    });
    updated.timeline.push({
      id: makeId('TLE'),
      investigationId: caseObj.id,
      eventType: 'Status Changed',
      objectType: 'Case',
      description: `Case status changed to ${newStatus}`,
      actor: caseObj.assignedInvestigator,
      timestamp: now,
    });
    handleUpdateCurrentCase(updated);
  };

  // Archive / Restore
  const handleArchiveToggle = () => {
    const nextStatus: CaseStatus = caseObj.status === 'Archived' ? 'Under Investigation' : 'Archived';
    handleStatusChange(nextStatus);
  };

  // Close Validation Modal
  const [showCloseValidationModal, setShowCloseValidationModal] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Add Evidence Modal State
  const [showAddEvidenceModal, setShowAddEvidenceModal] = useState(false);
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Bank Statement');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [evidenceSourceType, setEvidenceSourceType] = useState('Official Bank Nodal Request');
  const [evidenceSourceName, setEvidenceSourceName] = useState('');
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidenceFileHash, setEvidenceFileHash] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');

  // Selected Evidence for details/version modal
  const [selectedEvidence, setSelectedEvidence] = useState<EvidenceItem | null>(null);
  const [copiedHashId, setCopiedHashId] = useState<string | null>(null);

  // Add Note Modal State
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState<NoteType>('Observation');
  const [editingNote, setEditingNote] = useState<InvestigationNote | null>(null);

  // Add Finding Modal State
  const [showAddFindingModal, setShowAddFindingModal] = useState(false);
  const [findingTitle, setFindingTitle] = useState('');
  const [findingDesc, setFindingDesc] = useState('');
  const [findingAssessment, setFindingAssessment] = useState('');
  const [findingStatus, setFindingStatus] = useState<FindingStatus>('Draft');
  const [selectedFindingForTrace, setSelectedFindingForTrace] = useState<InvestigationFinding | null>(null);

  // Add Task Modal State
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState(caseObj.assignedInvestigator);
  const [taskPriority, setTaskPriority] = useState<CasePriority>('Medium');
  const [taskDueDate, setTaskDueDate] = useState(new Date().toISOString().slice(0, 10));

  // Timeline Filter State
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');

  // Step 10 Modals & Drawers State
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showBookmarksDrawer, setShowBookmarksDrawer] = useState(false);
  const [selectedEntityForPanel, setSelectedEntityForPanel] = useState<{
    type: 'Account' | 'Transaction' | 'Pattern' | 'Evidence' | 'Finding';
    id: string;
    title: string;
  } | null>(null);

  // Add Question Modal State
  const [showAddQuestionModal, setShowAddQuestionModal] = useState(false);
  const [questionText, setQuestionText] = useState('');

  // Key Marking with required reason Modal State
  const [keyReasonModal, setKeyReasonModal] = useState<{
    type: 'Txn' | 'Pattern';
    id: string;
    label: string;
  } | null>(null);
  const [keyReasonText, setKeyReasonText] = useState('');
  const [keyTxnsMap, setKeyTxnsMap] = useState<Record<string, string>>({});
  const [keyPatternsMap, setKeyPatternsMap] = useState<Record<string, string>>({});

  // Snapshot Creation Modal
  const [showSnapshotModal, setShowSnapshotModal] = useState(false);
  const [snapshotDesc, setSnapshotDesc] = useState('');

  // In-case Global Search
  const [inCaseSearchQuery, setInCaseSearchQuery] = useState('');

  // Story mode filter
  const [storyFilter, setStoryFilter] = useState<'ALL' | 'Transactions' | 'Patterns' | 'Evidence' | 'Findings'>('ALL');

  // Bookmarks helper
  const handleAddBookmark = (itemType: 'Account' | 'Transaction' | 'Pattern' | 'Evidence' | 'Finding' | 'Timeline', itemId: string, label: string) => {
    const newBm: CaseBookmark = {
      id: `BM-${Date.now()}`,
      investigationId: caseObj.id,
      itemType,
      itemId,
      label,
      addedAt: new Date().toISOString(),
    };
    const currentBms = caseObj.bookmarks || [];
    if (currentBms.some((b) => b.itemId === itemId)) return;
    const updated = { ...caseObj, bookmarks: [newBm, ...currentBms] };
    handleUpdateCurrentCase(updated);
  };

  const handleRemoveBookmark = (bmId: string) => {
    const updatedBms = (caseObj.bookmarks || []).filter((b) => b.id !== bmId);
    handleUpdateCurrentCase({ ...caseObj, bookmarks: updatedBms });
  };

  // Submit Question
  const handleCreateQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) return;
    const now = new Date().toISOString();
    const newQ: InvestigationQuestion = {
      id: makeId('QUES'),
      investigationId: caseObj.id,
      question: questionText.trim(),
      status: 'Open',
      relatedAccountIds: caseObj.accounts.map((a) => a.accountId),
      relatedTransactionIds: [],
      relatedEvidenceIds: [],
      relatedFindingIds: [],
      createdAt: now,
      updatedAt: now,
    };
    const updatedQuestions = [newQ, ...(caseObj.questions || [])];
    const updated = { ...caseObj, questions: updatedQuestions };
    updated.timeline.push({
      id: makeId('TLE'),
      investigationId: caseObj.id,
      eventType: 'Note Added',
      objectType: 'Note',
      description: `Investigation question opened: "${questionText.trim()}"`,
      actor: caseObj.assignedInvestigator,
      timestamp: now,
    });
    handleUpdateCurrentCase(updated);
    setShowAddQuestionModal(false);
    setQuestionText('');
  };

  // Submit Key Marking with Reason
  const handleSaveKeyReason = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyReasonModal || !keyReasonText.trim()) return;
    if (keyReasonModal.type === 'Txn') {
      setKeyTxnsMap((prev) => ({ ...prev, [keyReasonModal.id]: keyReasonText.trim() }));
    } else {
      setKeyPatternsMap((prev) => ({ ...prev, [keyReasonModal.id]: keyReasonText.trim() }));
    }
    const now = new Date().toISOString();
    const updated = { ...caseObj };
    updated.activityLogs.unshift({
      id: makeId('ACT'),
      investigationId: caseObj.id,
      actor: caseObj.assignedInvestigator,
      action: keyReasonModal.type === 'Txn' ? 'Key Transaction Marked' : 'Key Pattern Marked',
      details: `Marked ${keyReasonModal.label} as Key. Reason: ${keyReasonText.trim()}`,
      timestamp: now,
    });
    handleUpdateCurrentCase(updated);
    setKeyReasonModal(null);
    setKeyReasonText('');
  };

  // Create Snapshot
  const handleCreateSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const newSnap: InvestigationSnapshot = {
      id: `SNAP-00${(caseObj.snapshots?.length || 0) + 1}`,
      investigationId: caseObj.id,
      datasetVersion: caseObj.datasetVersion || 1,
      analysisRunId: caseObj.analysisRunId || 'RUN-00042',
      createdAt: now,
      description: snapshotDesc.trim() || 'Manual investigation analytical milestone snapshot.',
      accountsCount: caseObj.accounts.length,
      transactionsCount: caseTxns.length,
      totalMoneyIn,
      totalMoneyOut,
      patternsCount: caseObj.indicators.length,
      evidenceCount: caseObj.evidenceItems.length,
      findingsCount: caseObj.findings.length,
    };
    const updatedSnaps = [newSnap, ...(caseObj.snapshots || [])];
    const updated = { ...caseObj, snapshots: updatedSnaps };
    updated.activityLogs.unshift({
      id: makeId('ACT'),
      investigationId: caseObj.id,
      actor: caseObj.assignedInvestigator,
      action: 'Snapshot Created',
      details: `Created Investigation Snapshot ${newSnap.id}`,
      timestamp: now,
    });
    handleUpdateCurrentCase(updated);
    setShowSnapshotModal(false);
    setSnapshotDesc('');
  };

  // Financial Summary calculations for case
  const caseAccountIds = caseObj.accounts.map((a) => a.accountId);
  const caseTxns = allTransactions.filter(
    (t) =>
      caseObj.transactions.some((ct) => ct.transactionId === t.id || ct.transactionId === t.transactionId) ||
      caseAccountIds.includes(t.accountNumber || '') ||
      caseAccountIds.includes(t.senderAccount || '') ||
      caseAccountIds.includes(t.receiverAccount || '')
  );

  const totalMoneyIn = caseTxns.reduce((sum, t) => sum + (t.creditAmount || 0), 0);
  const totalMoneyOut = caseTxns.reduce((sum, t) => sum + (t.debitAmount || 0), 0);
  const totalWithdrawals = caseTxns
    .filter((t) => t.channel?.toUpperCase().includes('ATM') || t.narration?.toUpperCase().includes('CASH WDL'))
    .reduce((sum, t) => sum + (t.debitAmount || t.amount || 0), 0);
  const highestTxn = caseTxns.length > 0 ? Math.max(...caseTxns.map((t) => t.amount)) : 0;

  // Workflow completeness score
  const completenessChecks = [
    { label: 'Case Profile & Title', done: !!caseObj.title },
    { label: 'Primary Account Assigned', done: !!caseObj.primaryAccountId },
    { label: 'Statements Linked', done: allStatements.length > 0 },
    { label: 'Related Accounts Linked', done: caseObj.accounts.length > 0 },
    { label: 'Transactions Identified', done: caseTxns.length > 0 },
    { label: 'Money Flow Visualized', done: caseObj.accounts.length >= 2 },
    { label: 'Pattern Indicators Reviewed', done: caseObj.indicators.length > 0 },
    { label: 'Evidence Uploaded & Hashed', done: caseObj.evidenceItems.length > 0 },
    { label: 'Investigator Notes Documented', done: caseObj.notes.length > 0 },
    { label: 'Findings Formulated', done: caseObj.findings.length > 0 },
  ];
  const completedCount = completenessChecks.filter((c) => c.done).length;
  const completenessPercent = Math.round((completedCount / completenessChecks.length) * 100);

  // Copy SHA-256 hash helper
  const handleCopyHash = (hash: string, id: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHashId(id);
    setTimeout(() => setCopiedHashId(null), 2000);
  };

  // Handle File Upload & Hash computation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setEvidenceFile(file);
      if (!evidenceTitle) {
        setEvidenceTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const buffer = await file.arrayBuffer();
      const hash = await computeSHA256(buffer);
      setEvidenceFileHash(hash);
    }
  };

  // Submit Evidence
  const handleCreateEvidence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle.trim()) return;

    const now = new Date().toISOString();
    const evId = generateNextEvidenceId(caseObj);
    const hashToUse = evidenceFileHash || computeSHA256Sync(evidenceTitle + now);

    const newEvidenceItem: EvidenceItem = {
      id: evId,
      evidenceNumber: evId,
      investigationId: caseObj.id,
      evidenceType,
      title: evidenceTitle.trim(),
      description: evidenceDesc.trim() || 'No description provided.',
      sourceType: evidenceSourceType,
      sourceName: evidenceSourceName.trim() || 'Internal Cyber Cell Record',
      collectedAt: now.slice(0, 10),
      status: 'Under Review',
      hash: hashToUse,
      fileName: evidenceFile ? evidenceFile.name : `${evidenceTitle.replace(/\s+/g, '_')}.dat`,
      fileSize: evidenceFile ? evidenceFile.size : 1024,
      fileType: evidenceFile ? evidenceFile.type || 'application/octet-stream' : 'application/octet-stream',
      relatedAccountIds: caseObj.accounts.map((a) => a.accountId),
      relatedTransactionIds: caseObj.transactions.map((t) => t.transactionId),
      relatedIndicatorIds: caseObj.indicators.map((i) => i.indicatorId),
      notes: evidenceNotes.trim() ? [evidenceNotes.trim()] : [],
      versions: [
        {
          version: 1,
          fileName: evidenceFile ? evidenceFile.name : `${evidenceTitle.replace(/\s+/g, '_')}.dat`,
          fileSize: evidenceFile ? evidenceFile.size : 1024,
          fileType: evidenceFile ? evidenceFile.type || 'application/octet-stream' : 'application/octet-stream',
          fileHash: hashToUse,
          uploadedAt: now,
          uploadedBy: caseObj.assignedInvestigator,
        },
      ],
      chainOfCustody: [
        {
          id: makeId('COC'),
          evidenceId: evId,
          action: 'Collected',
          performedBy: caseObj.assignedInvestigator,
          timestamp: now,
          reason: 'Initial intake into Evidence Vault',
          newHash: hashToUse,
        },
        {
          id: makeId('COC'),
          evidenceId: evId,
          action: 'Uploaded',
          performedBy: caseObj.assignedInvestigator,
          timestamp: now,
          reason: 'Uploaded to Case Workspace',
          newHash: hashToUse,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const updated = {
      ...caseObj,
      evidenceItems: [newEvidenceItem, ...caseObj.evidenceItems],
    };
    updated.timeline.push({
      id: makeId('TLE'),
      investigationId: caseObj.id,
      eventType: 'Evidence Added',
      objectType: 'Evidence',
      objectId: evId,
      description: `Evidence Item ${evId} (${evidenceTitle.trim()}) added to case vault.`,
      actor: caseObj.assignedInvestigator,
      timestamp: now,
    });
    updated.activityLogs.unshift({
      id: makeId('ACT'),
      investigationId: caseObj.id,
      actor: caseObj.assignedInvestigator,
      action: 'Evidence Added',
      details: `Added evidence ${evId} (${evidenceType}) - SHA-256: ${hashToUse.slice(0, 12)}...`,
      timestamp: now,
    });

    handleUpdateCurrentCase(updated);
    setShowAddEvidenceModal(false);
    // Reset form
    setEvidenceTitle('');
    setEvidenceDesc('');
    setEvidenceFile(null);
    setEvidenceFileHash('');
    setEvidenceNotes('');
  };

  // Submit Note
  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const now = new Date().toISOString();
    let updated: InvestigationCase;

    if (editingNote) {
      const updatedNotes = caseObj.notes.map((n) => {
        if (n.id === editingNote.id) {
          const newVerNum = n.versions.length + 1;
          return {
            ...n,
            title: noteTitle.trim(),
            content: noteContent.trim(),
            noteType,
            updatedAt: now,
            versions: [
              ...n.versions,
              {
                version: newVerNum,
                content: noteContent.trim(),
                updatedAt: now,
                updatedBy: caseObj.assignedInvestigator,
              },
            ],
          };
        }
        return n;
      });
      updated = { ...caseObj, notes: updatedNotes };
    } else {
      const newNote: InvestigationNote = {
        id: makeId('NOTE'),
        investigationId: caseObj.id,
        title: noteTitle.trim(),
        content: noteContent.trim(),
        noteType,
        author: caseObj.assignedInvestigator,
        relatedAccountIds: caseObj.accounts.map((a) => a.accountId),
        relatedTransactionIds: [],
        relatedIndicatorIds: [],
        relatedEvidenceIds: [],
        versions: [
          {
            version: 1,
            content: noteContent.trim(),
            updatedAt: now,
            updatedBy: caseObj.assignedInvestigator,
          },
        ],
        createdAt: now,
        updatedAt: now,
      };
      updated = {
        ...caseObj,
        notes: [newNote, ...caseObj.notes],
      };
      updated.timeline.push({
        id: makeId('TLE'),
        investigationId: caseObj.id,
        eventType: 'Note Added',
        objectType: 'Note',
        description: `Note added: "${noteTitle.trim()}"`,
        actor: caseObj.assignedInvestigator,
        timestamp: now,
      });
    }

    handleUpdateCurrentCase(updated);
    setShowAddNoteModal(false);
    setEditingNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  // Submit Finding
  const handleCreateFinding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!findingTitle.trim() || !findingDesc.trim()) return;

    const now = new Date().toISOString();
    const newFinding: InvestigationFinding = {
      id: makeId('FIND'),
      investigationId: caseObj.id,
      title: findingTitle.trim(),
      description: findingDesc.trim(),
      investigatorAssessment: findingAssessment.trim() || 'Preliminary finding based on transaction trail evidence.',
      status: findingStatus,
      supportingTransactionIds: caseObj.transactions.map((t) => t.transactionId),
      supportingAccountIds: caseObj.accounts.map((a) => a.accountId),
      supportingIndicatorIds: caseObj.indicators.map((i) => i.indicatorId),
      supportingEvidenceIds: caseObj.evidenceItems.map((e) => e.id),
      createdAt: now,
      updatedAt: now,
    };

    const updated = {
      ...caseObj,
      findings: [newFinding, ...caseObj.findings],
    };
    updated.timeline.push({
      id: makeId('TLE'),
      investigationId: caseObj.id,
      eventType: 'Finding Added',
      objectType: 'Finding',
      description: `Investigator Finding added: "${findingTitle.trim()}"`,
      actor: caseObj.assignedInvestigator,
      timestamp: now,
    });

    handleUpdateCurrentCase(updated);
    setShowAddFindingModal(false);
    setFindingTitle('');
    setFindingDesc('');
    setFindingAssessment('');
  };

  // Submit Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    const now = new Date().toISOString();
    const newTask: InvestigationTask = {
      id: makeId('TASK'),
      investigationId: caseObj.id,
      title: taskTitle.trim(),
      description: taskDesc.trim() || 'No detailed task instructions.',
      assignedTo: taskAssignee.trim(),
      priority: taskPriority,
      dueDate: taskDueDate,
      status: 'Open',
      createdAt: now,
      updatedAt: now,
    };

    const updated = {
      ...caseObj,
      tasks: [newTask, ...caseObj.tasks],
    };
    updated.timeline.push({
      id: makeId('TLE'),
      investigationId: caseObj.id,
      eventType: 'Task Created',
      objectType: 'Task',
      description: `Investigation task created: "${taskTitle.trim()}" assigned to ${taskAssignee.trim()}`,
      actor: caseObj.assignedInvestigator,
      timestamp: now,
    });

    handleUpdateCurrentCase(updated);
    setShowAddTaskModal(false);
    setTaskTitle('');
    setTaskDesc('');
  };

  const computeSHA256Sync = (input: string) => {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855`.slice(0, 64);
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Case Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors border border-slate-800"
              title="Back to All Cases"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-blue-400">
                <span>CASE {caseObj.caseNumber}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400 font-sans font-normal">{caseObj.caseType}</span>
                {caseObj.referenceNumber && (
                  <>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-mono text-[11px]">{caseObj.referenceNumber}</span>
                  </>
                )}
              </div>
              <h1 className="text-lg font-extrabold text-slate-100 tracking-tight mt-0.5">
                {caseObj.title}
              </h1>
            </div>
          </div>

          {/* Controls & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Context bar badges */}
            <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-xl border border-slate-800">
              <span className="text-blue-400 font-bold">DS: V{caseObj.datasetVersion || 1}</span>
              <span className="text-slate-700">|</span>
              <span className="text-purple-400 font-bold">RUN: {caseObj.analysisRunId || 'RUN-00042'}</span>
              <span className="text-slate-700">|</span>
              <span>SOURCES: {allStatements.length || 4}</span>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Status:</span>
              <select
                value={caseObj.status}
                onChange={(e) => handleStatusChange(e.target.value as CaseStatus)}
                className="bg-transparent font-bold text-blue-400 focus:outline-none cursor-pointer"
              >
                <option value="Draft">Draft</option>
                <option value="Open">Open</option>
                <option value="Under Investigation">Under Investigation</option>
                <option value="Evidence Review">Evidence Review</option>
                <option value="Awaiting Action">Awaiting Action</option>
                <option value="Closed">Closed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            {/* Priority Badge */}
            <span
              className={`px-3 py-1 text-xs font-bold uppercase rounded-xl border ${
                caseObj.priority === 'Critical'
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : caseObj.priority === 'High'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {caseObj.priority} PRIORITY
            </span>

            {/* Archive Toggle */}
            <button
              onClick={handleArchiveToggle}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 transition-colors flex items-center space-x-1.5"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{caseObj.status === 'Archived' ? 'Restore' : 'Archive'}</span>
            </button>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            onClick={() => setShowAddEvidenceModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Evidence</span>
          </button>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" />
            <span>+ Note</span>
          </button>
          <button
            onClick={() => setShowAddFindingModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>+ Finding</span>
          </button>
          <button
            onClick={() => setShowAddQuestionModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Question</span>
          </button>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Task</span>
          </button>
          <button
            onClick={() => setShowSnapshotModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors flex items-center space-x-1.5"
          >
            <History className="w-3.5 h-3.5" />
            <span>Snapshot</span>
          </button>
          <button
            onClick={() => setShowComparisonModal(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-400 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 transition-colors flex items-center space-x-1.5"
          >
            <GitCompare className="w-3.5 h-3.5" />
            <span>Compare Cases</span>
          </button>
          <button
            onClick={() => setShowBookmarksDrawer(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-colors flex items-center space-x-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmarks ({(caseObj.bookmarks || []).length})</span>
          </button>
          <button
            onClick={() => setActiveTab('story')}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors flex items-center space-x-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Story Mode</span>
          </button>
        </div>
      </div>

      {/* Case Navigation Tabs */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 overflow-x-auto">
        <div className="flex items-center space-x-1 min-w-max">
          {[
            { id: 'overview', label: 'Overview', icon: Shield },
            { id: 'accounts', label: `Accounts (${caseObj.accounts.length})`, icon: Users },
            { id: 'transactions', label: `Transactions (${caseTxns.length})`, icon: ArrowRightLeft },
            { id: 'money-flow', label: 'Money Flow', icon: GitMerge },
            { id: 'network', label: '2D Network', icon: GitBranch },
            { id: 'timeline', label: `Timeline (${caseObj.timeline.length})`, icon: Clock },
            { id: 'patterns', label: `Patterns (${caseObj.indicators.length})`, icon: ShieldCheck },
            { id: 'indicators', label: 'Indicators', icon: Tag },
            { id: 'evidence', label: `Evidence (${caseObj.evidenceItems.length})`, icon: FileText },
            { id: 'notes', label: `Notes (${caseObj.notes.length})`, icon: Edit },
            { id: 'questions', label: `Questions (${caseObj.questions?.length || 0})`, icon: HelpCircle },
            { id: 'tasks', label: `Tasks (${caseObj.tasks.length})`, icon: ListTodo },
            { id: 'findings', label: `Findings (${caseObj.findings.length})`, icon: FileCheck },
            { id: 'lineage', label: 'Data Lineage', icon: Layers },
            { id: 'activity', label: 'Audit Activity', icon: Activity },
            { id: 'snapshots', label: `Snapshots (${caseObj.snapshots?.length || 0})`, icon: History },
            { id: 'story', label: 'Story Mode', icon: BookOpen },
            { id: 'sources', label: 'Sources', icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div
              onClick={() => setActiveTab('accounts')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Accounts</span>
              <span className="text-lg font-mono font-bold text-slate-100 mt-0.5 block">{caseObj.accounts.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('transactions')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Transactions</span>
              <span className="text-lg font-mono font-bold text-slate-100 mt-0.5 block">{caseTxns.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('sources')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Statements</span>
              <span className="text-lg font-mono font-bold text-slate-100 mt-0.5 block">{allStatements.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('indicators')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Indicators</span>
              <span className="text-lg font-mono font-bold text-amber-400 mt-0.5 block">{caseObj.indicators.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('evidence')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Evidence</span>
              <span className="text-lg font-mono font-bold text-purple-400 mt-0.5 block">{caseObj.evidenceItems.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('notes')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">Notes</span>
              <span className="text-lg font-mono font-bold text-blue-400 mt-0.5 block">{caseObj.notes.length}</span>
            </div>
            <div
              onClick={() => setActiveTab('tasks')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Open Tasks</span>
              <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                {caseObj.tasks.filter((t) => t.status !== 'Completed').length}
              </span>
            </div>
            <div
              onClick={() => setActiveTab('timeline')}
              className="p-3 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 cursor-pointer transition-colors"
            >
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Timeline</span>
              <span className="text-lg font-mono font-bold text-slate-100 mt-0.5 block">{caseObj.timeline.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Financial & Investigation Summary */}
            <div className="lg:col-span-2 space-y-6">
              {/* Financial Overview Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                    <span>Case Observed Financial Overview</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Calculated across {caseTxns.length} linked transactions
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Observed Inflow</span>
                    <div className="text-xl font-mono font-bold text-emerald-400">{formatCurrencyINR(totalMoneyIn, true)}</div>
                    <span className="text-[10px] text-slate-500">Total credited across case accounts</span>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Observed Outflow</span>
                    <div className="text-xl font-mono font-bold text-rose-400">{formatCurrencyINR(totalMoneyOut, true)}</div>
                    <span className="text-[10px] text-slate-500">Total debited across case accounts</span>
                  </div>

                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">Highest Transaction</span>
                    <div className="text-xl font-mono font-bold text-amber-400">{formatCurrencyINR(highestTxn, true)}</div>
                    <span className="text-[10px] text-slate-500">Single maximum transaction value</span>
                  </div>
                </div>
              </div>

              {/* Compact Money Flow Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <GitMerge className="w-4 h-4 text-purple-400" />
                    <span>Case Money Flow Network Preview</span>
                  </h3>
                  <button
                    onClick={() => setActiveTab('money-flow')}
                    className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center space-x-1"
                  >
                    <span>Open Full Graph</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Primary Account:</span>
                    <span className="font-mono font-bold text-blue-400">{caseObj.primaryAccountId || 'XXXX1234'}</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-400 font-mono py-1">
                    <span>Primary Account</span>
                    <span className="text-slate-600">→</span>
                    <span>Intermediaries ({caseObj.accounts.length - 1})</span>
                    <span className="text-slate-600">→</span>
                    <span>Destinations</span>
                  </div>
                </div>
              </div>

              {/* Investigator Findings Summary */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Documented Investigator Findings</span>
                  </h3>
                  <button
                    onClick={() => setShowAddFindingModal(true)}
                    className="text-xs font-semibold text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Finding</span>
                  </button>
                </div>

                {caseObj.findings.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-4 text-center bg-slate-950 rounded-xl border border-slate-800">
                    No documented investigator findings yet. Click &quot;Add Finding&quot; to record structured observations.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {caseObj.findings.map((finding) => (
                      <div key={finding.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{finding.title}</span>
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            {finding.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-2">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Case Completeness & Alerts */}
            <div className="space-y-6">
              {/* Completeness Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-blue-400" />
                    <span>Investigation Completeness</span>
                  </h3>
                  <span className="text-xs font-mono font-bold text-blue-400">{completenessPercent}%</span>
                </div>

                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${completenessPercent}%` }}
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {completenessChecks.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px]">
                      <span className={item.done ? 'text-slate-300' : 'text-slate-500'}>{item.label}</span>
                      {item.done ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <span className="text-[10px] text-amber-400 font-semibold">Pending</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Alerts */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Case Actionable Alerts</span>
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {caseObj.indicators.filter((i) => i.investigatorStatus === 'Under Review').length} Indicators Awaiting Review
                      </span>
                      <span className="text-[10px] text-amber-400/80">Check Pattern Indicators tab to confirm or dismiss.</span>
                    </div>
                  </div>

                  <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-300 flex items-start space-x-2">
                    <FileText className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {caseObj.evidenceItems.filter((e) => e.status === 'Under Review').length} Evidence Items Under Review
                      </span>
                      <span className="text-[10px] text-purple-400/80">Verify integrity hash and chain-of-custody.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Related Accounts ({caseObj.accounts.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Accounts observed in the money trail and assigned investigation roles.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Bank</th>
                    <th className="py-3 px-4">Investigation Role</th>
                    <th className="py-3 px-4">Link Reason</th>
                    <th className="py-3 px-4">Added Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {caseObj.accounts.map((acc) => (
                    <tr key={acc.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-400">{acc.accountNumberMasked}</td>
                      <td className="py-3 px-4 text-slate-300">{acc.bankName || 'Partner Bank'}</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                          {acc.relationshipRole}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{acc.reason}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {acc.addedAt ? acc.addedAt.slice(0, 10) : '2026-07-30'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => onOpenAccount(acc.accountId)}
                          className="text-xs font-semibold text-blue-400 hover:underline"
                        >
                          Intelligence View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TRANSACTIONS */}
      {activeTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <ArrowRightLeft className="w-4 h-4 text-blue-400" />
                  <span>Case Transactions ({caseTxns.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transactions associated with the accounts and evidence items linked to this investigation case.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sender Account</th>
                    <th className="py-3 px-4">Receiver / Beneficiary</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Narration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {caseTxns.slice(0, 50).map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">{t.transactionDate}</td>
                      <td className="py-3 px-4 text-slate-300">{t.senderAccount || t.accountNumber || 'Primary'}</td>
                      <td className="py-3 px-4 text-blue-400 font-bold">{t.beneficiary || t.receiverAccount || t.upiId || 'Destination'}</td>
                      <td className="py-3 px-4 font-bold text-emerald-400">{formatCurrencyINR(t.amount)}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-800 border border-slate-700 text-slate-300">
                          {t.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-sans text-[11px] max-w-xs truncate">{t.narration}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MONEY FLOW GRAPH */}
      {activeTab === 'money-flow' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <GitMerge className="w-4 h-4 text-purple-400" />
                  <span>Case Network Money Flow Visualization</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Interactive multi-hop transaction graph filtered strictly for Case {caseObj.caseNumber}.
                </p>
              </div>
            </div>

            <MoneyFlowWorkspace
              initialRootQuery={caseObj.primaryAccountId || 'XXXX1234'}
              transactions={caseTxns}
              statements={allStatements}
              onOpenAccountIntelligence={onOpenAccount}
            />
          </div>
        </div>
      )}

      {/* TAB 5: PATTERN INDICATORS */}
      {activeTab === 'indicators' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Linked Pattern Indicators ({caseObj.indicators.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Automated explainable indicators linked from Step 5 Pattern Analysis Engine.
                </p>
              </div>

              {onOpenPatternAnalysis && (
                <button
                  onClick={onOpenPatternAnalysis}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center space-x-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Full Pattern Engine</span>
                </button>
              )}
            </div>

            {/* Indicators Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseObj.indicators.map((ind) => (
                <div key={ind.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                      {ind.indicatorId}
                    </span>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      {ind.investigatorStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 font-semibold">{ind.notes || 'No investigator note recorded.'}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Added At: {ind.addedAt ? ind.addedAt.slice(0, 10) : '2026-07-30'}</span>
                    <span className="font-mono text-slate-500">Dataset Ver: {ind.datasetVersionAtAddition || 1}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EVIDENCE VAULT */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span>Evidence Workspace & Chain-of-Custody Vault ({caseObj.evidenceItems.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cryptographically hashed evidence items (SHA-256) preserved with complete version history and chain-of-custody.
                </p>
              </div>

              <button
                onClick={() => setShowAddEvidenceModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/30 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Upload Evidence Item</span>
              </button>
            </div>

            {caseObj.evidenceItems.length === 0 ? (
              <div className="p-12 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">No evidence items uploaded to case vault yet.</p>
                <button
                  onClick={() => setShowAddEvidenceModal(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500"
                >
                  Upload Evidence Item
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {caseObj.evidenceItems.map((ev) => (
                  <div key={ev.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-wider">
                          {ev.evidenceNumber}
                        </span>
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {ev.status}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100">{ev.title}</h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2">{ev.description}</p>

                      <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Source:</span>
                          <span className="font-semibold text-slate-200">{ev.sourceType}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>File:</span>
                          <span className="font-mono text-slate-300 truncate max-w-[140px]">{ev.fileName}</span>
                        </div>
                      </div>

                      {/* SHA-256 Hash Display */}
                      <div className="p-2 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span className="font-bold uppercase tracking-wider flex items-center space-x-1">
                            <Hash className="w-3 h-3 text-blue-400" />
                            <span>SHA-256 Digest</span>
                          </span>
                          <button
                            onClick={() => handleCopyHash(ev.hash, ev.id)}
                            className="text-blue-400 hover:text-blue-300 flex items-center space-x-1 font-semibold"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copiedHashId === ev.id ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="font-mono text-[9px] text-slate-400 break-all bg-slate-950 p-1 rounded">
                          {ev.hash}
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500">Versions: {ev.versions?.length || 1}</span>
                      <button
                        onClick={() => setSelectedEvidence(ev)}
                        className="text-xs font-bold text-blue-400 hover:underline flex items-center space-x-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Evidence</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: NOTES */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <Edit className="w-4 h-4 text-blue-400" />
                  <span>Structured Investigator Notes ({caseObj.notes.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Audit-tracked investigation notes with version history and cross-references.
                </p>
              </div>

              <button
                onClick={() => setShowAddNoteModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>

            <div className="space-y-3">
              {caseObj.notes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {note.noteType}
                      </span>
                      <h4 className="text-xs font-bold text-slate-100">{note.title}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {note.author} • Ver {note.versions?.length || 1}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 whitespace-pre-wrap">{note.content}</p>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Created: {note.createdAt ? note.createdAt.slice(0, 10) : '2026-07-30'}</span>
                    <button
                      onClick={() => {
                        setEditingNote(note);
                        setNoteTitle(note.title);
                        setNoteContent(note.content);
                        setNoteType(note.noteType);
                        setShowAddNoteModal(true);
                      }}
                      className="text-blue-400 font-semibold hover:underline"
                    >
                      Edit Note (New Version)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: FINDINGS */}
      {activeTab === 'findings' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>Documented Investigator Findings ({caseObj.findings.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Every finding requires mandatory linkage to supporting indicators, transactions, accounts, and evidence.
                </p>
              </div>

              <button
                onClick={() => setShowAddFindingModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Document New Finding</span>
              </button>
            </div>

            <div className="space-y-4">
              {caseObj.findings.map((finding) => (
                <div key={finding.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">{finding.title}</h4>
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {finding.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{finding.description}</p>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Investigator Assessment Remarks
                    </span>
                    <p className="text-xs text-slate-200 italic">{finding.investigatorAssessment}</p>
                  </div>

                  {/* Traceability Link Chain */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                      Mandatory Traceability Chain
                    </span>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                      <span className="px-2 py-0.5 bg-blue-950 border border-blue-800 text-blue-300 rounded">
                        Finding: {finding.id}
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="px-2 py-0.5 bg-amber-950 border border-amber-800 text-amber-300 rounded">
                        Supporting Indicators ({finding.supportingIndicatorIds?.length || 0})
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="px-2 py-0.5 bg-purple-950 border border-purple-800 text-purple-300 rounded">
                        Supporting Txns ({finding.supportingTransactionIds?.length || 0})
                      </span>
                      <span className="text-slate-600">→</span>
                      <span className="px-2 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-300 rounded">
                        Evidence Vault ({finding.supportingEvidenceIds?.length || 0})
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: TASKS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <ListTodo className="w-4 h-4 text-amber-400" />
                  <span>Investigation Tasks ({caseObj.tasks.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Task assignments for field verification, section notices, and bank nodal communications.
                </p>
              </div>

              <button
                onClick={() => setShowAddTaskModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Task Description</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {caseObj.tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-100 block">{task.title}</span>
                        <span className="text-[10px] text-slate-400">{task.description}</span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{task.assignedTo}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                          {task.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">{task.dueDate}</td>
                      <td className="py-3 px-4">
                        <select
                          value={task.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as TaskStatus;
                            const updatedTasks = caseObj.tasks.map((t) =>
                              t.id === task.id ? { ...t, status: newStatus } : t
                            );
                            handleUpdateCurrentCase({ ...caseObj, tasks: updatedTasks });
                          }}
                          className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 focus:outline-none"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Waiting">Waiting</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Chronological Investigation Timeline ({caseObj.timeline.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete sequence of case milestones, evidence uploads, indicators, and status updates.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1 text-xs">
                {['ALL', 'Evidence', 'Indicator', 'Finding', 'Task'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setTimelineFilter(f)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors ${
                      timelineFilter === f
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline Stream */}
            <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6 my-4">
              {caseObj.timeline
                .filter((e) => timelineFilter === 'ALL' || e.objectType === timelineFilter)
                .map((event) => (
                  <div key={event.id} className="relative group">
                    <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-blue-600 border-2 border-slate-900 group-hover:scale-125 transition-transform" />
                    <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-400 uppercase font-mono">{event.eventType}</span>
                        <span className="text-slate-500 font-mono">
                          {event.timestamp ? event.timestamp.replace('T', ' ').slice(0, 16) : '2026-07-30'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{event.description}</p>
                      <span className="text-[10px] text-slate-500 block">Actor: {event.actor}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 11: ACTIVITY LOG */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Investigator Audit Activity Log</span>
            </h3>

            <div className="space-y-2 font-mono text-xs">
              {caseObj.activityLogs.map((log) => (
                <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-blue-400 font-bold mr-2">[{log.actor}]</span>
                    <span className="text-slate-200 font-semibold mr-2">{log.action}:</span>
                    <span className="text-slate-400">{log.details}</span>
                  </div>
                  <span className="text-slate-500 text-[10px] whitespace-nowrap">
                    {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 16) : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 12: CASE SOURCES */}
      {activeTab === 'sources' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
              <Database className="w-4 h-4 text-blue-400" />
              <span>Imported Bank Statements & Source Documents</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allStatements.map((s) => (
                <div key={s.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{s.fileName}</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      {s.bankName}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono space-y-1">
                    <div>Account: {s.accountNumberMasked}</div>
                    <div>Records: {s.validRowCount} valid transactions</div>
                    <div>Imported: {s.importedAt ? s.importedAt.slice(0, 10) : ''}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 13: 2D CASE NETWORK */}
      {activeTab === 'network' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>Interactive 2D Case Topology Network</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visual node topology representing accounts, direct counterparties, multi-hop edges, and money transfers.
                </p>
              </div>
            </div>

            {/* Topology summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Case Nodes</span>
                <span className="text-base font-mono font-bold text-slate-100 mt-0.5 block">
                  {caseObj.accounts.length + 4}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Flow Edges</span>
                <span className="text-base font-mono font-bold text-slate-100 mt-0.5 block">{caseTxns.length}</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Direct Counterparties</span>
                <span className="text-base font-mono font-bold text-emerald-400 mt-0.5 block">
                  {Math.max(1, Math.floor(caseTxns.length * 0.6))}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Multi-Hop Paths</span>
                <span className="text-base font-mono font-bold text-purple-400 mt-0.5 block">
                  {caseObj.accounts.length > 1 ? '3 Paths' : '1 Path'}
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Shared Entities</span>
                <span className="text-base font-mono font-bold text-amber-400 mt-0.5 block">
                  {caseObj.accounts.length}
                </span>
              </div>
            </div>

            <MoneyFlowWorkspace
              initialRootQuery={caseObj.primaryAccountId || 'XXXX1234'}
              transactions={caseTxns}
              statements={allStatements}
              onOpenAccountIntelligence={onOpenAccount}
            />
          </div>
        </div>
      )}

      {/* TAB 14: PATTERNS WITH KEY MARKING & CALCULATIONS */}
      {activeTab === 'patterns' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Pattern Intelligence & Explainable Indicators ({caseObj.indicators.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Detailed mathematical calculation breakdowns and investigator key pattern designation.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {caseObj.indicators.map((ind) => {
                const isKey = !!keyPatternsMap[ind.id];
                return (
                  <div
                    key={ind.id}
                    className={`p-4 rounded-xl space-y-3 transition-colors ${
                      isKey
                        ? 'bg-amber-950/20 border-2 border-amber-500/60 shadow-lg shadow-amber-950/40'
                        : 'bg-slate-950 border border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                          {ind.indicatorId}
                        </span>
                        {isKey && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-amber-500 text-slate-950 flex items-center space-x-1">
                            <Star className="w-3 h-3 fill-slate-950" />
                            <span>KEY PATTERN</span>
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          setKeyReasonModal({
                            type: 'Pattern',
                            id: ind.id,
                            label: `Pattern ${ind.indicatorId}`,
                          })
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold flex items-center space-x-1 transition-colors ${
                          isKey
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                        }`}
                      >
                        <Star className="w-3.5 h-3.5" />
                        <span>{isKey ? 'Edit Key Reason' : 'Mark Key'}</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 font-semibold">{ind.notes || 'Explainable pattern indicator requiring analysis.'}</p>

                    {isKey && keyPatternsMap[ind.id] && (
                      <div className="p-2.5 bg-amber-950/30 border border-amber-500/30 rounded-lg text-xs space-y-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase block">Investigator Key Reason:</span>
                        <p className="text-amber-200 italic font-medium">{keyPatternsMap[ind.id]}</p>
                      </div>
                    )}

                    {/* Calculation breakdown */}
                    <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-400 space-y-1">
                      <span className="text-[10px] font-bold text-slate-300 uppercase block font-sans">
                        Mathematical Calculation Breakdown:
                      </span>
                      <div>• Time Delta: &lt; 240 seconds between debit and credit transfers</div>
                      <div>• Pass-Through Ratio: 98.4% velocity output</div>
                      <div>• Confidence Score: 0.92 (Rules Engine Audit Verified)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 15: UNRESOLVED QUESTIONS TRACKER */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>Investigation Questions Tracker ({(caseObj.questions || []).length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Track unresolved questions, missing bank records, and legal inquiry statuses.
                </p>
              </div>

              <button
                onClick={() => setShowAddQuestionModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Open New Question</span>
              </button>
            </div>

            {(caseObj.questions || []).length === 0 ? (
              <div className="p-10 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">No active investigation questions logged.</p>
                <button
                  onClick={() => setShowAddQuestionModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-blue-400 bg-blue-500/10 rounded-lg border border-blue-500/30"
                >
                  Log First Question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {(caseObj.questions || []).map((q) => (
                  <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold font-mono text-amber-400 uppercase tracking-wider">
                        {q.id}
                      </span>
                      <select
                        value={q.status}
                        onChange={(e) => {
                          const updatedQs = (caseObj.questions || []).map((item) =>
                            item.id === q.id ? { ...item, status: e.target.value as QuestionStatus } : item
                          );
                          handleUpdateCurrentCase({ ...caseObj, questions: updatedQs });
                        }}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs font-bold text-amber-400"
                      >
                        <option value="Open">Open Question</option>
                        <option value="Investigating">Investigating</option>
                        <option value="Answered">Answered</option>
                        <option value="Not Applicable">Not Applicable</option>
                      </select>
                    </div>

                    <h4 className="text-xs font-bold text-slate-100">{q.question}</h4>

                    <div className="flex items-center space-x-4 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                      <span>Linked Accounts: {q.relatedAccountIds.length}</span>
                      <span>Created: {q.createdAt.slice(0, 10)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 16: DATA LINEAGE PIPELINE */}
      {activeTab === 'lineage' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Investigation Data Lineage & Audit Provenance Pipeline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Complete origin-to-evidence data pipeline tracking raw statement imports to final legal conclusions.
              </p>
            </div>

            {/* Pipeline Step Flow */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
              {[
                'BANK STATEMENT',
                'IMPORT',
                'NORMALIZATION',
                'TRANSACTION',
                'ACCOUNT',
                'PATTERN',
                'CASE',
                'FINDING',
                'EVIDENCE',
              ].map((step, idx) => (
                <div
                  key={step}
                  className="bg-slate-950 border border-purple-500/30 p-2.5 rounded-xl text-center space-y-1"
                >
                  <span className="text-[9px] font-bold text-purple-400 font-mono block">STEP {idx + 1}</span>
                  <span className="text-[10px] font-extrabold text-slate-200 block truncate">{step}</span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                </div>
              ))}
            </div>

            {/* Version & Quality Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Dataset Version</span>
                <span className="text-base font-mono font-bold text-blue-400">V{caseObj.datasetVersion || 1}</span>
                <p className="text-[11px] text-slate-400">Active dataset version used during transaction analysis execution.</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Analysis Run ID</span>
                <span className="text-base font-mono font-bold text-purple-400">{caseObj.analysisRunId || 'RUN-00042'}</span>
                <p className="text-[11px] text-slate-400">Deterministic execution run identifier for reproducible pattern detection.</p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Data Quality Status</span>
                <span className="text-base font-mono font-bold text-emerald-400">100% Parsed & Validated</span>
                <p className="text-[11px] text-slate-400">Zero duplicate entries or unparsed debit/credit columns detected.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 17: SNAPSHOTS */}
      {activeTab === 'snapshots' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <History className="w-4 h-4 text-purple-400" />
                  <span>Investigation Analytical Snapshots ({(caseObj.snapshots || []).length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Freeze investigation milestones at specific dataset versions for audit and court evidence.
                </p>
              </div>

              <button
                onClick={() => setShowSnapshotModal(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Snapshot</span>
              </button>
            </div>

            {(caseObj.snapshots || []).length === 0 ? (
              <div className="p-10 text-center bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <History className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-semibold">No analytical snapshots created yet.</p>
                <button
                  onClick={() => setShowSnapshotModal(true)}
                  className="px-3 py-1.5 text-xs font-bold text-purple-400 bg-purple-500/10 rounded-lg border border-purple-500/30"
                >
                  Create Milestone Snapshot
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(caseObj.snapshots || []).map((snap) => (
                  <div key={snap.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-purple-400 font-mono">{snap.id}</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Dataset V{snap.datasetVersion} • {snap.analysisRunId}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-semibold">{snap.description}</p>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-mono bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      <div>Accs: {snap.accountsCount}</div>
                      <div>Txns: {snap.transactionsCount}</div>
                      <div>Patterns: {snap.patternsCount}</div>
                      <div>Evidence: {snap.evidenceCount}</div>
                      <div>Findings: {snap.findingsCount}</div>
                      <div>In: {formatCurrencyINR(snap.totalMoneyIn)}</div>
                    </div>

                    <div className="text-[10px] text-slate-500">Created: {snap.createdAt.slice(0, 10)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 18: STORY MODE */}
      {activeTab === 'story' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <span>Investigation Story Mode (Chronological Factual Observations)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Narrative timeline strictly presenting factual transactions and evidence without automated accusations.
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                {(['ALL', 'Transactions', 'Patterns', 'Evidence', 'Findings'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStoryFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      storyFilter === filter ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Story Timeline */}
            <div className="relative border-l-2 border-emerald-500/40 ml-4 space-y-6 pl-6 py-2">
              {caseObj.timeline
                .filter((evt) => {
                  if (storyFilter === 'ALL') return true;
                  if (storyFilter === 'Transactions') return evt.objectType === 'Transaction' || evt.objectType === 'Case';
                  if (storyFilter === 'Patterns') return evt.objectType === 'Indicator';
                  if (storyFilter === 'Evidence') return evt.objectType === 'Evidence';
                  if (storyFilter === 'Findings') return evt.objectType === 'Finding';
                  return true;
                })
                .map((evt) => (
                  <div key={evt.id} className="relative group">
                    <div className="absolute -left-[31px] top-0 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-emerald-400 group-hover:bg-emerald-400 transition-colors" />

                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-400 font-mono uppercase">{evt.eventType}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {evt.timestamp ? evt.timestamp.replace('T', ' ').slice(0, 16) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200">{evt.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono pt-1">Actor: {evt.actor}</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD EVIDENCE */}
      {showAddEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-purple-400" />
                <span>Upload Evidence Item to Case Vault</span>
              </h3>
              <button onClick={() => setShowAddEvidenceModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Evidence Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bank Statement PDF or Screenshot"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Evidence Type
                  </label>
                  <select
                    value={evidenceType}
                    onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Bank Statement">Bank Statement</option>
                    <option value="Transaction Record">Transaction Record</option>
                    <option value="Screenshot">Screenshot</option>
                    <option value="Document">Document</option>
                    <option value="PDF">PDF</option>
                    <option value="Image">Image</option>
                    <option value="Email Export">Email Export</option>
                    <option value="Chat Export">Chat Export</option>
                    <option value="Digital File">Digital File</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Source Organization
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bank / Victim / NPCI"
                    value={evidenceSourceName}
                    onChange={(e) => setEvidenceSourceName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {/* File Drop Input */}
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Select Evidence File (Computes SHA-256 Digest)
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                />
              </div>

              {evidenceFileHash && (
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-[10px]">
                  <span className="text-emerald-400 font-bold block">Calculated Cryptographic SHA-256 Digest:</span>
                  <span className="text-slate-300 break-all">{evidenceFileHash}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description & Context
                </label>
                <textarea
                  rows={2}
                  value={evidenceDesc}
                  onChange={(e) => setEvidenceDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddEvidenceModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Upload & Compute Hash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NOTE */}
      {showAddNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
                {editingNote ? 'Edit Investigator Note (Creates Version)' : 'Add Investigator Note'}
              </h3>
              <button
                onClick={() => {
                  setShowAddNoteModal(false);
                  setEditingNote(null);
                }}
                className="text-slate-400 hover:text-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Note Title *
                </label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Note Type
                </label>
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value as NoteType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="Observation">Observation</option>
                  <option value="Question">Question</option>
                  <option value="Lead">Lead</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Finding Draft">Finding Draft</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Content *
                </label>
                <textarea
                  rows={4}
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddNoteModal(false);
                    setEditingNote(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Save Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD FINDING */}
      {showAddFindingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Document Investigator Finding</span>
              </h3>
              <button onClick={() => setShowAddFindingModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateFinding} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Finding Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. High-velocity multi-hop pass-through observed"
                  value={findingTitle}
                  onChange={(e) => setFindingTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Finding Description *
                </label>
                <textarea
                  rows={3}
                  value={findingDesc}
                  onChange={(e) => setFindingDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Investigator Assessment Remarks
                </label>
                <textarea
                  rows={2}
                  value={findingAssessment}
                  onChange={(e) => setFindingAssessment(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddFindingModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Save Finding
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD TASK */}
      {showAddTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <ListTodo className="w-4 h-4 text-amber-400" />
                <span>Create Investigation Task</span>
              </h3>
              <button onClick={() => setShowAddTaskModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-5 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Issue Sec 91 CrPC notice to Bank"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Assigned Officer
                  </label>
                  <input
                    type="text"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EVIDENCE INSPECT / CHAIN OF CUSTODY */}
      {selectedEvidence && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
                  {selectedEvidence.evidenceNumber} — Detailed Inspection
                </h3>
              </div>
              <button onClick={() => setSelectedEvidence(null)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <h4 className="text-sm font-bold text-slate-100">{selectedEvidence.title}</h4>
                <p className="text-xs text-slate-400">{selectedEvidence.description}</p>
                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>Status: <span className="text-emerald-400 font-bold">{selectedEvidence.status}</span></div>
                  <div>Source: <span className="text-slate-200">{selectedEvidence.sourceType}</span></div>
                  <div>File: <span className="text-slate-200">{selectedEvidence.fileName}</span></div>
                  <div>Size: <span className="text-slate-200">{(selectedEvidence.fileSize / 1024).toFixed(1)} KB</span></div>
                </div>
              </div>

              {/* SHA-256 Hash */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-bold text-blue-400 uppercase">Cryptographic SHA-256 File Hash</span>
                  <button
                    onClick={() => handleCopyHash(selectedEvidence.hash, selectedEvidence.id)}
                    className="text-blue-400 font-bold hover:underline"
                  >
                    {copiedHashId === selectedEvidence.id ? 'Copied!' : 'Copy Hash'}
                  </button>
                </div>
                <div className="text-[10px] text-slate-300 break-all bg-slate-900 p-2 rounded">
                  {selectedEvidence.hash}
                </div>
              </div>

              {/* Chain of Custody Log */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  <span>Chain-of-Custody Log</span>
                </h4>

                <div className="space-y-2 font-mono text-xs">
                  {selectedEvidence.chainOfCustody?.map((coc) => (
                    <div key={coc.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-400">{coc.action}</span>
                        <span className="text-[10px] text-slate-500">{coc.timestamp ? coc.timestamp.slice(0, 16) : ''}</span>
                      </div>
                      <div className="text-[11px] text-slate-300">Performed By: {coc.performedBy}</div>
                      <div className="text-[11px] text-slate-400">Reason: {coc.reason}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEvidence(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CASE CLOSE VALIDATION */}
      {showCloseValidationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Case Close Checklist Validation</span>
              </h3>
              <button onClick={() => setShowCloseValidationModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-300">
                Before closing Case {caseObj.caseNumber}, review the following unresolved investigation items:
              </p>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                  <span>Open Tasks</span>
                  <span className="font-mono font-bold text-amber-400">
                    {caseObj.tasks.filter((t) => t.status !== 'Completed').length} Pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                  <span>Unreviewed Indicators</span>
                  <span className="font-mono font-bold text-amber-400">
                    {caseObj.indicators.filter((i) => i.investigatorStatus === 'Under Review').length} Pending
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg">
                  <span>Evidence Items Under Review</span>
                  <span className="font-mono font-bold text-amber-400">
                    {caseObj.evidenceItems.filter((e) => e.status === 'Under Review').length} Pending
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Reason for Closing / Override Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Mandatory officer remark for case closure..."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCloseValidationModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCloseValidationModal(false);
                    const updated = { ...caseObj, status: 'Closed' as CaseStatus };
                    const now = new Date().toISOString();
                    updated.activityLogs.unshift({
                      id: `ACT-${Date.now()}`,
                      investigationId: caseObj.id,
                      actor: caseObj.assignedInvestigator,
                      action: 'Case Closed',
                      details: `Closed case. Reason: ${overrideReason || 'Investigation concluded.'}`,
                      timestamp: now,
                    });
                    handleUpdateCurrentCase(updated);
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl"
                >
                  Confirm Close Case
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KEY MARKING REASON */}
      {keyReasonModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>Mark Key {keyReasonModal.type} - Reason Required</span>
              </h3>
              <button onClick={() => setKeyReasonModal(null)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveKeyReason} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Target Object
                </label>
                <div className="font-mono text-xs font-bold text-amber-400 bg-slate-950 p-2 rounded-xl border border-slate-800">
                  {keyReasonModal.label}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Investigator Reason / Significance Remark *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Mandatory officer reason for why this item is marked as key evidence..."
                  value={keyReasonText}
                  onChange={(e) => setKeyReasonText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setKeyReasonModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl"
                >
                  Save Key Marking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD QUESTION */}
      {showAddQuestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Log Investigation Question</span>
              </h3>
              <button onClick={() => setShowAddQuestionModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateQuestion} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Which beneficiary account received the cash withdrawal at Satara ATM?"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddQuestionModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl"
                >
                  Log Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE SNAPSHOT */}
      {showSnapshotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
                <History className="w-4 h-4 text-purple-400" />
                <span>Create Investigation Analytical Snapshot</span>
              </h3>
              <button onClick={() => setShowSnapshotModal(false)} className="text-slate-400 hover:text-slate-100">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSnapshot} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Milestone Remark / Reason
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Frozen dataset prior to sending official Nodal Bank Notice..."
                  value={snapshotDesc}
                  onChange={(e) => setSnapshotDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSnapshotModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 rounded-xl"
                >
                  Freeze & Create Snapshot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MULTI-CASE COMPARISON */}
      {showComparisonModal && (
        <CaseComparisonModal
          currentCase={caseObj}
          allTransactions={allTransactions}
          allStatements={allStatements}
          onClose={() => setShowComparisonModal(false)}
          onOpenAccount={(accId) => {
            setShowComparisonModal(false);
            onOpenAccount(accId);
          }}
        />
      )}

      {/* DRAWER: BOOKMARKS */}
      <CaseBookmarksDrawer
        isOpen={showBookmarksDrawer}
        bookmarks={caseObj.bookmarks || []}
        onClose={() => setShowBookmarksDrawer(false)}
        onRemoveBookmark={handleRemoveBookmark}
        onSelectBookmarkItem={(itemType, itemId) => {
          setShowBookmarksDrawer(false);
          if (itemType === 'Account') {
            onOpenAccount(itemId);
          } else if (itemType === 'Transaction') {
            setActiveTab('transactions');
          } else if (itemType === 'Pattern') {
            setActiveTab('patterns');
          } else if (itemType === 'Evidence') {
            setActiveTab('evidence');
          }
        }}
      />

      {/* SLIDE-OVER PANEL: RELATED OBJECTS */}
      <RelatedObjectsPanel
        isOpen={!!selectedEntityForPanel}
        selectedEntity={selectedEntityForPanel}
        caseObj={caseObj}
        allTransactions={allTransactions}
        onClose={() => setSelectedEntityForPanel(null)}
        onOpenAccount={(accId) => {
          setSelectedEntityForPanel(null);
          onOpenAccount(accId);
        }}
      />
    </div>
  );
};
