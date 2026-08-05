'use client';

import React from 'react';
import { ShieldCheck, AlertCircle, Info, Layers } from 'lucide-react';
import { GraphDataQualityMetrics } from '@/types/investigation';

interface GraphDataQualityCalloutProps {
  quality: GraphDataQualityMetrics;
}

export const GraphDataQualityCallout: React.FC<GraphDataQualityCalloutProps> = ({ quality }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-200">Graph Data Coverage & Traceability</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold border border-emerald-500/30">
              {quality.counterpartyCoveragePercentage}% Verified Connections
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {quality.identifiedRelationships} of {quality.totalTransactions} transactions contain explicit beneficiary or counterparty identifiers.
          </p>
        </div>
      </div>

      {quality.missingCounterpartyCount > 0 && (
        <div className="flex items-center space-x-1.5 text-[11px] text-amber-400 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shrink-0">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>
            {quality.missingCounterpartyCount} transactions lack counterparty details in source bank statements.
          </span>
        </div>
      )}
    </div>
  );
};
