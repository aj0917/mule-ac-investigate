'use client';

import React from 'react';
import { ColumnMappingState } from '@/types/investigation';
import { Eye, Table } from 'lucide-react';

interface StatementPreviewProps {
  sheetName: string;
  headers: string[];
  rows: Record<string, any>[];
  mapping: ColumnMappingState;
}

export const StatementPreview: React.FC<StatementPreviewProps> = ({
  sheetName,
  headers,
  rows,
  mapping,
}) => {
  const previewRows = rows.slice(0, 30); // First 30 rows

  // Map header to system field label if mapped
  const getMappedLabel = (headerName: string) => {
    for (const [key, mappedHeader] of Object.entries(mapping)) {
      if (mappedHeader === headerName) {
        return key.replace('_', ' ').toUpperCase();
      }
    }
    return null;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span>Statement Preview ({sheetName})</span>
          </h3>
          <p className="text-xs text-slate-400">
            Showing first {previewRows.length} rows of {rows.length.toLocaleString('en-IN')} total records.
          </p>
        </div>

        <div className="text-[11px] font-mono text-slate-400 bg-slate-950 px-3 py-1 rounded-lg border border-slate-800">
          Mapped columns highlighted in blue
        </div>
      </div>

      <div className="border border-slate-800 rounded-xl overflow-x-auto max-h-[350px] bg-slate-950">
        <table className="w-full text-left text-xs text-slate-300 font-sans border-collapse">
          <thead className="bg-slate-900 sticky top-0 z-10 border-b border-slate-800 text-[10px] uppercase font-semibold text-slate-400">
            <tr>
              <th className="py-2.5 px-3 border-r border-slate-800 w-12 text-center text-slate-500 font-mono">
                #
              </th>
              {headers.map((h) => {
                const mappedLabel = getMappedLabel(h);
                return (
                  <th
                    key={h}
                    className={`py-2.5 px-3 border-r border-slate-800 whitespace-nowrap ${
                      mappedLabel ? 'bg-blue-950/60 text-blue-300 font-bold' : ''
                    }`}
                  >
                    <div>{h}</div>
                    {mappedLabel && (
                      <span className="text-[9px] font-mono text-blue-400 block tracking-wider uppercase font-semibold">
                        → {mappedLabel}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {previewRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                <td className="py-2 px-3 border-r border-slate-800 text-center text-slate-500 font-mono text-[11px]">
                  {idx + 1}
                </td>
                {headers.map((h) => {
                  const isMapped = Boolean(getMappedLabel(h));
                  const cellVal = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
                  return (
                    <td
                      key={h}
                      className={`py-2 px-3 border-r border-slate-800 whitespace-nowrap text-xs truncate max-w-[240px] ${
                        isMapped ? 'bg-blue-950/20 text-slate-100 font-mono' : 'text-slate-400'
                      }`}
                      title={cellVal}
                    >
                      {cellVal || <span className="text-slate-600 italic">—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
