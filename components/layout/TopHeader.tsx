'use client';

import React, { useState } from 'react';
import {
  Bell,
  HelpCircle,
  MoreVertical,
  ShieldCheck,
  Search,
  FolderOpen,
  Info,
  CheckCircle2,
} from 'lucide-react';

interface TopHeaderProps {
  currentTab: string;
  hasData: boolean;
  activeCaseName?: string;
  onOpenUpload: () => void;
  onLoadDemoFixture?: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  hasData,
  activeCaseName = 'INV-2026-SATARA-01',
  onOpenUpload,
  onLoadDemoFixture,
}) => {
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const breadcrumb =
    currentTab === 'dashboard'
      ? 'Investigation / Dashboard'
      : currentTab === 'statements'
      ? 'Investigation / Bank Statements'
      : 'Investigation / Workspace';

  return (
    <>
      <header className="h-16 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-20">
        {/* Left: Breadcrumb */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-medium text-slate-400">
            <span className="text-slate-500">Satara Cyber Cell</span>
            <span>/</span>
            <span className="text-slate-200 font-semibold">{breadcrumb}</span>
          </div>
        </div>

        {/* Center/Right Controls */}
        <div className="flex items-center space-x-3">
          {/* Active Investigation Case Indicator */}
          <div className="hidden sm:flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
            <FolderOpen className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Investigation:</span>
            {hasData ? (
              <span className="font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {activeCaseName}
              </span>
            ) : (
              <span className="text-slate-500 italic">No Active Case</span>
            )}
          </div>

          {/* Load Demo Data Quick Trigger */}
          {onLoadDemoFixture && (
            <button
              onClick={onLoadDemoFixture}
              className="hidden lg:flex items-center space-x-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-2.5 py-1.5 rounded-md transition-colors"
              title="Load synthetic bank statement fixture to test UI"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Load Demo Data</span>
            </button>
          )}

          {/* Search Trigger */}
          <div className="relative hidden md:block">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Account, UTR, UPI, TXN ID..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  window.dispatchEvent(
                    new CustomEvent('OPEN_UNIVERSAL_SEARCH', {
                      detail: e.currentTarget.value.trim(),
                    })
                  );
                }
              }}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-md pl-8 pr-3 py-1.5 w-48 lg:w-64 focus:outline-none focus:border-blue-500 placeholder-slate-500"
            />
          </div>

          {/* Notifications Placeholder */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors relative"
              title="System Alerts & Notifications"
            >
              <Bell className="w-4 h-4" />
              {hasData && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-lg shadow-xl p-3 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-semibold text-slate-200">
                  <span>Investigation Alerts</span>
                  <span className="text-[10px] text-blue-400">System Ready</span>
                </div>
                <div className="py-3 text-slate-400 text-center">
                  {hasData
                    ? 'Statement import verified. Ready for transaction analysis.'
                    : 'No notifications. Upload a bank statement to begin.'}
                </div>
              </div>
            )}
          </div>

          {/* Help button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title="Help & Supported Formats"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2 text-blue-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-semibold text-slate-100 text-sm">Satara Police Cyber Portal Guide</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-slate-300">
              <p>
                This portal is designed for authorized cyber crime investigators to parse, normalize, and analyze bank statements.
              </p>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5">
                <div className="font-semibold text-slate-200">Supported File Formats:</div>
                <ul className="list-disc list-inside text-slate-400 space-y-1">
                  <li><strong>CSV:</strong> Standard comma-separated bank statements</li>
                  <li><strong>XLSX:</strong> Multi-sheet Excel workbooks (e.g. HDFC, SBI, ICICI)</li>
                  <li><strong>XLS:</strong> Legacy Excel statement files</li>
                </ul>
              </div>
              <p className="text-slate-400">
                Step 1 includes complete file validation, sheet selection, column mapping, and metric calculations.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
