'use client';

import React from 'react';
import { X, Bookmark, Trash2, ExternalLink, Shield } from 'lucide-react';
import { CaseBookmark } from '@/types/case';

interface CaseBookmarksDrawerProps {
  isOpen: boolean;
  bookmarks: CaseBookmark[];
  onClose: () => void;
  onRemoveBookmark: (id: string) => void;
  onSelectBookmarkItem: (itemType: string, itemId: string) => void;
}

export const CaseBookmarksDrawer: React.FC<CaseBookmarksDrawerProps> = ({
  isOpen,
  bookmarks,
  onClose,
  onRemoveBookmark,
  onSelectBookmarkItem,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Case Bookmarks</h3>
              <p className="text-[11px] text-slate-400">Pinned items for fast access during investigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Bookmark className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs font-semibold text-slate-400">No bookmarked items yet.</p>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Click the &quot;Bookmark&quot; action on any account, transaction, pattern, or evidence item to pin it here.
              </p>
            </div>
          ) : (
            bookmarks.map((bm) => (
              <div
                key={bm.id}
                className="bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl p-3 flex items-center justify-between group transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-slate-900 text-amber-400 border border-amber-500/30 shrink-0">
                    {bm.itemType}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200 truncate">{bm.label}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">ID: {bm.itemId}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => onSelectBookmarkItem(bm.itemType, bm.itemId)}
                    className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                    title="Open Item Details"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveBookmark(bm.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex justify-between items-center text-[11px] text-slate-500">
          <span>{bookmarks.length} Bookmarks Pinned</span>
          <button onClick={onClose} className="hover:underline text-slate-400">
            Close Panel
          </button>
        </div>
      </div>
    </div>
  );
};
