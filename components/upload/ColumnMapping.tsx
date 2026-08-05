'use client';

import React from 'react';
import { SYSTEM_FIELDS } from '@/lib/statement-parser';
import { ColumnMappingState, SystemFieldKey } from '@/types/investigation';
import { GitBranch, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';

interface ColumnMappingProps {
  headers: string[];
  mapping: ColumnMappingState;
  onChangeMapping: (key: SystemFieldKey, selectedHeader: string) => void;
  onAutoMap: () => void;
}

export const ColumnMapping: React.FC<ColumnMappingProps> = ({
  headers,
  mapping,
  onChangeMapping,
  onAutoMap,
}) => {
  // Required checks
  const hasDate = Boolean(mapping.transaction_date);
  const hasNarration = Boolean(mapping.narration);
  const hasAmount = Boolean(mapping.debit_amount || mapping.credit_amount || mapping.amount);

  const isConfigValid = hasDate && hasNarration && hasAmount;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <GitBranch className="w-4 h-4 text-blue-400" />
            <span>Intelligent Column Mapping</span>
          </h3>
          <p className="text-xs text-slate-400">
            Map statement file columns to normalized system fields for money flow normalization.
          </p>
        </div>

        <button
          onClick={onAutoMap}
          className="text-xs bg-slate-900 hover:bg-slate-800 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg transition-colors font-medium self-start sm:self-auto"
        >
          ⚡ Re-Auto Detect Columns
        </button>
      </div>

      {/* Validation Status Banner */}
      <div
        className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
          isConfigValid
            ? 'bg-emerald-950/30 border-emerald-900/60 text-emerald-300'
            : 'bg-amber-950/30 border-amber-900/60 text-amber-300'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isConfigValid ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            {isConfigValid
              ? 'Required fields mapped: Transaction Date, Narration, and Amount.'
              : 'Missing required mapping: Ensure Date, Narration, and Amount columns are selected.'}
          </span>
        </div>

        <div className="font-mono text-[11px] font-semibold">
          {Object.keys(mapping).filter((k) => mapping[k as SystemFieldKey]).length} / {headers.length} mapped
        </div>
      </div>

      {/* Field Mapping Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {SYSTEM_FIELDS.map((field) => {
          const currentHeader = mapping[field.key] || '';
          const isMapped = Boolean(currentHeader);

          return (
            <div
              key={field.key}
              className={`p-3.5 rounded-xl border text-xs transition-colors space-y-2 ${
                isMapped
                  ? 'bg-slate-950 border-slate-800'
                  : field.required
                  ? 'bg-amber-950/10 border-amber-900/40'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-80'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 font-semibold text-slate-200">
                  <span>{field.label}</span>
                  {field.required && <span className="text-rose-400">*</span>}
                </div>

                <span className="text-[10px] text-slate-500 font-mono">
                  {field.example ? `e.g. ${field.example}` : ''}
                </span>
              </div>

              <select
                value={currentHeader}
                onChange={(e) => onChangeMapping(field.key, e.target.value)}
                className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-xs font-mono transition-colors focus:outline-none ${
                  isMapped
                    ? 'border-blue-500/50 text-blue-300 font-semibold'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                <option value="">-- Do Not Map --</option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    Column: {h}
                  </option>
                ))}
              </select>

              <p className="text-[11px] text-slate-500">{field.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
