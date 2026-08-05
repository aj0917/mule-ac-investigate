'use client';

import React, { useState } from 'react';
import { X, Filter, Plus, Trash2, Search, SlidersHorizontal, Check } from 'lucide-react';
import { SearchFilterState } from '@/types/crossStatement';

interface AdvancedSearchBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: SearchFilterState) => void;
  initialFilters: SearchFilterState;
  statements: { id: string; fileName: string; bankName: string }[];
}

export const AdvancedSearchBuilderModal: React.FC<AdvancedSearchBuilderModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  initialFilters,
  statements,
}) => {
  const [filters, setFilters] = useState<SearchFilterState>(initialFilters);

  // Advanced search rule row state
  const [rules, setRules] = useState<
    { field: string; operator: string; value: string; logic: 'AND' | 'OR' | 'NOT' }[]
  >([
    { field: 'amount', operator: 'GREATER_THAN', value: '100000', logic: 'AND' },
    { field: 'channel', operator: 'EQUALS', value: 'UPI', logic: 'AND' },
  ]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    setRules([...rules, { field: 'narration', operator: 'CONTAINS', value: '', logic: 'AND' }]);
  };

  const handleRemoveRule = (index: number) => {
    setRules(rules.filter((_, idx) => idx !== index));
  };

  const handleApply = () => {
    // Construct search query string from rules
    const queryParts = rules
      .map((r) => `${r.logic !== 'AND' ? r.logic + ' ' : ''}${r.field}:${r.value}`)
      .join(' ');

    onApplyFilters({
      ...filters,
      query: queryParts || filters.query,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Advanced Investigation Query Builder</h3>
              <p className="text-xs text-slate-400">
                Construct boolean search clauses across all imported bank statement datasets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Direction</label>
              <select
                value={filters.direction || 'ALL'}
                onChange={(e) => setFilters({ ...filters, direction: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="ALL">All Directions</option>
                <option value="CREDIT">Incoming (Credit)</option>
                <option value="DEBIT">Outgoing (Debit)</option>
                <option value="WITHDRAWAL">Cash Withdrawal</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Min Amount (₹)</label>
              <input
                type="number"
                value={filters.minAmount || ''}
                onChange={(e) => setFilters({ ...filters, minAmount: Number(e.target.value) || undefined })}
                placeholder="e.g. 50000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1">Max Amount (₹)</label>
              <input
                type="number"
                value={filters.maxAmount || ''}
                onChange={(e) => setFilters({ ...filters, maxAmount: Number(e.target.value) || undefined })}
                placeholder="e.g. 500000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Dynamic Rule Builder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Boolean Search Clauses (AND / OR / NOT)
              </span>
              <button
                onClick={handleAddRule}
                className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-950/40 px-2.5 py-1 rounded border border-blue-800/60"
              >
                <Plus className="w-3.5 h-3.5" /> Add Clause
              </button>
            </div>

            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                  {idx > 0 && (
                    <select
                      value={rule.logic}
                      onChange={(e) => {
                        const updated = [...rules];
                        updated[idx].logic = e.target.value as any;
                        setRules(updated);
                      }}
                      className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-bold rounded p-1.5 focus:outline-none"
                    >
                      <option value="AND">AND</option>
                      <option value="OR">OR</option>
                      <option value="NOT">NOT</option>
                    </select>
                  )}

                  <select
                    value={rule.field}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[idx].field = e.target.value;
                      setRules(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-none"
                  >
                    <option value="account">Account Number</option>
                    <option value="utr">UTR Reference</option>
                    <option value="upi">UPI Identifier</option>
                    <option value="beneficiary">Beneficiary Name</option>
                    <option value="bank">Bank Name</option>
                    <option value="amount">Amount (₹)</option>
                    <option value="channel">Channel</option>
                    <option value="narration">Narration Keyword</option>
                  </select>

                  <select
                    value={rule.operator}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[idx].operator = e.target.value;
                      setRules(updated);
                    }}
                    className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-none"
                  >
                    <option value="CONTAINS">Contains</option>
                    <option value="EQUALS">Exact Equals</option>
                    <option value="GREATER_THAN">Greater Than (&gt;)</option>
                    <option value="LESS_THAN">Less Than (&lt;)</option>
                    <option value="STARTS_WITH">Starts With</option>
                  </select>

                  <input
                    type="text"
                    value={rule.value}
                    onChange={(e) => {
                      const updated = [...rules];
                      updated[idx].value = e.target.value;
                      setRules(updated);
                    }}
                    placeholder="Value..."
                    className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded p-1.5 focus:outline-none font-mono"
                  />

                  <button
                    onClick={() => handleRemoveRule(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Statement Scope Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-300 block">Target Bank Statements</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 max-h-40 overflow-y-auto">
              <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.statementIds.length === 0}
                  onChange={(e) => {
                    if (e.target.checked) setFilters({ ...filters, statementIds: [] });
                  }}
                  className="rounded bg-slate-900 border-slate-700 text-blue-500"
                />
                <span className="font-semibold text-blue-400">All Imported Statements (Global)</span>
              </label>
              {statements.map((s) => (
                <label key={s.id} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.statementIds.includes(s.id)}
                    onChange={(e) => {
                      const updated = e.target.checked
                        ? [...filters.statementIds, s.id]
                        : filters.statementIds.filter((id) => id !== s.id);
                      setFilters({ ...filters, statementIds: updated });
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-blue-500"
                  />
                  <span className="truncate">{s.fileName} ({s.bankName})</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={() => {
              setFilters({
                query: '',
                searchType: 'ALL',
                statementIds: [],
                caseIds: [],
              });
              setRules([]);
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200"
          >
            Reset Filters
          </button>
          <div className="flex space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Check className="w-4 h-4" /> Execute Advanced Query
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
