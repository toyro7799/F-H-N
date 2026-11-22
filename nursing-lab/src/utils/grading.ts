import {
  EXAM_WEIGHTS,
  FIB_GRADING_CONFIG,
  getGradeClassification,
} from '../config/examConfig';
import type {
  BlankGradeResult,
  ExamFillInQuestion,
  ExamMcqQuestion,
  ExamSummary,
  FillInGradeResult,
  GeneratedExam,
  McqGradeResult,
  PartScoreSummary,
  SheetBreakdownItem,
  WritingGradeResult,
} from '../types/exam';
export {gradeWritingQuestion} from './writingGrading';

const SUBSCRIPT_MAP: Record<string, string> = {
  '₀': '0',
  '₁': '1',
  '₂': '2',
  '₃': '3',
  '₄': '4',
  '₅': '5',
  '₆': '6',
  '₇': '7',
  '₈': '8',
  '₉': '9',
};

/**
 * Normalizes text for Fill-in-the-Blank comparison:
 * - replaces Unicode subscripts (O₂ -> O2)
 * - strips Arabic diacritics
 * - lowercases and trims
 * - unifies hyphens / dashes
 * - strips punctuation (while keeping + for things like 2+ or Rh+)
 * - removes English articles (a, an, the)
 */
export function normalizeFillInText(input: string): string {
  if (!input) return '';

  let text = input
    .replace(/[₀-₉]/g, (ch) => SUBSCRIPT_MAP[ch] ?? ch)
    // Remove Arabic diacritics (tashkeel) and tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Arabic alef/taa forms
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();

  // Unify all dash/hyphen variants to a single space or standard hyphen
  text = text.replace(/[\u2010-\u2015−–—]/g, '-');

  // Remove punctuation except alphanumeric, spaces, hyphens, plus, percent, slash, dot (for decimals)
  text = text.replace(/[’'`"“”.,:;!?()[\]{}]/g, ' ');

  // Collapse hyphen spacing ("36.1 - 37.2" -> "36.1-37.2", "warm blooded" ~ "warm-blooded")
  text = text.replace(/\s*-\s*/g, ' ');

  // Remove standalone English articles
  text = text
    .split(/\s+/)
    .filter((token) => token.length > 0 && token !== 'a' && token !== 'an' && token !== 'the')
    .join(' ');

  return text.trim();
}

/**
 * Computes classic Levenshtein edit distance between two strings.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) {
    prev[j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) {
      prev[j] = curr[j];
    }
  }

  return prev[b.length];
}

/**
 * Checks whether two normalized strings differ only by a simple singular/plural ending.
 */
function isSingularPluralMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (a + 's' === b || b + 's' === a) return true;
  if (a + 'es' === b || b + 'es' === a) return true;
  if (a.endsWith('ies') && a.slice(0, -3) + 'y' === b) return true;
  if (b.endsWith('ies') && b.slice(0, -3) + 'y' === a) return true;
  return false;
}

/**
 * Checks if a user's single blank input matches any accepted variant.
 * Pure numeric answers require exact normalized match so "10" doesn't match "20".
 */
export function gradeSingleBlank(userInput: string, acceptedVariants: string[]): boolean {
  const normUser = normalizeFillInText(userInput);
  if (!normUser) return false;

  const isPureNumeric = /^[0-9]+([./-][0-9]+)*%?$/.test(normUser);

  for (const rawExpected of acceptedVariants) {
    const normExp = normalizeFillInText(rawExpected);
    if (!normExp) continue;

    if (normUser === normExp) return true;
    if (isSingularPluralMatch(normUser, normExp)) return true;

    // Never fuzzy-match pure numbers (e.g. 20 vs 30, 1 vs 2)
    const expIsNumeric = /^[0-9]+([./-][0-9]+)*%?$/.test(normExp);
    if (isPureNumeric || expIsNumeric) continue;

    // Allow small typos on words/phrases
    const maxLen = Math.max(normUser.length, normExp.length);
    if (maxLen >= 3) {
      const allowedDist =
        maxLen < FIB_GRADING_CONFIG.shortWordMaxLength
          ? FIB_GRADING_CONFIG.shortWordMaxDistance
          : FIB_GRADING_CONFIG.longWordMaxDistance;
      if (levenshtein(normUser, normExp) <= allowedDist) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Grades a Fill-in-the-Blank question (supports single & multi-blank with partial credit).
 */
export function gradeFillInQuestion(
  question: ExamFillInQuestion,
  userBlanks: string[]
): FillInGradeResult {
  const blanks: BlankGradeResult[] = [];
  let correctCount = 0;

  for (let i = 0; i < question.blanksCount; i++) {
    const userAns = userBlanks[i] ?? '';
    const expectedList = question.expectedPerBlank[i] ?? question.expectedPerBlank[0] ?? [];
    const expectedDisplay =
      question.displayAnswersPerBlank[i] ?? question.answer;
    const isCorrect = gradeSingleBlank(userAns, expectedList);
    if (isCorrect) correctCount++;

    blanks.push({
      blankIndex: i,
      userAnswer: userAns,
      expectedDisplay,
      isCorrect,
    });
  }

  const score = question.blanksCount > 0 ? correctCount / question.blanksCount : 0;

  return {
    uid: question.uid,
    sheetId: question.sheetId,
    score,
    isFullyCorrect: correctCount === question.blanksCount,
    blanks,
  };
}

/**
 * Grades a single MCQ question (exact original option key match).
 */
export function gradeMcqQuestion(
  question: ExamMcqQuestion,
  selectedKey: 'A' | 'B' | 'C' | 'D' | null
): McqGradeResult {
  const isCorrect = selectedKey !== null && selectedKey === question.answer;
  return {
    uid: question.uid,
    sheetId: question.sheetId,
    selectedKey,
    correctKey: question.answer,
    isCorrect,
    score: isCorrect ? 1 : 0,
  };
}

/**
 * Computes full exam summary: weighted /100 total, per-part scores, and per-sheet breakdown.
 */
export function computeExamSummary(
  exam: GeneratedExam,
  fibGrades: FillInGradeResult[],
  mcqGrades: McqGradeResult[],
  writingGrades: WritingGradeResult[]
): ExamSummary {
  const summarizePart = (earned: number, total: number): PartScoreSummary => ({
    earned: Number(earned.toFixed(1)),
    total,
    percentage: total > 0 ? Math.round((earned / total) * 100) : 0,
  });

  const fibEarned = fibGrades.reduce((acc, g) => acc + g.score, 0);
  const mcqEarned = mcqGrades.reduce((acc, g) => acc + g.score, 0);
  const writingEarned = writingGrades.reduce((acc, g) => acc + g.score, 0);

  const fillIn = summarizePart(fibEarned, exam.fillIn.length);
  const mcq = summarizePart(mcqEarned, exam.mcq.length);
  const writing = summarizePart(writingEarned, exam.writing.length);

  // Re-normalize active weights in case a retry-only exam omits one or two parts
  const activeWeightSum =
    (fillIn.total > 0 ? EXAM_WEIGHTS.fillIn : 0) +
    (mcq.total > 0 ? EXAM_WEIGHTS.mcq : 0) +
    (writing.total > 0 ? EXAM_WEIGHTS.writing : 0);

  let totalScore = 0;
  if (activeWeightSum > 0) {
    const weightedSum =
      (fillIn.total > 0 ? (fillIn.earned / fillIn.total) * EXAM_WEIGHTS.fillIn : 0) +
      (mcq.total > 0 ? (mcq.earned / mcq.total) * EXAM_WEIGHTS.mcq : 0) +
      (writing.total > 0 ? (writing.earned / writing.total) * EXAM_WEIGHTS.writing : 0);
    totalScore = Math.round((weightedSum / activeWeightSum) * 100);
  }

  const {label: gradeLabel, encouragement} = getGradeClassification(totalScore);

  // Per-sheet breakdown
  const sheetStats = new Map<
    string,
    {arabicTitle: string; englishTitle: string; earned: number; total: number}
  >();

  const ensureSheet = (sheetId: string, arabicTitle: string, englishTitle: string) => {
    let entry = sheetStats.get(sheetId);
    if (!entry) {
      entry = {arabicTitle, englishTitle, earned: 0, total: 0};
      sheetStats.set(sheetId, entry);
    }
    return entry;
  };

  exam.fillIn.forEach((q) => {
    const g = fibGrades.find((r) => r.uid === q.uid);
    const entry = ensureSheet(q.sheetId, q.sheetArabicTitle, q.sheetEnglishTitle);
    entry.total += 1;
    entry.earned += g ? g.score : 0;
  });

  exam.mcq.forEach((q) => {
    const g = mcqGrades.find((r) => r.uid === q.uid);
    const entry = ensureSheet(q.sheetId, q.sheetArabicTitle, q.sheetEnglishTitle);
    entry.total += 1;
    entry.earned += g ? g.score : 0;
  });

  exam.writing.forEach((q) => {
    const g = writingGrades.find((r) => r.uid === q.uid);
    const entry = ensureSheet(q.sheetId, q.sheetArabicTitle, q.sheetEnglishTitle);
    entry.total += 1;
    entry.earned += g ? g.score : 0;
  });

  const sheetBreakdown: SheetBreakdownItem[] = Array.from(sheetStats.entries()).map(
    ([sheetId, st]) => ({
      sheetId,
      arabicTitle: st.arabicTitle,
      englishTitle: st.englishTitle,
      earned: Number(st.earned.toFixed(1)),
      total: st.total,
      percentage: st.total > 0 ? Math.round((st.earned / st.total) * 100) : 0,
    })
  );

  const sorted = [...sheetBreakdown].sort((a, b) => b.percentage - a.percentage);
  const strongestSheet = sorted.length > 0 ? sorted[0] : null;
  const weakestSheet = sorted.length > 1 ? sorted[sorted.length - 1] : null;

  return {
    totalScore,
    gradeLabel,
    encouragement,
    fillIn,
    mcq,
    writing,
    sheetBreakdown,
    strongestSheet,
    weakestSheet,
  };
}
