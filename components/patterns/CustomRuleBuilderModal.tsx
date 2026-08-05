'use client';

import React, { useState } from 'react';
import { X, Sliders, ShieldCheck, Plus, Check } from 'lucide-react';
import { CustomInvestigationRule, PatternCategory, PatternPriority } from '@/types/investigation';
import { saveCustomRule } from '@/lib/patternEngine';

interface CustomRuleBuilderModalProps {
  onClose: () => void;
  onRuleSaved: () => void;
}

export const CustomRuleBuilderModal: React.FC<CustomRuleBuilderModalProps> = ({
  onClose,
  onRuleSaved,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PatternCategory>('RAPID_MOVEMENT');
  const [priority, setPriority] = useState<PatternPriority>('HIGH');
  const [minAmount, setMinAmount] = useState('100000');
  const [timeWindowMinutes, setTimeWindowMinutes] = useState('30');
  const [minCount, setMinCount] = useState('3');
  const [direction, setDirection] = useState<'INCOMING' | 'OUTGOING' | 'BOTH'>('BOTH');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newRule: CustomInvestigationRule = {
      id: `CUSTOM-RULE-${Date.now().toString().slice(-6)}`,
      name: name.trim(),
      description: description.trim() || 'Custom officer-defined pattern rule',
      category,
      priority,
      status: 'ACTIVE',
      version: 1,
      createdBy: 'Satara Police Investigator',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      conditions: {
        minAmount: Number(minAmount) || 50000,
        timeWindowMinutes: Number(timeWindowMinutes) || 30,
        minCount: Number(minCount) || 3,
        direction,
      },
    };

    saveCustomRule(newRule);
    onRuleSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Custom Investigation Rule Builder</h3>
              <p className="text-xs text-slate-400">Define rule conditions to flag specific transaction behavior</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh] text-xs">
          <div>
            <label className="block text-slate-300 font-bold mb-1">Rule Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. High-Volume Nightly UPI Rapid In-Out"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-bold mb-1">Rule Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide investigator context for why this rule triggers an indicator..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-bold mb-1">Pattern Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PatternCategory)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500"
              >
                <option value="RAPID_MOVEMENT">Rapid Money Movement</option>
                <option value="SPLIT_FLOW">Split Flow (Fan-Out)</option>
                <option value="CONSOLIDATION">Consolidation (Fan-In)</option>
                <option value="HIGH_VALUE">High-Value Threshold</option>
                <option value="WITHDRAWAL_AFTER_CREDIT">Withdrawal After Credit</option>
                <option value="IN_OUT_RATIO">High In/Out Flow Retention Ratio</option>
                <option value="ROUND_AMOUNT">Repeated Round Amounts</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-bold mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PatternPriority)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-blue-500 font-bold"
              >
                <option value="HIGH">HIGH PRIORITY</option>
                <option value="MEDIUM">MEDIUM PRIORITY</option>
                <option value="LOW">LOW PRIORITY</option>
              </select>
            </div>
          </div>

          {/* Condition Parameters */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-blue-400 tracking-wider">
              WHEN Conditions Match:
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Minimum Amount (₹)</label>
                <input
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Max Elapsed Time Window (Minutes)</label>
                <input
                  type="number"
                  value={timeWindowMinutes}
                  onChange={(e) => setTimeWindowMinutes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Min Entity Count / Recipients</label>
                <input
                  type="number"
                  value={minCount}
                  onChange={(e) => setMinCount(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Transaction Direction</label>
                <select
                  value={direction}
                  onChange={(e) => setDirection(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200"
                >
                  <option value="BOTH">INCOMING & OUTGOING</option>
                  <option value="INCOMING">INCOMING CREDIT</option>
                  <option value="OUTGOING">OUTGOING DEBIT</option>
                </select>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-800 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center space-x-1.5 shadow-md"
            >
              <Check className="w-4 h-4" />
              <span>Save Custom Rule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
