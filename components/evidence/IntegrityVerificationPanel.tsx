'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  Upload,
  Copy,
  Clock,
  Layers,
  FileText,
} from 'lucide-react';
import { EvidenceItem, EvidenceIntegrityCheck } from '@/types/case';
import { computeSHA256 } from '@/lib/caseStorage';
import { getStoredIntegrityChecks, verifyEvidenceIntegrity } from '@/lib/evidenceStorage';

interface IntegrityVerificationPanelProps {
  evidenceItems: { evidence: EvidenceItem; caseId: string }[];
  onRefreshData: () => void;
}

export const IntegrityVerificationPanel: React.FC<IntegrityVerificationPanelProps> = ({
  evidenceItems,
  onRefreshData,
}) => {
  const [historyChecks, setHistoryChecks] = useState<EvidenceIntegrityCheck[]>(() => getStoredIntegrityChecks());

  // Standalone file check states
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [calculatedHash, setCalculatedHash] = useState<string | null>(null);

  // Manual compare states
  const [inputHashA, setInputHashA] = useState('');
  const [inputHashB, setInputHashB] = useState('');

  // Bulk audit states
  const [isAuditing, setIsAuditing] = useState(false);

  const handleFileDrop = async (e: React.DragEvent | React.ChangeEvent<HTMLInputElement>) => {
    let file: File | null = null;
    if ('dataTransfer' in e && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else {
      const input = e.target as HTMLInputElement;
      if (input && input.files && input.files.length > 0) {
        file = input.files[0];
      }
    }
    if (!file) return;

    setSelectedFileName(file.name);
    const buffer = await file.arrayBuffer();
    const hash = await computeSHA256(buffer);
    setCalculatedHash(hash);
  };

  const handleRunAllVerifications = async () => {
    setIsAuditing(true);
    try {
      for (const item of evidenceItems) {
        await verifyEvidenceIntegrity(item.evidence.id, item.caseId);
      }
      onRefreshData();
      setHistoryChecks(getStoredIntegrityChecks());
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const isCompareMatch =
    inputHashA.trim() && inputHashB.trim() && inputHashA.trim().toLowerCase() === inputHashB.trim().toLowerCase();

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Cryptographic SHA-256 Integrity Verification Workstation</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Verify digital evidence hash values, detect file alteration warnings, and record immutable audit logs.
          </p>
        </div>

        <button
          onClick={handleRunAllVerifications}
          disabled={isAuditing}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 flex items-center space-x-2 shadow-sm transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
          <span>Run Bulk Case Hashing Audit</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tool 1: Standalone SHA-256 File Hasher */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Standalone File SHA-256 Hasher</span>
          </h3>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              handleFileDrop(e);
            }}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
              dragActive ? 'border-emerald-500 bg-emerald-950/20' : 'border-slate-800 hover:border-slate-700 bg-slate-950'
            }`}
          >
            <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-200">Drag & Drop any local file to calculate SHA-256</p>
            <p className="text-[10px] text-slate-500 mt-1">Calculated in browser memory via subtle crypto API</p>

            <label className="mt-3 inline-block px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 font-bold rounded-lg cursor-pointer">
              <span>Browse Local File</span>
              <input type="file" onChange={handleFileDrop} className="hidden" />
            </label>
          </div>

          {selectedFileName && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">{selectedFileName}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">SHA-256 Calculated</span>
              </div>
              <div className="p-2 bg-slate-900 rounded font-mono text-[10px] text-slate-300 break-all border border-slate-800 select-all">
                {calculatedHash}
              </div>
            </div>
          )}
        </div>

        {/* Tool 2: Manual Hash Match Verifier */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-400" />
            <span>Cryptographic Hash Match Comparator</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Stored / Reference Hash (Hash A)
              </label>
              <input
                type="text"
                placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b..."
                value={inputHashA}
                onChange={(e) => setInputHashA(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Calculated / Current File Hash (Hash B)
              </label>
              <input
                type="text"
                placeholder="e.g. e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b..."
                value={inputHashB}
                onChange={(e) => setInputHashB(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 placeholder-slate-600"
              />
            </div>

            {inputHashA.trim() && inputHashB.trim() && (
              <div
                className={`p-3 rounded-xl border flex items-center space-x-2 text-xs font-bold ${
                  isCompareMatch
                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-red-950/20 border-red-500/40 text-red-400'
                }`}
              >
                {isCompareMatch ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>VERIFIED MATCH: Cryptographic hashes match exactly. File is unaltered.</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4" />
                    <span>HASH MISMATCH WARNING: The two SHA-256 strings do NOT match!</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Integrity Audit Checks Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Clock className="w-4 h-4 text-purple-400" />
          <span>Recent Cryptographic Integrity Audit Logs ({historyChecks.length})</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-mono text-slate-400 font-bold uppercase">
                <th className="p-2.5">TIMESTAMP</th>
                <th className="p-2.5">EVIDENCE ID</th>
                <th className="p-2.5">ALGORITHM</th>
                <th className="p-2.5">STORED HASH</th>
                <th className="p-2.5">CALCULATED HASH</th>
                <th className="p-2.5">VERIFICATION RESULT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {historyChecks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    No integrity check logs recorded yet. Click &quot;Run Bulk Case Hashing Audit&quot; above.
                  </td>
                </tr>
              ) : (
                historyChecks.slice(0, 15).map((chk) => (
                  <tr key={chk.id} className="hover:bg-slate-800/40 font-mono text-[11px]">
                    <td className="p-2.5 text-slate-400">{chk.checkedAt ? chk.checkedAt.slice(0, 19).replace('T', ' ') : 'N/A'}</td>
                    <td className="p-2.5 font-bold text-blue-400">{chk.evidenceId}</td>
                    <td className="p-2.5 text-purple-400 font-bold">{chk.algorithm}</td>
                    <td className="p-2.5 text-slate-400 max-w-[120px] truncate">{chk.storedHash ? `${chk.storedHash.slice(0, 12)}...` : 'N/A'}</td>
                    <td className="p-2.5 text-slate-400 max-w-[120px] truncate">{chk.calculatedHash ? `${chk.calculatedHash.slice(0, 12)}...` : 'N/A'}</td>
                    <td className="p-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          chk.result === 'Verified Unchanged'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-red-500/20 text-red-400 border border-red-500/40'
                        }`}
                      >
                        {chk.result}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
