import type {ExamHistoryEntry, SavedExamProgress} from '../types/exam';

const HISTORY_KEY = 'nursing_exam_history_v1';
const PROGRESS_KEY = 'nursing_exam_progress_v1';
const THEME_KEY = 'nursing_exam_theme_v1';
const MAX_HISTORY_ITEMS = 12;

export function loadExamHistory(): ExamHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveExamHistoryEntry(entry: ExamHistoryEntry): ExamHistoryEntry[] {
  const existing = loadExamHistory();
  const updated = [entry, ...existing.filter((e) => e.id !== entry.id)].slice(0, MAX_HISTORY_ITEMS);
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota issues
  }
  return updated;
}

export function clearExamHistory(): void {
  try {
    localStorage.removeItem(HISTORY_KEY);
  } catch {
    // Ignore
  }
}

export function loadSavedProgress(): SavedExamProgress | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedExamProgress;
    if (!parsed || !parsed.exam || !parsed.step) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveExamProgress(progress: SavedExamProgress): void {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {
    // Ignore storage quota issues
  }
}

export function clearSavedProgress(): void {
  try {
    localStorage.removeItem(PROGRESS_KEY);
  } catch {
    // Ignore
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // Ignore
  }
  return 'light';
}

export function saveThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Ignore
  }
}
