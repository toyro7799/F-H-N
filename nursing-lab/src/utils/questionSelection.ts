import {QUESTION_COUNT_TIERS} from '../config/examConfig';
import type {
  ExamFillInQuestion,
  ExamMcqQuestion,
  ExamWritingQuestion,
  GeneratedExam,
  LoadedSheet,
  RawFillInQuestion,
  ShuffledMcqOption,
} from '../types/exam';

export type RandomFn = () => number;

/**
 * Fisher-Yates shuffle returning a new array without mutating the input.
 */
export function shuffleArray<T>(items: readonly T[], rng: RandomFn = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Determines exact question counts per section based on number of selected sheets.
 * 1–4 sheets: 10 fill-in, 5 MCQ, 4 writing.
 * 5–10 sheets: 15 fill-in, 10 MCQ, 8 writing.
 */
export function getQuestionCounts(selectedSheetCount: number): {
  fillIn: number;
  mcq: number;
  writing: number;
} {
  if (selectedSheetCount <= QUESTION_COUNT_TIERS.smallGroupMaxSheets) {
    return {...QUESTION_COUNT_TIERS.smallGroup};
  }
  return {...QUESTION_COUNT_TIERS.largeGroup};
}

/**
 * Splits a fill-in-the-blank question string on blank placeholders (4+ underscores).
 */
export function splitBlankSegments(questionText: string): {
  segments: string[];
  blanksCount: number;
} {
  const parts = questionText.split(/_{4,}/g);
  return {
    segments: parts,
    blanksCount: Math.max(1, parts.length - 1),
  };
}

/**
 * Expands an answer string that may contain parenthetical aliases like:
 * - "oxygen (O₂)" -> ["oxygen (O₂)", "oxygen", "O₂"]
 * - "surgical (or invasive / nursing)" -> ["surgical", "invasive", "nursing"]
 * - "Positive (+)" -> ["Positive (+)", "Positive", "+"]
 */
export function expandAnswerVariants(raw: string): string[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const variants = new Set<string>([trimmed]);

  // Pattern: "term (or alt1 / alt2)"
  const orMatch = trimmed.match(/^(.+?)\s*\(\s*or\s+(.+?)\s*\)$/i);
  if (orMatch) {
    variants.add(orMatch[1].trim());
    for (const part of orMatch[2].split('/')) {
      const p = part.trim();
      if (p) variants.add(p);
    }
    return Array.from(variants);
  }

  // Pattern: "Full Name (ABBR)" or "ABBR (Full Name)"
  const parenMatch = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    const outer = parenMatch[1].trim();
    const inner = parenMatch[2].trim();
    if (outer) variants.add(outer);
    if (inner) variants.add(inner);
  }

  return Array.from(variants);
}

/**
 * Parses a RawFillInQuestion into per-blank acceptable answers and clean display chips.
 * Handles `;` multi-blank separators, plus `/` and `to` when blanksCount > 1.
 */
export function parseFillInExpectedAnswers(
  q: RawFillInQuestion,
  blanksCount: number
): {
  expectedPerBlank: string[][];
  displayAnswersPerBlank: string[];
} {
  const primary = q.answer.trim();
  const acceptedList =
    Array.isArray(q.accepted_answers) && q.accepted_answers.length > 0
      ? q.accepted_answers
      : [primary];

  if (blanksCount <= 1) {
    const allVariants = new Set<string>();
    for (const v of expandAnswerVariants(primary)) allVariants.add(v);
    for (const acc of acceptedList) {
      for (const v of expandAnswerVariants(acc)) allVariants.add(v);
    }
    // Also handle "nonallergic or pregnancy" when single blank
    if (/^\S+\s+or\s+\S+$/i.test(primary)) {
      for (const part of primary.split(/\s+or\s+/i)) {
        if (part.trim()) allVariants.add(part.trim());
      }
    }
    return {
      expectedPerBlank: [Array.from(allVariants)],
      displayAnswersPerBlank: [primary],
    };
  }

  // Multi-blank case
  const splitParts = (text: string): string[] | null => {
    if (text.includes(';')) {
      return text.split(';').map((s) => s.trim()).filter(Boolean);
    }
    if (text.includes(' / ')) {
      return text.split(' / ').map((s) => s.trim()).filter(Boolean);
    }
    if (/\s+to\s+/i.test(text)) {
      return text.split(/\s+to\s+/i).map((s) => s.trim()).filter(Boolean);
    }
    return null;
  };

  const primaryParts = splitParts(primary);
  if (primaryParts && primaryParts.length === blanksCount) {
    const expectedPerBlank: string[][] = Array.from({length: blanksCount}, () => []);
    primaryParts.forEach((part, idx) => {
      expectedPerBlank[idx].push(...expandAnswerVariants(part));
    });
    for (const acc of acceptedList) {
      const accParts = splitParts(acc);
      if (accParts && accParts.length === blanksCount) {
        accParts.forEach((part, idx) => {
          for (const v of expandAnswerVariants(part)) {
            if (!expectedPerBlank[idx].includes(v)) {
              expectedPerBlank[idx].push(v);
            }
          }
        });
      }
    }
    return {
      expectedPerBlank,
      displayAnswersPerBlank: primaryParts,
    };
  }

  // Fallback if multi-blank cannot be split cleanly
  const fallbackVariants = Array.from(
    new Set(acceptedList.flatMap((a) => expandAnswerVariants(a)))
  );
  return {
    expectedPerBlank: Array.from({length: blanksCount}, () => fallbackVariants),
    displayAnswersPerBlank: [primary],
  };
}

/**
 * Balanced round-robin random selection across selected sheets with zero duplicates.
 */
