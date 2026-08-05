'use client';

import React from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  ArrowRightLeft,
  Users,
  GitMerge,
  FolderSearch,
  FileText,
  BarChart3,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Briefcase,
  Clock,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenUpload: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  onOpenUpload,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, enabled: true },
    { id: 'cases', label: 'Investigations', icon: Briefcase, enabled: true, badge: 'Step 6' },
    { id: 'timeline', label: 'Unified Timeline', icon: Clock, enabled: true, badge: 'Step 7' },
    { id: 'statements', label: 'Bank Statements', icon: FileSpreadsheet, enabled: true },
    { id: 'transactions', label: 'Transactions', icon: ArrowRightLeft, enabled: true },
    { id: 'accounts', label: 'Account Intelligence', icon: Users, enabled: true, badge: 'Step 8' },
    { id: 'investigations', label: 'Global Search & Intel', icon: FolderSearch, enabled: true, badge: 'Step 13' },
    { id: 'money-flow', label: 'Money Flow Graph', icon: GitMerge, enabled: true },
    { id: 'patterns', label: 'Pattern Analysis', icon: Shield, enabled: true, badge: 'Step 5' },
    { id: 'evidence', label: 'Evidence Center', icon: FileText, enabled: true, badge: 'Step 11' },
    { id: 'reports', label: 'Reports', icon: BarChart3, enabled: true, badge: 'Step 12' },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
        {!collapsed && (
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold tracking-wider text-slate-100 uppercase truncate">
                SATARA POLICE
              </span>
              <span className="text-[10px] font-semibold text-blue-400 tracking-wider uppercase truncate">
                CYBER INVESTIGATION
              </span>
            </div>
          </div>
        )}

        {collapsed && (
          <div className="mx-auto w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Shield className="w-5 h-5" />
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors hidden md:flex"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Primary Action Button */}
      <div className="p-3 border-b border-slate-800/80">
        <button
          onClick={onOpenUpload}
          className={`w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-3 rounded-lg text-xs transition-colors shadow-sm shadow-blue-900/30 ${
            collapsed ? 'p-2' : ''
          }`}
          title="Upload Bank Statement"
        >
          <FileSpreadsheet className="w-4 h-4 shrink-0" />
          {!collapsed && <span>Import Statement</span>}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        <div className="px-2 pb-2">
          {!collapsed && (
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              CORE WORKSPACE
            </span>
          )}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              disabled={!item.enabled}
              onClick={() => item.enabled && onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-sm'
                  : item.enabled
                  ? 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                  : 'text-slate-600 cursor-not-allowed opacity-60'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={item.enabled ? item.label : `${item.label} (${item.badge})`}
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </div>

              {!collapsed && !item.enabled && item.badge && (
                <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-500 shrink-0">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 pb-2 px-2">
          <div className="border-t border-slate-800 my-2" />
          {!collapsed && (
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
              SYSTEM
            </span>
          )}
        </div>

        <button
          disabled
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-600 cursor-not-allowed opacity-60 ${
            collapsed ? 'justify-center px-0' : ''
          }`}
          title="Settings (Coming Next)"
        >
          <div className="flex items-center space-x-3">
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
            {!collapsed && <span>Settings</span>}
          </div>
          {!collapsed && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-900 text-slate-500 border border-slate-800">
              Coming Next
            </span>
          )}
        </button>
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/30">
          <div className="flex items-center space-x-2 text-[11px] text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Portal Version 1.0 (Step 1)</span>
          </div>
        </div>
      )}
    </aside>
  );
};
