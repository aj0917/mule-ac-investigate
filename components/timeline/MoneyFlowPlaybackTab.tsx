'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Clock,
  GitMerge,
  Sliders,
  Sparkles,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { Transaction } from '@/types/investigation';
import { TimelineEvent } from '@/types/timeline';
import { formatCurrencyINR } from '@/lib/storage';

interface MoneyFlowPlaybackTabProps {
  events: TimelineEvent[];
  transactions: Transaction[];
  onSelectEvent?: (event: TimelineEvent) => void;
  onOpenAccountIntelligence?: (accId: string) => void;
}

export const MoneyFlowPlaybackTab: React.FC<MoneyFlowPlaybackTabProps> = ({
  events,
  transactions,
  onSelectEvent,
  onOpenAccountIntelligence,
}) => {
  // Sort source transaction events chronologically
  const txnEvents = events.filter((e) => e.category === 'SOURCE' && e.amount);
  
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2, 5, 10

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(200, 1500 / speed);
      timerRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          if (prev >= txnEvents.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, speed, txnEvents.length]);

  if (txnEvents.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-2">
        <GitMerge className="w-10 h-10 text-slate-600 mx-auto" />
        <p className="text-sm font-semibold">No money flow events available for playback animation.</p>
      </div>
    );
  }

  const currentEvent = txnEvents[currentIndex] || txnEvents[0];
  const activeEventsUpToCurrent = txnEvents.slice(0, currentIndex + 1);

  // Compute accumulated graph network nodes & edges up to current index
  const nodesMap = new Map<string, { id: string; inVolume: number; outVolume: number; count: number }>();
  const edgesMap = new Map<string, { from: string; to: string; volume: number; count: number; channel: string }>();

  activeEventsUpToCurrent.forEach((e) => {
    const from = e.accountId || 'Unknown';
    const to = e.counterpartyName || e.counterpartyId || 'Unknown';
    const amt = e.amount || 0;

    if (!nodesMap.has(from)) nodesMap.set(from, { id: from, inVolume: 0, outVolume: amt, count: 1 });
    else {
      const n = nodesMap.get(from)!;
      n.outVolume += amt;
      n.count += 1;
    }

    if (!nodesMap.has(to)) nodesMap.set(to, { id: to, inVolume: amt, outVolume: 0, count: 1 });
    else {
      const n = nodesMap.get(to)!;
      n.inVolume += amt;
      n.count += 1;
    }

    const edgeKey = `${from}-->${to}`;
    if (!edgesMap.has(edgeKey)) {
      edgesMap.set(edgeKey, { from, to, volume: amt, count: 1, channel: e.channel || 'TRF' });
    } else {
      const edge = edgesMap.get(edgeKey)!;
      edge.volume += amt;
      edge.count += 1;
    }
  });

  const nodes = Array.from(nodesMap.values());
  const edges = Array.from(edgesMap.values());

  return (
    <div className="space-y-6">
      {/* Animation Control Deck */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Playback Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex(0);
              }}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Reset Playback"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Previous Event"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`flex items-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'PAUSE PLAYBACK' : 'PLAY MONEY FLOW'}</span>
            </button>

            <button
              onClick={() => {
                setIsPlaying(false);
                setCurrentIndex((prev) => Math.min(txnEvents.length - 1, prev + 1));
              }}
              className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
              title="Next Event"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Speed:</span>
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[0.5, 1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                    speed === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Position Display */}
          <div className="flex items-center space-x-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-slate-400">Position:</span>
            <span className="text-blue-400 font-bold">{currentEvent.date} {currentEvent.timeFormatted}</span>
            <span className="text-slate-500">({currentIndex + 1} / {txnEvents.length})</span>
          </div>
        </div>

        {/* Timeline Range Slider */}
        <div className="space-y-1">
          <input
            type="range"
            min={0}
            max={txnEvents.length - 1}
            value={currentIndex}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentIndex(Number(e.target.value));
            }}
            className="w-full accent-blue-500 h-2 bg-slate-950 rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 px-1">
            <span>Start: {txnEvents[0].date}</span>
            <span>Current: {currentEvent.date} {currentEvent.timeFormatted}</span>
            <span>End: {txnEvents[txnEvents.length - 1].date}</span>
          </div>
        </div>
      </div>

      {/* Active Event Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-950 p-4 rounded-xl border border-blue-500/30 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <ArrowRight className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
              ACTIVE PLAYBACK TRANSACTION #{currentIndex + 1}
            </span>
            <p className="text-sm font-bold text-slate-100 font-mono">{currentEvent.title}</p>
            <p className="text-xs text-slate-400 font-mono truncate max-w-lg">{currentEvent.description}</p>
          </div>
        </div>

        {currentEvent.amount !== undefined && (
          <div className="text-right">
            <span className="text-base font-bold font-mono text-emerald-400">
              {formatCurrencyINR(currentEvent.amount, false)}
            </span>
            <span className="block text-[10px] font-mono text-slate-400 uppercase">
              Channel: {currentEvent.channel || 'UPI'}
            </span>
          </div>
        )}
      </div>

      {/* Chronological Money Flow Visual Canvas */}
      <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center space-x-2">
            <GitMerge className="w-4 h-4 text-purple-400" />
            <span>Observed Network State at Time T ({nodes.length} Accounts, {edges.length} Transfers)</span>
          </h3>
          <span className="text-[10px] text-slate-500 font-mono">
            Network reveals relationships chronologically as money flows
          </span>
        </div>

        {/* Nodes & Edges Render */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {edges.map((edge, idx) => (
            <div
              key={idx}
              className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 hover:border-blue-500/40 transition-all space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-200">
                <span className="truncate max-w-[100px]" title={edge.from}>{edge.from}</span>
                <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="truncate max-w-[100px] text-purple-400" title={edge.to}>{edge.to}</span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/60 font-mono">
                <span className="text-slate-400 text-[10px]">Total Flow ({edge.count} txns):</span>
                <span className="font-bold text-emerald-400">{formatCurrencyINR(edge.volume)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
