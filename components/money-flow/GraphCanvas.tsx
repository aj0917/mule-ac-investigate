'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  GitMerge,
  ArrowRight,
  Layers,
  Search,
  Move,
} from 'lucide-react';
import { GraphNode, GraphEdge, GraphLayoutType } from '@/types/investigation';
import { formatCurrencyINR } from '@/lib/storage';

interface GraphCanvasProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  rootNodeId: string;
  layout: GraphLayoutType;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  highlightedEdgeIds?: string[];
  onSelectNode: (node: GraphNode) => void;
  onSelectEdge: (edge: GraphEdge) => void;
  onDoubleCLickNode?: (node: GraphNode) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  rootNodeId,
  layout,
  selectedNodeId,
  selectedEdgeId,
  highlightedEdgeIds = [],
  onSelectNode,
  onSelectEdge,
  onDoubleCLickNode,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Reset view to center on root node or fit
  const handleFitScreen = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only pan if background is clicked
    if ((e.target as HTMLElement).tagName === 'svg' || (e.target as HTMLElement).id === 'canvas-bg') {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom((prev) => Math.min(Math.max(prev * zoomFactor, 0.4), 2.5));
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-[600px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none shadow-2xl"
    >
      {/* Background Grid Pattern */}
      <div
        id="canvas-bg"
        className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none"
      />

      {/* Floating Canvas Controls */}
      <div className="absolute top-4 right-4 z-20 flex items-center space-x-1.5 bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-xl backdrop-blur-md">
        <button
          onClick={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
          title="Zoom In"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <button
          onClick={() => setZoom((z) => Math.max(z - 0.15, 0.4))}
          title="Zoom Out"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={handleFitScreen}
          title="Fit to Screen"
          className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-800 my-auto" />

        <span className="px-2 text-xs font-mono font-bold text-slate-400">
          {Math.round(zoom * 100)}%
        </span>
      </div>

      {/* SVG Interactive Canvas */}
      <svg
        className="w-full h-full"
        viewBox="0 0 1000 600"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Arrowhead marker for normal edges */}
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#3b82f6" />
          </marker>

          {/* Arrowhead marker for highlighted active path */}
          <marker
            id="arrow-active"
            viewBox="0 0 10 10"
            refX="28"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
          </marker>

          {/* Glow filter for active/selected elements */}
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Scaled & Panned Group */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. DRAW EDGES */}
          {edges.map((edge) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);

            if (!sourceNode || !targetNode) return null;

            const x1 = sourceNode.x || 0;
            const y1 = sourceNode.y || 0;
            const x2 = targetNode.x || 0;
            const y2 = targetNode.y || 0;

            const isSelected = selectedEdgeId === edge.id;
            const isHighlighted = highlightedEdgeIds.includes(edge.id);
            const isHovered = hoveredEdgeId === edge.id;

            // Midpoint for label
            const midX = (x1 + x2) / 2;
            const midY = (y1 + y2) / 2;

            return (
              <g
                key={edge.id}
                onClick={() => onSelectEdge(edge)}
                onMouseEnter={() => setHoveredEdgeId(edge.id)}
                onMouseLeave={() => setHoveredEdgeId(null)}
                className="cursor-pointer group"
              >
                {/* Visible Directional Path Line */}
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={isHighlighted ? '#10b981' : isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : '#334155'}
                  strokeWidth={isHighlighted || isSelected ? 3 : isHovered ? 2.5 : 1.5}
                  strokeDasharray={isHighlighted ? '6 3' : 'none'}
                  markerEnd={isHighlighted ? 'url(#arrow-active)' : 'url(#arrow)'}
                  className={isHighlighted ? 'animate-pulse' : ''}
                />

                {/* Edge Amount Badge */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x="-45"
                    y="-12"
                    width="90"
                    height="24"
                    rx="6"
                    fill="#020617"
                    stroke={isHighlighted ? '#10b981' : isSelected ? '#3b82f6' : '#1e293b'}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill={isHighlighted ? '#34d399' : '#f8fafc'}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {formatCurrencyINR(edge.amount, true)}
                  </text>
                </g>
              </g>
            );
          })}

          {/* 2. DRAW NODES */}
          {nodes.map((node) => {
            const nx = node.x || 0;
            const ny = node.y || 0;

            const isRoot = node.isRoot;
            const isSelected = selectedNodeId === node.id;
            const isHovered = hoveredNodeId === node.id;
            const isWithdrawal = node.type === 'WITHDRAWAL';

            const cardWidth = 140;
            const cardHeight = 65;

            return (
              <g
                key={node.id}
                transform={`translate(${nx - cardWidth / 2}, ${ny - cardHeight / 2})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  onDoubleCLickNode?.(node);
                }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                className="cursor-pointer group"
              >
                {/* Node Card Box */}
                <rect
                  x="0"
                  y="0"
                  width={cardWidth}
                  height={cardHeight}
                  rx="10"
                  fill={isRoot ? '#0f172a' : isWithdrawal ? '#1e1b4b' : '#020617'}
                  stroke={
                    isRoot
                      ? '#3b82f6'
                      : isSelected
                      ? '#60a5fa'
                      : isWithdrawal
                      ? '#a855f7'
                      : isHovered
                      ? '#475569'
                      : '#1e293b'
                  }
                  strokeWidth={isRoot || isSelected ? '2.5' : '1.5'}
                  filter={isRoot || isSelected ? 'url(#glow)' : undefined}
                />

                {/* Root Indicator Top Stripe */}
                {isRoot && (
                  <rect
                    x="0"
                    y="0"
                    width={cardWidth}
                    height="4"
                    rx="2"
                    fill="#3b82f6"
                  />
                )}

                {/* Label Masked Account */}
                <text
                  x="12"
                  y="22"
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {node.label.length > 14 ? `${node.label.substring(0, 12)}..` : node.label}
                </text>

                {/* Sublabel Bank Name */}
                <text
                  x="12"
                  y="36"
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="medium"
                >
                  {node.sublabel.length > 18 ? `${node.sublabel.substring(0, 16)}..` : node.sublabel}
                </text>

                {/* Total Txn Count / Hop Badge */}
                <g transform={`translate(12, 52)`}>
                  <text fill="#34d399" fontSize="9" fontWeight="bold" fontFamily="monospace">
                    In: {formatCurrencyINR(node.totalMoneyIn, true)}
                  </text>
                </g>

                {/* Connected Badge */}
                {node.connectedCount > 1 && (
                  <g transform={`translate(105, 52)`}>
                    <text fill="#60a5fa" fontSize="8" fontWeight="bold">
                      +{node.connectedCount}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
