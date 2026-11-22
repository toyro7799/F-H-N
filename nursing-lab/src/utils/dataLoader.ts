import {SHEET_CATALOG} from '../config/examConfig';
import type {LoadedSheet, RawExamSheet, SheetCatalogItem} from '../types/exam';

/**
 * In-memory cache so navigating back or starting a new exam does not re-fetch unchanged sheets.
 */
const sheetCache = new Map<string, LoadedSheet>();

export interface LoadSheetsResult {
  sheets: LoadedSheet[];
  failed: Array<{item: SheetCatalogItem; reason: string}>;
}

function validateSheetSchema(data: unknown): data is RawExamSheet {
  if (!data || typeof data !== 'object') return false;
  const candidate = data as Partial<RawExamSheet>;
  return (
    Array.isArray(candidate.multiple_choice) &&
    Array.isArray(candidate.fill_in_the_blank) &&
    Array.isArray(candidate.study_questions)
  );
}

/**
 * Fetches a single sheet JSON from /data/<filename> and enriches it with Arabic catalog metadata.
 */
export async function fetchSheet(item: SheetCatalogItem): Promise<LoadedSheet> {
  const cached = sheetCache.get(item.id);
  if (cached) return cached;

  const url = `/data/${item.filename}`;
  const response = await fetch(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} (${url})`);
  }

  const parsed: unknown = await response.json();
  if (!validateSheetSchema(parsed)) {
    throw new Error(`Invalid JSON schema in ${item.filename}`);
  }

  const loaded: LoadedSheet = {
    ...parsed,
    sheetId: item.id,
    arabicTitle: item.arabicTitle,
    englishTitle: item.englishTitle,
    sheetNumber: item.number,
  };

  sheetCache.set(item.id, loaded);
  return loaded;
}

/**
 * Loads all 10 exam sheets concurrently using Promise.allSettled so partial failures
 * are surfaced cleanly without crashing the whole application.
 */
export async function loadAllSheets(): Promise<LoadSheetsResult> {
  const settled = await Promise.allSettled(SHEET_CATALOG.map((item) => fetchSheet(item)));

  const sheets: LoadedSheet[] = [];
  const failed: Array<{item: SheetCatalogItem; reason: string}> = [];

  settled.forEach((result, index) => {
    const item = SHEET_CATALOG[index];
    if (result.status === 'fulfilled') {
      sheets.push(result.value);
    } else {
      const reason =
        result.reason instanceof Error ? result.reason.message : 'تعذر تحميل ملف الشيت';
      failed.push({item, reason});
    }
  });

  return {sheets, failed};
}

export function clearSheetCache(): void {
  sheetCache.clear();
}
