import { TimelineAnnotation, SavedTimelineView } from '@/types/timeline';

const STORAGE_KEY_ANNOTATIONS = 'satara_cyber_timeline_annotations_v1';
const STORAGE_KEY_SAVED_VIEWS = 'satara_cyber_timeline_views_v1';

/**
 * Load timeline annotations from storage
 */
export function getStoredTimelineAnnotations(): TimelineAnnotation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANNOTATIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save timeline annotation
 */
export function saveTimelineAnnotation(annotation: Omit<TimelineAnnotation, 'id' | 'createdAt'>): TimelineAnnotation {
  const existing = getStoredTimelineAnnotations();
  const now = new Date().toISOString();
  const newAnn: TimelineAnnotation = {
    ...annotation,
    id: `ANN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
  };
  const updated = [newAnn, ...existing];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_ANNOTATIONS, JSON.stringify(updated));
  }
  return newAnn;
}

/**
 * Load saved timeline views
 */
export function getStoredSavedViews(): SavedTimelineView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_VIEWS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom timeline view preset
 */
export function saveTimelineViewPreset(view: Omit<SavedTimelineView, 'id' | 'createdAt'>): SavedTimelineView {
  const existing = getStoredSavedViews();
  const now = new Date().toISOString();
  const newView: SavedTimelineView = {
    ...view,
    id: `VIEW-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: now,
  };
  const updated = [newView, ...existing];
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_SAVED_VIEWS, JSON.stringify(updated));
  }
  return newView;
}
