'use client';

import React from 'react';
import { Layers, Plus, CheckCircle2, Copy, FileText, Settings } from 'lucide-react';
import { ReportTemplate } from '@/types/report';
import { getDefaultTemplates } from '@/lib/reportStorage';

interface ReportTemplatesPanelProps {
  onSelectTemplate: (tpl: ReportTemplate) => void;
}

export const ReportTemplatesPanel: React.FC<ReportTemplatesPanelProps> = ({ onSelectTemplate }) => {
  const templates = getDefaultTemplates();

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 flex items-center space-x-2">
              <span>Report Templates Registry</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                4 PRE-BUILT
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Standardized report templates with pre-configured section ordering, filtering defaults, and chapter visibility.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-purple-400">{tpl.id}</span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-slate-950 border border-slate-800 text-slate-300">
                  {tpl.version}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100">{tpl.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{tpl.description}</p>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">
                  Included Report Sections ({tpl.sections.filter((s) => s.visible).length}/{tpl.sections.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {tpl.sections
                    .filter((s) => s.visible)
                    .map((s) => (
                      <span
                        key={s.id}
                        className="px-2 py-0.5 rounded text-[10px] bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {s.title.split('.')[1] || s.title}
                      </span>
                    ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Hop Depth: {tpl.defaultFilters.graphHopDepth || 2} Hops
              </span>
              <button
                onClick={() => onSelectTemplate(tpl)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors shadow-sm flex items-center space-x-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Use Template</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
