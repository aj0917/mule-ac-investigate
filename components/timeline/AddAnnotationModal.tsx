'use client';

import React, { useState } from 'react';
import { X, Tag, Save, AlertCircle } from 'lucide-react';
import { TimelineEvent, TimelineAnnotation } from '@/types/timeline';

interface AddAnnotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: TimelineEvent | null;
  onSaveAnnotation: (annotation: Omit<TimelineAnnotation, 'id' | 'createdAt'>) => void;
  activeCaseId?: string;
}

export const AddAnnotationModal: React.FC<AddAnnotationModalProps> = ({
  isOpen,
  onClose,
  event,
  onSaveAnnotation,
  activeCaseId,
}) => {
  const [annotationType, setAnnotationType] = useState<TimelineAnnotation['annotationType']>('Observation');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('PI V. R. Kadam');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSaveAnnotation({
      caseId: activeCaseId,
      timestamp: event ? event.timestamp : new Date().toISOString(),
      date: event ? event.date : new Date().toISOString().slice(0, 10),
      annotationType,
      content: content.trim(),
      author: author.trim() || 'Investigator',
      relatedAccountId: event?.accountId,
      relatedTxnId: event?.relatedTransactionId,
    });

    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Tag className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-slate-100">Annotate Timeline Event</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {event && (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono uppercase block">Target Event</span>
              <p className="font-semibold text-slate-200 mt-0.5 truncate">{event.title}</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {event.date} {event.timeFormatted}
              </p>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Annotation Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['Observation', 'Question', 'Lead', 'Follow-up', 'Important Event'] as const).map((type) => (
                <button
                  type="button"
                  key={type}
                  onClick={() => setAnnotationType(type as any)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium border text-left transition-all ${
                    annotationType === type
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Investigator Observation / Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Record explicit chronological observation, question, or follow-up notes..."
              rows={4}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1.5 uppercase">
              Investigator Name / Badge
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 text-xs focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!content.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Annotation</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