export function pickBalancedFromPools<T>(
  pools: Array<{sheetId: string; items: T[]}>,
  targetCount: number,
  rng: RandomFn = Math.random
): T[] {
  const shuffledPools = shuffleArray(
    pools
      .map((p) => ({sheetId: p.sheetId, items: shuffleArray(p.items, rng)}))
      .filter((p) => p.items.length > 0),
    rng
  );

  const picked: T[] = [];
  let cursor = 0;

  while (picked.length < targetCount && shuffledPools.some((p) => p.items.length > 0)) {
    const pool = shuffledPools[cursor % shuffledPools.length];
    if (pool.items.length > 0) {
      const next = pool.items.pop();
      if (next !== undefined) {
        picked.push(next);
      }
    }
    cursor++;
  }

  return shuffleArray(picked, rng);
}

/**
 * Builds a complete, balanced exam from selected sheets.
 */
export function buildExamFromSheets(
  allSheets: LoadedSheet[],
  selectedSheetIds: string[],
  rng: RandomFn = Math.random
): GeneratedExam {
  const selectedSheets = allSheets.filter((s) => selectedSheetIds.includes(s.sheetId));
  const counts = getQuestionCounts(selectedSheets.length);

  const fibPools = selectedSheets.map((sheet) => ({
    sheetId: sheet.sheetId,
    items: sheet.fill_in_the_blank.map((q): ExamFillInQuestion => {
      const {segments, blanksCount} = splitBlankSegments(q.question);
      const {expectedPerBlank, displayAnswersPerBlank} = parseFillInExpectedAnswers(
        q,
        blanksCount
      );
      return {
        ...q,
        uid: `${sheet.sheetId}:${q.id}`,
        sheetId: sheet.sheetId,
        sheetArabicTitle: sheet.arabicTitle,
        sheetEnglishTitle: sheet.englishTitle,
        blanksCount,
        segments,
        expectedPerBlank,
        displayAnswersPerBlank,
      };
    }),
  }));

  const mcqPools = selectedSheets.map((sheet) => ({
    sheetId: sheet.sheetId,
    items: sheet.multiple_choice.map((q): ExamMcqQuestion => {
      const keys: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const availableKeys = keys.filter((k) => typeof q.options[k] === 'string' && q.options[k].trim() !== '');
      const shuffledKeys = shuffleArray(availableKeys.length > 0 ? availableKeys : keys, rng);
      const displayLabels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];

      const shuffledOptions: ShuffledMcqOption[] = shuffledKeys.map((origKey, idx) => ({
        originalKey: origKey,
        displayLabel: displayLabels[idx] ?? origKey,
        text: q.options[origKey] ?? '',
      }));

      return {
        ...q,
        uid: `${sheet.sheetId}:${q.id}`,
        sheetId: sheet.sheetId,
        sheetArabicTitle: sheet.arabicTitle,
        sheetEnglishTitle: sheet.englishTitle,
        shuffledOptions,
      };
    }),
  }));

  const writingPools = selectedSheets.map((sheet) => ({
    sheetId: sheet.sheetId,
    items: sheet.study_questions.map((q): ExamWritingQuestion => ({
      ...q,
      uid: `${sheet.sheetId}:${q.id}`,
      sheetId: sheet.sheetId,
      sheetArabicTitle: sheet.arabicTitle,
      sheetEnglishTitle: sheet.englishTitle,
    })),
  }));

  const fillIn = pickBalancedFromPools(fibPools, counts.fillIn, rng);
  const mcq = pickBalancedFromPools(mcqPools, counts.mcq, rng);
  const writing = pickBalancedFromPools(writingPools, counts.writing, rng);

  // Build Answer Bank: split multi-blank answers by ';' (already parsed in displayAnswersPerBlank)
  const rawChips: string[] = [];
  for (const q of fillIn) {
    for (const chip of q.displayAnswersPerBlank) {
      rawChips.push(chip);
    }
  }
  const answerBank = shuffleArray(rawChips, rng);

  return {
    id: `exam-${Date.now()}-${Math.floor(rng() * 10000)}`,
    createdAt: new Date().toISOString(),
    selectedSheetIds: [...selectedSheetIds],
    fillIn,
    answerBank,
    mcq,
    writing,
  };
}

/**
 * Builds a retry exam containing ONLY the questions that were answered wrongly or partially.
 */
export function buildRetryWrongExam(
  previousExam: GeneratedExam,
  wrongFibUids: Set<string>,
  wrongMcqUids: Set<string>,
  wrongWritingUids: Set<string>,
  rng: RandomFn = Math.random
): GeneratedExam {
  const fillIn = previousExam.fillIn.filter((q) => wrongFibUids.has(q.uid));
  const mcq = previousExam.mcq
    .filter((q) => wrongMcqUids.has(q.uid))
    .map((q) => {
      const displayLabels: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
      const reshuffled = shuffleArray(q.shuffledOptions, rng).map((opt, idx) => ({
        ...opt,
        displayLabel: displayLabels[idx] ?? opt.displayLabel,
      }));
      return {...q, shuffledOptions: reshuffled};
    });
  const writing = previousExam.writing.filter((q) => wrongWritingUids.has(q.uid));

  const answerBank = shuffleArray(
    fillIn.flatMap((q) => q.displayAnswersPerBlank),
    rng
  );

  return {
    id: `retry-${Date.now()}-${Math.floor(rng() * 10000)}`,
    createdAt: new Date().toISOString(),
    selectedSheetIds: [...previousExam.selectedSheetIds],
    isRetryWrongOnly: true,
    fillIn,
    answerBank,
    mcq,
    writing,
  };
}
