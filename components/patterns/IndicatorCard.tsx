'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowRightLeft,
  Clock,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Tag,
  Eye,
  Sliders,
} from 'lucide-react';
import { PatternIndicator, PatternStatus, PatternPriority } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface IndicatorCardProps {
  indicator: PatternIndicator;
  onOpenDetails: (ind: PatternIndicator) => void;
  onShowOnGraph: (accId: string) => void;
  onOpenAccount: (accId: string) => void;
  onUpdateStatus: (indId: string, status: PatternStatus) => void;
}

export const IndicatorCard: React.FC<IndicatorCardProps> = ({
  indicator,
  onOpenDetails,
  onShowOnGraph,
  onOpenAccount,
  onUpdateStatus,
}) => {
  const isHigh = indicator.priority === 'HIGH';
  const isMedium = indicator.priority === 'MEDIUM';

  const statusColors: Record<PatternStatus, string> = {
    NEW: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    UNDER_REVIEW: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    REVIEWED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    DISMISSED: 'bg-slate-800 text-slate-400 border-slate-700',
    IMPORTANT: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  };

  return (
    <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-xl transition-all duration-200 flex flex-col justify-between space-y-4">
      {/* Top Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span
              className={`px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full border ${
                isHigh
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  : isMedium
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
              }`}
            >
              Priority: {indicator.priority}
            </span>

            <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-slate-950 text-slate-400 border border-slate-800">
              {indicator.category.replace(/_/g, ' ')}
            </span>
          </div>

          <select
            value={indicator.status}
            onChange={(e) => onUpdateStatus(indicator.id, e.target.value as PatternStatus)}
            className={`text-[10px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${
              statusColors[indicator.status]
            }`}
          >
            <option value="NEW">NEW</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="REVIEWED">REVIEWED</option>
            <option value="IMPORTANT">IMPORTANT</option>
            <option value="DISMISSED">DISMISSED</option>
          </select>
        </div>

        <h3 className="text-sm font-bold text-slate-100 mt-1 leading-snug">{indicator.title}</h3>
        <p className="text-xs text-slate-400 line-clamp-2">{indicator.subtitle}</p>
      </div>

      {/* Hero Metrics Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Root Account</span>
          <button
            onClick={() => onOpenAccount(indicator.rootAccountId)}
            className="font-mono font-bold text-blue-400 hover:underline truncate block max-w-full text-left"
          >
            {indicator.rootAccountLabel}
          </button>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Observed Amount</span>
          <span className="font-mono font-bold text-emerald-400 block">
            {formatCurrencyINR(indicator.totalAmount, true)}
          </span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Date Range</span>
          <span className="font-mono text-slate-300 text-[11px] block">{indicator.startDate}</span>
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 block">Supporting Txns</span>
          <span className="font-mono font-bold text-slate-200 block">
            {indicator.transactionIds.length} Transactions
          </span>
        </div>
      </div>

      {/* Priority Factors Callout */}
      {indicator.priorityFactors.length > 0 && (
        <div className="text-[11px] space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
          <span className="text-[10px] font-bold text-slate-500 uppercase block">Why this priority?</span>
          <div className="flex flex-wrap gap-1.5">
            {indicator.priorityFactors.map((f, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded text-[10px] bg-slate-900 border border-slate-800 text-slate-300 font-medium"
              >
                {f.label}: <strong className="text-slate-100 font-mono">{f.value}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onShowOnGraph(indicator.rootAccountId)}
          className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-blue-400 rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Show on Graph</span>
        </button>

        <button
          onClick={() => onOpenDetails(indicator)}
          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
        >
          <span>View Calculation</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
