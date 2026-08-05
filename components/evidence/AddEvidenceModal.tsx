'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  FileText,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  FileCode,
  Layers,
  Plus,
} from 'lucide-react';
import { InvestigationCase, EvidenceType, EvidenceItem } from '@/types/case';
import { addEvidenceToCase, generateNextEvidenceId, computeSHA256 } from '@/lib/caseStorage';

interface AddEvidenceModalProps {
  cases: InvestigationCase[];
  defaultCaseId?: string;
  onClose: () => void;
  onAdded: () => void;
}

export const AddEvidenceModal: React.FC<AddEvidenceModalProps> = ({
  cases,
  defaultCaseId,
  onClose,
  onAdded,
}) => {
  const [targetCaseId, setTargetCaseId] = useState(defaultCaseId || cases[0]?.id || 'CYBER-2026-00001');
  const [title, setTitle] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('Bank Statement');
  const [description, setDescription] = useState('');

  const [sourceType, setSourceType] = useState('Official Bank Nodal Request');
  const [sourceName, setSourceName] = useState('');
  const [sourceOrganization, setSourceOrganization] = useState('');
  const [collectedAt, setCollectedAt] = useState(new Date().toISOString().slice(0, 10));

  // File Upload & SHA-256
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string>('');
  const [fileDataUrl, setFileDataUrl] = useState<string | undefined>(undefined);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  // Source mapping fields
  const [pageNumber, setPageNumber] = useState<string>('');
  const [sheetName, setSheetName] = useState<string>('');
  const [rowNumber, setRowNumber] = useState<string>('');
  const [sourceTextRef, setSourceTextRef] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [normalizedValue, setNormalizedValue] = useState<string>('');

  const [notes, setNotes] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if ('target' in e && (e.target as HTMLInputElement).files?.length) {
      file = (e.target as HTMLInputElement).files![0];
    }
    if (!file) return;

    setSelectedFile(file);
    setIsProcessingFile(true);

    try {
      const buffer = await file.arrayBuffer();
      const hash = await computeSHA256(buffer);
      setCalculatedHash(hash);

      // Read preview data URL for images/text
      const reader = new FileReader();
      reader.onload = (evt) => {
        setFileDataUrl(evt.target?.result as string);
        setIsProcessingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('File hashing error:', err);
      setIsProcessingFile(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !targetCaseId) return;

    const selectedCase = cases.find((c) => c.id === targetCaseId);
    if (!selectedCase) return;

    const now = new Date().toISOString();
    const evId = generateNextEvidenceId(selectedCase);

    const finalHash = calculatedHash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    const fileName = selectedFile ? selectedFile.name : `Evidence_${title.replace(/\s+/g, '_')}.pdf`;
    const fileSize = selectedFile ? selectedFile.size : 102400;
    const fileType = selectedFile ? selectedFile.type : 'application/pdf';

    const newEvItem: EvidenceItem = {
      id: evId,
      evidenceNumber: evId,
      investigationId: selectedCase.id,
      evidenceType,
      title,
      description,
      sourceType,
      sourceName: sourceName || sourceType,
      sourceOrganization: sourceOrganization || undefined,
      collectedAt,
      status: 'Verified',
      integrityStatus: 'Verified Unchanged',
      hash: finalHash,
      fileName,
      fileSize,
      fileType,
      fileDataUrl,
      sourceLocation: {
        pageNumber: pageNumber ? parseInt(pageNumber, 10) : undefined,
        sheetName: sheetName || undefined,
        rowNumber: rowNumber ? parseInt(rowNumber, 10) : undefined,
        sourceTextRef: sourceTextRef || undefined,
        originalValue: originalValue || undefined,
        normalizedValue: normalizedValue || undefined,
      },
      relatedAccountIds: [],
      relatedTransactionIds: [],
      relatedIndicatorIds: [],
      notes: notes.trim() ? [notes.trim()] : ['Imported via Evidence Vault'],
      versions: [
        {
          version: 1,
          fileName,
          fileSize,
          fileType,
          fileHash: finalHash,
          uploadedAt: now,
          uploadedBy: 'Investigator',
        },
      ],
      chainOfCustody: [
        {
          id: `COC-${Date.now()}`,
          evidenceId: evId,
          action: 'Collected',
          performedBy: 'Investigator',
          timestamp: now,
          reason: `Collected & registered from ${sourceType}`,
          newHash: finalHash,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    selectedCase.evidenceItems.unshift(newEvItem);
    selectedCase.timeline.push({
      id: `TLE-${Date.now()}`,
      investigationId: selectedCase.id,
      eventType: 'Evidence Added',
      objectType: 'Evidence',
      objectId: evId,
      description: `Registered evidence ${evId} (${title}).`,
      actor: 'Investigator',
      timestamp: now,
    });

    selectedCase.activityLogs.unshift({
      id: `ACT-${Date.now()}`,
      investigationId: selectedCase.id,
      actor: 'Investigator',
      action: 'Evidence Registered',
      details: `Added evidence item ${evId} with SHA-256 ${finalHash.slice(0, 16)}...`,
      timestamp: now,
    });

    onAdded();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-8 space-y-0">
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-100 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-blue-400" />
            <span>Register New Cyber Evidence File</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Case & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Investigation Case *
              </label>
              <select
                value={targetCaseId}
                onChange={(e) => setTargetCaseId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - {c.title.slice(0, 25)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Evidence Type *
              </label>
              <select
                value={evidenceType}
                onChange={(e) => setEvidenceType(e.target.value as EvidenceType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="Bank Statement">Bank Statement</option>
                <option value="Transaction Record">Transaction Record</option>
                <option value="Screenshot">Screenshot</option>
                <option value="Image">Image</option>
                <option value="Document">Document / PDF</option>
                <option value="Digital File">Digital File / Log</option>
              </select>
            </div>
          </div>

          {/* Row 2: Title & Collection Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Evidence Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. HDFC Bank Statement Account XXXX1234 (July 2026)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Collection Date *
              </label>
              <input
                type="date"
                required
                value={collectedAt}
                onChange={(e) => setCollectedAt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 font-mono"
              />
            </div>
          </div>

          {/* File Upload Dropzone */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Source File & SHA-256 Hashing
            </label>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                handleFileChange(e);
              }}
              className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-950 rounded-xl p-4 text-center cursor-pointer transition-colors"
            >
              <Upload className="w-6 h-6 text-slate-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-300">Drag & Drop file or click to select</p>
              <p className="text-[10px] text-slate-500">Supports PDF, CSV, XLSX, PNG, JPG, JSON</p>
              <input type="file" onChange={handleFileChange} className="hidden" id="modal-file-input" />
              <label
                htmlFor="modal-file-input"
                className="mt-2 inline-block px-3 py-1 bg-slate-900 border border-slate-700 rounded text-[11px] font-bold text-blue-400 cursor-pointer"
              >
                Choose Local File
              </label>
            </div>

            {selectedFile && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5 font-mono text-xs">
                <div className="flex items-center justify-between text-slate-200 font-bold">
                  <span>{selectedFile.name}</span>
                  <span className="text-[10px] text-slate-400">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                {isProcessingFile ? (
                  <div className="text-[10px] text-amber-400">Calculating SHA-256...</div>
                ) : (
                  <div className="text-[10px] text-emerald-400 break-all bg-slate-900 p-2 rounded border border-slate-800">
                    <span className="font-bold text-slate-400">SHA-256: </span>
                    {calculatedHash}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Row 3: Source Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Source Channel / Request Type
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              >
                <option value="Official Bank Nodal Request">Official Bank Nodal Request</option>
                <option value="NPCI Nodal Portal">NPCI Nodal Portal</option>
                <option value="Complainant Submission">Complainant Submission</option>
                <option value="Court Order / Sec 91 CrPC">Court Order / Sec 91 CrPC</option>
                <option value="Telecom Nodal Data">Telecom Nodal Data</option>
                <option value="Other Source">Other Source</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Source Officer / Organization
              </label>
              <input
                type="text"
                placeholder="e.g. HDFC Cyber Nodal Officer"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Source Location Mapping (Optional) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              Source Location & Record Mapping (Optional)
            </span>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Page #</label>
                <input
                  type="number"
                  placeholder="e.g. 3"
                  value={pageNumber}
                  onChange={(e) => setPageNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Sheet Name</label>
                <input
                  type="text"
                  placeholder="e.g. July_2026"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase">Row #</label>
                <input
                  type="number"
                  placeholder="e.g. 142"
                  value={rowNumber}
                  onChange={(e) => setRowNumber(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Description / Notes */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Description & Notes
            </label>
            <textarea
              rows={2}
              placeholder="Investigator notes on collection method, authenticity verification, or key observations..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-sm"
            >
              Register & Hash Evidence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
