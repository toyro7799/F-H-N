/**
 * Core TypeScript interfaces for the medical/nursing exam platform.
 */

export interface SheetCatalogItem {
  id: string;
  number: number;
  filename: string;
  arabicTitle: string;
  englishTitle: string;
}

export interface RawMcqQuestion {
  id: string;
  number?: number;
  question: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  answer: 'A' | 'B' | 'C' | 'D';
  answer_text: string;
}

export interface RawFillInQuestion {
  id: string;
  number?: number;
  question: string;
  answer: string;
  accepted_answers: string[];
}

export interface StudyQuestionTable {
  headers: string[];
  rows: string[][];
}

export interface RawStudyQuestion {
  id: string;
  number?: number;
  type?: string;
  category?: string;
  question: string;
  answer: string[];
  table?: StudyQuestionTable;
}

export interface RawExamSheet {
  exam_id: number;
  slug: string;
  title: string;
  source_file?: string;
  notes?: string[];
  counts?: {
    multiple_choice: number;
    fill_in_the_blank: number;
    study_questions: number;
  };
  multiple_choice: RawMcqQuestion[];
  fill_in_the_blank: RawFillInQuestion[];
  study_questions: RawStudyQuestion[];
}

export interface LoadedSheet extends RawExamSheet {
  sheetId: string;
  arabicTitle: string;
  englishTitle: string;
  sheetNumber: number;
}

export interface ExamFillInQuestion extends RawFillInQuestion {
  uid: string;
  sheetId: string;
  sheetArabicTitle: string;
  sheetEnglishTitle: string;
  blanksCount: number;
  segments: string[];
  expectedPerBlank: string[][];
  displayAnswersPerBlank: string[];
}

export interface ShuffledMcqOption {
  originalKey: 'A' | 'B' | 'C' | 'D';
  displayLabel: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ExamMcqQuestion extends RawMcqQuestion {
  uid: string;
  sheetId: string;
  sheetArabicTitle: string;
  sheetEnglishTitle: string;
  shuffledOptions: ShuffledMcqOption[];
}

export interface ExamWritingQuestion extends RawStudyQuestion {
  uid: string;
  sheetId: string;
  sheetArabicTitle: string;
  sheetEnglishTitle: string;
}

export interface GeneratedExam {
  id: string;
  createdAt: string;
  selectedSheetIds: string[];
  isRetryWrongOnly?: boolean;
  fillIn: ExamFillInQuestion[];
  answerBank: string[];
  mcq: ExamMcqQuestion[];
  writing: ExamWritingQuestion[];
}

export interface BlankGradeResult {
  blankIndex: number;
  userAnswer: string;
  expectedDisplay: string;
  isCorrect: boolean;
}

export interface FillInGradeResult {
  uid: string;
  sheetId: string;
  score: number; // 0..1
  isFullyCorrect: boolean;
  blanks: BlankGradeResult[];
}

export interface McqGradeResult {
  uid: string;
  sheetId: string;
  selectedKey: 'A' | 'B' | 'C' | 'D' | null;
  correctKey: 'A' | 'B' | 'C' | 'D';
  isCorrect: boolean;
  score: number; // 0 or 1
}

export type PointMatchStatus = 'covered' | 'partial' | 'missing';

export interface WritingPointDebugInfo {
  keywordScore: number;
  chunkScore: number;
  keyTermScore: number;
  explanationScore: number;
  rawScore: number;
  keyTermHit: boolean;
  questionType: 'points' | 'points_with_explanation';
}

export interface WritingPointFeedback {
  point: string;
  keyTerm: string;
  similarity: number;
  credit: number;
  status: PointMatchStatus;
  matchedChunk: string | null;
  debug?: WritingPointDebugInfo;
}

export type WritingStatus = 'correct' | 'partial' | 'wrong';

export interface WritingGradeResult {
  uid: string;
  sheetId: string;
  questionType: 'points' | 'points_with_explanation';
  score: number; // 0..1
  percentage: number; // 0..100
  status: WritingStatus;
  matchedStudentTokens: string[];
  points: WritingPointFeedback[];
}

export interface PartScoreSummary {
  earned: number;
  total: number;
  percentage: number;
}

export interface SheetBreakdownItem {
  sheetId: string;
  arabicTitle: string;
  englishTitle: string;
  earned: number;
  total: number;
  percentage: number;
}

export type GradeLabel = 'ممتاز' | 'جيد جداً' | 'جيد' | 'يحتاج مراجعة';

export interface ExamSummary {
  totalScore: number; // 0..100
  gradeLabel: GradeLabel;
  encouragement: string;
  fillIn: PartScoreSummary;
  mcq: PartScoreSummary;
  writing: PartScoreSummary;
  sheetBreakdown: SheetBreakdownItem[];
  strongestSheet: SheetBreakdownItem | null;
  weakestSheet: SheetBreakdownItem | null;
}

export interface ExamHistoryEntry {
  id: string;
  date: string;
  sheetIds: string[];
  sheetNames: string[];
  totalScore: number;
  gradeLabel: GradeLabel;
  fillInPct: number;
  mcqPct: number;
  writingPct: number;
}

export type ExamStep = 'welcome' | 'sheets' | 'fib' | 'mcq' | 'writing' | 'results';

export interface SavedExamProgress {
  exam: GeneratedExam;
  step: Exclude<ExamStep, 'welcome' | 'sheets' | 'results'>;
  fibAnswers: Record<string, string[]>;
  mcqAnswers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  writingAnswers: Record<string, string>;
  fibGraded: boolean;
  mcqGraded: boolean;
  writingGraded: boolean;
  skippedUids: string[];
  elapsedSeconds: number;
  timerEnabled: boolean;
  updatedAt: string;
}
