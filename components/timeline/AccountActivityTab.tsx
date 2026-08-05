'use client';

import React, { useState } from 'react';
import {
  Users,
  Clock,
  Calendar,
  AlertCircle,
  TrendingUp,
  ArrowRightLeft,
  CheckCircle2,
  ChevronRight,
  User,
  Activity,
  Maximize2,
} from 'lucide-react';
import { Transaction } from '@/types/investigation';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';
import { buildAccountActivityProfile } from '@/lib/timelineAnalytics';

interface AccountActivityTabProps {
  events: TimelineEvent[];
  transactions: Transaction[];
  allAccounts: string[];
  selectedAccount?: string;
  onSelectEvent?: (event: TimelineEvent) => void;
  onOpenAccountIntelligence?: (accId: string) => void;
}

export const AccountActivityTab: React.FC<AccountActivityTabProps> = ({
  events,
  transactions,
  allAccounts,
  selectedAccount,
  onSelectEvent,
  onOpenAccountIntelligence,
}) => {
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>(
    selectedAccount ? [selectedAccount] : allAccounts.slice(0, 3)
  );

  const [highlightTimestamp, setHighlightTimestamp] = useState<string | null>(null);

  const toggleAccount = (acc: string) => {
    if (selectedAccountIds.includes(acc)) {
      if (selectedAccountIds.length > 1) {
        setSelectedAccountIds(selectedAccountIds.filter((a) => a !== acc));
      }
    } else {
      if (selectedAccountIds.length < 5) {
        setSelectedAccountIds([...selectedAccountIds, acc]);
      }
    }
  };

  const primaryAccountId = selectedAccountIds[0] || allAccounts[0] || 'XXXX1234';
  const profile = buildAccountActivityProfile(primaryAccountId, events);

  return (
    <div className="space-y-6">
      {/* Multi-Account Selector Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
              Multi-Account Swimlane Synchronization (Select up to 5)
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Selected: <strong className="text-blue-400">{selectedAccountIds.length}</strong> / 5
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {allAccounts.map((acc) => {
            const isSelected = selectedAccountIds.includes(acc);
            return (
              <button
                key={acc}
                onClick={() => toggleAccount(acc)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 text-blue-400 border-blue-500/40 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {acc}
              </button>
            );
          })}
        </div>
      </div>

      {/* Account Profile Metrics (Primary Selected Account) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Observed Activity Window
          </span>
          <div className="flex items-center space-x-2 font-mono text-xs text-slate-200 mt-1">
            <Calendar className="w-4 h-4 text-blue-400 shrink-0" />
            <span>{profile.firstSeen} → {profile.lastSeen}</span>
          </div>
          <span className="text-[10px] text-slate-500 block">First to last transaction in dataset</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Active Days & Frequency
          </span>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-200 mt-1">
            <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
            <span><strong>{profile.activeDays}</strong> Active Days ({profile.avgTxnsPerDay} txns/day)</span>
          </div>
          <span className="text-[10px] text-slate-500 block">Total observed transactions: {profile.totalTxns}</span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Peak Activity Day
          </span>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-200 mt-1">
            <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{profile.peakDay.date} ({profile.peakDay.count} txns)</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono block">
            Volume: {formatCurrencyINR(profile.peakDay.volume)}
          </span>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Observed Inactivity Gaps
          </span>
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-200 mt-1">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span>{profile.observedGaps.length} Gaps Detected</span>
          </div>
          <span className="text-[10px] text-slate-500 block">
            {profile.observedGaps[0]
              ? `Gap: ${profile.observedGaps[0].gapDays} days (${profile.observedGaps[0].startDate} to ${profile.observedGaps[0].endDate})`
              : 'Continuous observed activity'}
          </span>
        </div>
      </div>

      {/* Synchronized Multi-Account Swimlane View */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Synchronized Chronological Swimlanes</span>
          </h3>
          <span className="text-[10px] text-slate-500">
            Hover or select an event to align timestamps across accounts
          </span>
        </div>

        <div className="space-y-4">
          {selectedAccountIds.map((accId) => {
            const accEvents = events.filter(
              (e) => e.accountId === accId || e.counterpartyId === accId || e.rawTxn?.senderAccount === accId || e.rawTxn?.receiverAccount === accId
            );

            return (
              <div key={accId} className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-mono font-bold text-slate-100">{accId}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({accEvents.length} events)</span>
                  </div>

                  {onOpenAccountIntelligence && (
                    <button
                      onClick={() => onOpenAccountIntelligence(accId)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold flex items-center space-x-1"
                    >
                      <span>Profile</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Event Row Horizontal Swimlane */}
                <div className="flex items-center space-x-2 overflow-x-auto py-2 scrollbar-thin">
                  {accEvents.length === 0 ? (
                    <span className="text-xs text-slate-500 italic p-2">No observed activity for this account.</span>
                  ) : (
                    accEvents.slice(0, 15).map((evt) => {
                      const isHighlighted = highlightTimestamp === evt.timestamp;
                      return (
                        <div
                          key={evt.id}
                          onMouseEnter={() => setHighlightTimestamp(evt.timestamp)}
                          onMouseLeave={() => setHighlightTimestamp(null)}
                          onClick={() => onSelectEvent && onSelectEvent(evt)}
                          className={`shrink-0 p-2.5 rounded-xl border transition-all cursor-pointer text-left space-y-1 w-44 ${
                            isHighlighted
                              ? 'bg-blue-600/30 border-blue-400 shadow-md ring-2 ring-blue-500/50'
                              : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-400">{evt.date}</span>
                            <span className="text-[9px] font-mono font-bold text-blue-400">{evt.timeFormatted}</span>
                          </div>
                          <p className="text-[11px] font-bold text-slate-200 truncate">{evt.title}</p>
                          {evt.amount !== undefined && (
                            <span
                              className={`text-[11px] font-mono font-bold block ${
                                evt.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {evt.direction === 'IN' ? '+' : '-'}{formatCurrencyINR(evt.amount)}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Counterparty Timeline Card */}
      {profile.newCounterpartiesTimeline.length > 0 && (
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span>First-Seen Counterparty Progression</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {profile.newCounterpartiesTimeline.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>First Observed: {item.date}</span>
                  <span className="text-emerald-400 font-bold">New Relationship</span>
                </div>
                <p className="font-bold text-slate-100 font-mono truncate">{item.counterparty}</p>
                <p className="text-[10px] font-mono text-slate-400">
                  Initial Transaction Amount: {formatCurrencyINR(item.amount)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
