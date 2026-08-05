'use client';

import React, { useState } from 'react';
import {
  Clock,
  ArrowRightLeft,
  Shield,
  FileText,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Maximize2,
  Minimize2,
  Calendar,
  Filter,
  Info,
  Layers,
  Sparkles,
  Search,
} from 'lucide-react';
import {
  TimelineEvent,
  TimelineZoomLevel,
  DataQualityMetrics,
  EventCategory,
} from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';
import { clusterTimelineEvents } from '@/lib/timelineAnalytics';

interface TimelineOverviewTabProps {
  events: TimelineEvent[];
  qualityMetrics: DataQualityMetrics;
  zoomLevel: TimelineZoomLevel;
  onZoomChange: (zoom: TimelineZoomLevel) => void;
  onSelectEvent: (event: TimelineEvent) => void;
  selectedAccount?: string;
}

export const TimelineOverviewTab: React.FC<TimelineOverviewTabProps> = ({
  events,
  qualityMetrics,
  zoomLevel,
  onZoomChange,
  onSelectEvent,
  selectedAccount,
}) => {
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  const filteredEvents = events.filter((e) => {
    if (categoryFilter !== 'ALL' && e.category !== categoryFilter) return false;
    return true;
  });

  // Determine cluster window based on zoom level
  const clusterMinutes =
    zoomLevel === 'YEAR'
      ? 1440 * 30
      : zoomLevel === 'MONTH'
      ? 1440 * 7
      : zoomLevel === 'DAY'
      ? 1440
      : zoomLevel === 'HOUR'
      ? 60
      : 0; // TRANSACTION level = no cluster

  const { clusters, unclustered } =
    clusterMinutes > 0
      ? clusterTimelineEvents(filteredEvents, clusterMinutes)
      : { clusters: [], unclustered: filteredEvents };

  // Combine and sort all items (clusters and single unclustered events) chronologically
  const timelineItems: Array<{ type: 'cluster'; cluster: any } | { type: 'event'; event: TimelineEvent }> = [];

  clusters.forEach((c) => timelineItems.push({ type: 'cluster', cluster: c }));
  unclustered.forEach((e) => timelineItems.push({ type: 'event', event: e }));

  timelineItems.sort((a, b) => {
    const timeA = a.type === 'cluster' ? a.cluster.startTime : a.event.timestamp;
    const timeB = b.type === 'cluster' ? b.cluster.startTime : b.event.timestamp;
    return timeA.localeCompare(timeB);
  });

  const toggleCluster = (id: string) => {
    setExpandedClusters((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Zoom Level & Quality Header */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            <span>Timeline Zoom:</span>
          </span>
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
            {(['YEAR', 'MONTH', 'DAY', 'HOUR', 'TRANSACTION'] as TimelineZoomLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => onZoomChange(level)}
                className={`px-3 py-1 rounded-md text-[11px] font-semibold transition-all ${
                  zoomLevel === level
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {level === 'TRANSACTION' ? 'Exact Txn' : level}
              </button>
            ))}
          </div>
        </div>

        {/* Event Category Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Category:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Categories ({events.length})</option>
            <option value="SOURCE">Source Events (Txns)</option>
            <option value="DERIVED">Derived (Indicators)</option>
            <option value="INVESTIGATOR">Investigator (Notes/Findings)</option>
            <option value="SYSTEM">System (Evidence/Case)</option>
          </select>
        </div>

        {/* Quality Indicator Pill */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <Clock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-emerald-400 font-bold">{qualityMetrics.exactTimePercentage}% Exact Time</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400 font-semibold">{qualityMetrics.dateOnlyPercentage}% Date Only</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">{qualityMetrics.totalEvents} Total Events</span>
          </div>
        </div>
      </div>

      {/* Category Legend Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs px-1 text-slate-400">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span className="text-slate-300">Source Transactions</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
            <span className="text-slate-300">Derived Indicators</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
            <span className="text-slate-300">Investigator Notes</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span className="text-slate-300">System Evidence / Case Events</span>
          </span>
        </div>

        <div className="flex items-center space-x-1 text-[11px] text-slate-500">
          <Info className="w-3.5 h-3.5 text-blue-400" />
          <span>Click any timeline marker to inspect details & actions</span>
        </div>
      </div>

      {/* Timeline Stream */}
      {timelineItems.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3">
          <Clock className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold">No timeline events found for the current filter criteria.</p>
          <p className="text-xs text-slate-500">Try clearing filters or importing additional bank statements.</p>
        </div>
      ) : (
        <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-3 md:before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
          {timelineItems.map((item, idx) => {
            if (item.type === 'cluster') {
              const cluster = item.cluster;
              const isExpanded = !!expandedClusters[cluster.id];

              return (
                <div key={cluster.id} className="relative group">
                  {/* Timeline Node Pin */}
                  <div className="absolute -left-6 md:-left-8 top-3 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 shadow-md">
                    <Layers className="w-3 h-3" />
                  </div>

                  {/* Cluster Container Card */}
                  <div className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 transition-all shadow-sm">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
                          DENSE CLUSTER ({cluster.transactionCount} Events)
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          {cluster.date} ({cluster.startTime.slice(11, 16)} – {cluster.endTime.slice(11, 16)})
                        </span>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="text-xs font-mono">
                          <span className="text-emerald-400 font-semibold mr-3">
                            In: {formatCurrencyINR(cluster.totalIncoming)}
                          </span>
                          <span className="text-rose-400 font-semibold">
                            Out: {formatCurrencyINR(cluster.totalOutgoing)}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleCluster(cluster.id)}
                          className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold transition-colors"
                        >
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          <span>{isExpanded ? 'Collapse' : `Expand ${cluster.transactionCount} Events`}</span>
                        </button>
                      </div>
                    </div>

                    {/* Expanded Cluster Event List */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-2">
                        {cluster.events.map((evt: TimelineEvent) => (
                          <div
                            key={evt.id}
                            onClick={() => onSelectEvent(evt)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <span className="text-[10px] font-mono text-slate-400 shrink-0">
                                {evt.timeFormatted}
                              </span>
                              <span className="text-xs font-semibold text-slate-200 truncate">{evt.title}</span>
                            </div>
                            {evt.amount !== undefined && (
                              <span
                                className={`text-xs font-mono font-bold shrink-0 ${
                                  evt.direction === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {evt.direction === 'IN' ? '+' : '-'}{formatCurrencyINR(evt.amount)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            }

            // Single Unclustered Timeline Event Card
            const event = item.event;
            const isSource = event.category === 'SOURCE';
            const isDerived = event.category === 'DERIVED';
            const isInvestigator = event.category === 'INVESTIGATOR';
            const isSystem = event.category === 'SYSTEM';

            return (
              <div key={event.id} className="relative group">
                {/* Timeline Pin Indicator */}
                <div
                  className={`absolute -left-6 md:-left-8 top-3 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-transform group-hover:scale-110 shadow-md ${
                    isSource
                      ? 'bg-blue-950 border-blue-500 text-blue-400'
                      : isDerived
                      ? 'bg-purple-950 border-purple-500 text-purple-400'
                      : isInvestigator
                      ? 'bg-amber-950 border-amber-500 text-amber-400'
                      : 'bg-emerald-950 border-emerald-500 text-emerald-400'
                  }`}
                >
                  {isSource && <ArrowRightLeft className="w-3 h-3" />}
                  {isDerived && <Shield className="w-3 h-3" />}
                  {isInvestigator && <FileText className="w-3 h-3" />}
                  {isSystem && <Briefcase className="w-3 h-3" />}
                </div>

                {/* Event Card */}
                <div
                  onClick={() => onSelectEvent(event)}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg space-y-2"
                >
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isSource
                            ? 'bg-blue-950 border-blue-800 text-blue-400'
                            : isDerived
                            ? 'bg-purple-950 border-purple-800 text-purple-400'
                            : isInvestigator
                            ? 'bg-amber-950 border-amber-800 text-amber-400'
                            : 'bg-emerald-950 border-emerald-800 text-emerald-400'
                        }`}
                      >
                        {event.category}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-400 font-mono">
                        {event.eventType}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Source: {event.sourceLabel}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 font-mono text-xs">
                      <span className="text-slate-400">{event.date}</span>
                      <span className="text-slate-200 font-bold">{event.timeFormatted}</span>
                      {event.timeAccuracy === 'DATE_ONLY' && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950/80 text-amber-400 border border-amber-800">
                          Approx Time
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 group-hover:text-blue-400 transition-colors">
                        {event.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-0.5 font-mono">
                        {event.description}
                      </p>
                    </div>

                    {event.amount !== undefined && (
                      <div className="text-right shrink-0">
                        <span
                          className={`text-sm font-bold font-mono ${
                            event.direction === 'IN'
                              ? 'text-emerald-400'
                              : event.direction === 'OUT'
                              ? 'text-rose-400'
                              : 'text-slate-200'
                          }`}
                        >
                          {event.direction === 'IN' ? '+' : event.direction === 'OUT' ? '-' : ''}
                          {formatCurrencyINR(event.amount)}
                        </span>
                        {event.channel && (
                          <span className="block text-[10px] font-mono text-slate-500 font-semibold uppercase">
                            {event.channel}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
