import type {
  ExamWritingQuestion,
  PointMatchStatus,
  WritingGradeResult,
  WritingPointFeedback,
  WritingStatus,
} from '../types/exam';

/**
 * ============================================================================
 * EDITABLE WRITING GRADING CONFIGURATION
 * Tune thresholds, weights, stopwords, and medical abbreviations here.
 * ============================================================================
 */
export const WRITING_GRADING_CONFIG = {
  // Credit tier thresholds per model point
  pointFullThreshold: 0.65, // score >= 0.65 -> FULL credit (1.0)
  pointPartialThreshold: 0.35, // 0.35 <= score < 0.65 -> PARTIAL credit (0.5)
  pointFullCredit: 1.0,
  pointPartialCredit: 0.5,

  // Overall question status thresholds (percentage 0..100 or 0..1)
  questionCorrectThreshold: 0.7, // >= 70% -> green ("صحيحة")
  questionPartialThreshold: 0.4, // 40–69% -> amber ("إجابة جزئية")

  // "points_with_explanation" weighting (key terms matter most)
  explanationTypeWeights: {
    keyTerm: 0.8,
    explanation: 0.2,
  },
  keyTermHitMinRatio: 0.75, // fraction of keyTerm words needed to count keyTerm as hit
  keyTermHitFloor: 0.6, // minimum point score when key term is fuzzily matched in "points" mode
  explanationOnlyPartialThreshold: 0.45, // explanation-only match threshold for partial credit
  majorityKeyTermsBonusRatio: 0.75, // if >= 75% key terms covered in explanation questions, lean toward credit

  // Fuzzy word & character matching tolerances
  shortWordMaxLength: 6, // words <= 6 chars allow Levenshtein distance <= 1
  shortWordMaxDistance: 1,
  longWordMaxDistance: 2, // words > 6 chars allow Levenshtein distance <= 2
  trigramDiceThreshold: 0.75, // character-trigram Dice >= 0.75 counts as word match

  // Keyword weighting inside each model point
  keyTermKeywordWeight: 2,
  explanationKeywordWeight: 1,
  questionEchoWeightMultiplier: 0.25, // downweight words repeated from the question stem
} as const;

/**
 * Editable medical & nursing abbreviation dictionary.
 * Expanded on BOTH the model points and student answer before tokenization.
 */
export const MEDICAL_ABBREVIATIONS: Record<string, string> = {
  bp: 'blood pressure',
  hr: 'heart rate',
  rr: 'respiratory rate',
  pr: 'pulse rate',
  temp: 'temperature',
  o2: 'oxygen',
  co2: 'carbon dioxide',
  spo2: 'oxygen saturation',
  abg: 'arterial blood gas',
  ckd: 'chronic kidney disease',
  aki: 'acute kidney injury',
  ans: 'autonomic nervous system',
  cns: 'central nervous system',
  pns: 'peripheral nervous system',
  sns: 'sympathetic nervous system',
  gi: 'gastrointestinal',
  uti: 'urinary tract infection',
  copd: 'chronic obstructive pulmonary disease',
  hb: 'hemoglobin',
  hgb: 'hemoglobin',
  rbc: 'red blood cell',
  wbc: 'white blood cell',
  bun: 'blood urea nitrogen',
  gfr: 'glomerular filtration rate',
  pct: 'proximal convoluted tubule',
  dct: 'distal convoluted tubule',
  adh: 'antidiuretic hormone',
  raas: 'renin angiotensin aldosterone system',
  nsaid: 'nonsteroidal anti inflammatory drug',
  nsaids: 'nonsteroidal anti inflammatory drug',
  iv: 'intravenous',
  im: 'intramuscular',
  sc: 'subcutaneous',
  subq: 'subcutaneous',
  mi: 'myocardial infarction',
  chf: 'congestive heart failure',
  ecg: 'electrocardiogram',
  ekg: 'electrocardiogram',
  csf: 'cerebrospinal fluid',
  frc: 'functional residual capacity',
  pft: 'pulmonary function test',
  who: 'world health organization',
  cpr: 'cardiopulmonary resuscitation',
  dm: 'diabetes mellitus',
  htn: 'hypertension',
  sob: 'shortness of breath',
};

/**
 * Common UK/US medical spelling pairs unified so both variants match identically.
 */
const SPELLING_EQUIVALENTS: Record<string, string> = {
  haemoglobin: 'hemoglobin',
  haemorrhage: 'hemorrhage',
  haemoptysis: 'hemoptysis',
  haematuria: 'hematuria',
  oedema: 'edema',
  anaemia: 'anemia',
  diarrhoea: 'diarrhea',
  dyspnoea: 'dyspnea',
  apnoea: 'apnea',
  oesophagus: 'esophagus',
  paediatric: 'pediatric',
  foetal: 'fetal',
  tumour: 'tumor',
  colour: 'color',
  centre: 'center',
  litre: 'liter',
};

const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'of',
  'in',
  'on',
  'at',
  'to',
  'for',
  'from',
  'by',
  'with',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'as',
  'such',
  'e',
  'g',
  'eg',
  'ie',
  'etc',
  'can',
  'may',
  'might',
  'also',
  'which',
  'who',
  'where',
  'when',
  'how',
  'what',
  'into',
  'through',
  'between',
  'during',
  'both',
  'each',
  'other',
  'some',
  'more',
  'most',
  'usually',
  'often',
  'called',
  'known',
  'they',
  'them',
  'their',
  'have',
  'has',
  'had',
  'will',
  'would',
  'very',
  'about',
  'than',
  'then',
  'there',
]);

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

const ARABIC_DIGIT_MAP: Record<string, string> = {
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
};

// ============================================================================
// STEP 1: NORMALIZATION, STEMMING & STRING SIMILARITY HELPERS
// ============================================================================

/**
 * Strips leading bullet symbols or numbering ("1)", "II.", "-", "•", "*").
 */
export function stripBulletsAndNumbering(text: string): string {
  return text
    .replace(/^\s*(?:\d+[.)]|[ivxIVX]+[.)]|[A-Za-z][.)]|[-•*▪◦])\s*/g, '')
    .trim();
}

/**
 * Normalizes raw text: converts Arabic/subscript digits, strips diacritics,
 * lowercases, unifies hyphens, removes punctuation, collapses spaces,
 * and expands medical abbreviations.
 */
export function normalizeWritingText(input: string): string {
  if (!input) return '';

  let text = stripBulletsAndNumbering(input)
    .replace(/[₀-₉]/g, (ch) => SUBSCRIPT_MAP[ch] ?? ch)
    .replace(/[٠-٩۰-۹]/g, (ch) => ARABIC_DIGIT_MAP[ch] ?? ch)
    // Strip Arabic diacritics & tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Arabic alef/taa forms
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
    .trim();

  // Unify hyphens and dashes ("fight-or-flight" -> "fight or flight")
  text = text.replace(/[\u2010-\u2015−–—/-]/g, ' ');

  // Strip punctuation while preserving alphanumeric, Arabic, spaces, %, +, <, >
  text = text.replace(/[^a-z0-9\u0600-\u06FF\s%+<>]/g, ' ');

  // Expand medical abbreviations & UK/US spelling variants word by word
  const rawWords = text.split(/\s+/).filter(Boolean);
  const expanded: string[] = [];

  for (const w of rawWords) {
    const unified = SPELLING_EQUIVALENTS[w] ?? w;
    const abbrExpansion = MEDICAL_ABBREVIATIONS[unified];
    if (abbrExpansion) {
      for (const part of abbrExpansion.split(/\s+/)) {
        expanded.push(SPELLING_EQUIVALENTS[part] ?? part);
      }
    } else {
      expanded.push(unified);
    }
  }

  return expanded.join(' ').trim();
}

/**
 * Light English stemmer: removes common inflectional/derivational endings
 * (ies->y, tion/tions, ing, ed, al, ly, es, s) and keeps singular/plural equal.
 */
export function stemWritingWord(word: string): string {
  if (word.length <= 3) return word;

  let w = word;
  if (w.endsWith('tions') && w.length > 6) {
    w = w.slice(0, -5) + 't';
  } else if (w.endsWith('tion') && w.length > 5) {
    w = w.slice(0, -4) + 't';
  } else if (w.endsWith('ies') && w.length > 4) {
    w = w.slice(0, -3) + 'y';
  } else if (w.endsWith('ing') && w.length > 5) {
    w = w.slice(0, -3);
  } else if (w.endsWith('ed') && w.length > 4) {
    w = w.slice(0, -2);
  } else if (w.endsWith('ly') && w.length > 4) {
    w = w.slice(0, -2);
  } else if (w.endsWith('al') && w.length > 4) {
    w = w.slice(0, -2);
  } else if (/(ches|shes|sses|xes|zes|oes)$/.test(w) && w.length > 4) {
    w = w.slice(0, -2);
  } else if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    w = w.slice(0, -1);
  }

  return w;
}

/**
 * Normalizes, removes English stopwords, and stems each remaining word.
 */
export function tokenizeWritingText(input: string): string[] {
  const normalized = normalizeWritingText(input);
  if (!normalized) return [];

  const tokens: string[] = [];
  for (const word of normalized.split(/\s+/)) {
    if (!word || STOPWORDS.has(word)) continue;
    const stemmed = stemWritingWord(word);
    if (stemmed && !STOPWORDS.has(stemmed)) {
      tokens.push(stemmed);
    }
  }
  return tokens;
}

/**
 * Classic Levenshtein distance for word-level typo forgiveness.
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);

  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }

  return prev[b.length];
}

/**
 * Character trigram Dice similarity (0..1) for typo & morphological tolerance.
 */
export function trigramDiceSimilarity(a: string, b: string): number {
  const s1 = a.trim();
  const s2 = b.trim();
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const buildTrigrams = (str: string): string[] => {
    const padded = str.length < 3 ? ` ${str} ` : str;
    const grams: string[] = [];
    for (let i = 0; i <= padded.length - 3; i++) {
      grams.push(padded.slice(i, i + 3));
    }
    return grams;
  };

  const g1 = buildTrigrams(s1);
  const g2 = buildTrigrams(s2);
  if (g1.length === 0 || g2.length === 0) return 0;

  const counts = new Map<string, number>();
  for (const g of g1) {
    counts.set(g, (counts.get(g) ?? 0) + 1);
  }

  let intersection = 0;
  for (const g of g2) {
    const count = counts.get(g) ?? 0;
    if (count > 0) {
      intersection++;
      counts.set(g, count - 1);
    }
  }

  return (2 * intersection) / (g1.length + g2.length);
}

/**
 * Checks whether a model keyword token matches a student token via:
 * 1) Exact stem match
 * 2) Levenshtein <= 1 (len <= 6) or <= 2 (len > 6)
 * 3) Character-trigram Dice >= 0.75
 * Pure numeric tokens require exact match so numbers like "36" and "38" don't collide.
 */
function isFuzzyTokenMatch(modelTok: string, studentTok: string): boolean {
  if (modelTok === studentTok) return true;

  const isNumericA = /^[0-9]+%?$/.test(modelTok);
  const isNumericB = /^[0-9]+%?$/.test(studentTok);
  if (isNumericA || isNumericB) return false;

  if (Math.min(modelTok.length, studentTok.length) < 3) return false;

  const maxLen = Math.max(modelTok.length, studentTok.length);
  const allowedDist =
    maxLen <= WRITING_GRADING_CONFIG.shortWordMaxLength
      ? WRITING_GRADING_CONFIG.shortWordMaxDistance
      : WRITING_GRADING_CONFIG.longWordMaxDistance;

  if (levenshteinDistance(modelTok, studentTok) <= allowedDist) {
    return true;
  }

  if (trigramDiceSimilarity(modelTok, studentTok) >= WRITING_GRADING_CONFIG.trigramDiceThreshold) {
    return true;
  }

  return false;
}

// ============================================================================
// STEP 2: EXTRACT KEY POINTS & KEY TERMS FROM MODEL ANSWER
// ============================================================================

export interface ExtractedModelPoint {
  displayPoint: string;
  keyTerm: string;
  explanation: string;
  keyTermTokens: string[];
  explanationTokens: string[];
  allTokens: string[];
}

/**
 * Normalizes raw model answer[] items:
 * - Skips pure empty structural labels (e.g. "Functions:")
 * - Merges short heading-only lines (e.g. "Inspiration") with the following explanation line.
 */
export function extractModelPoints(rawAnswerLines: string[]): ExtractedModelPoint[] {
  const cleanedLines = (rawAnswerLines ?? [])
    .map((line) => line.trim())
    .filter((line) => {
      const bare = stripBulletsAndNumbering(line).replace(/[:.]+$/, '').trim().toLowerCase();
      return bare.length > 0 && bare !== 'functions';
    });

  // Merge pure heading lines (short <=2 words without colon, followed by a full explanation sentence ending with a period)
  const mergedLines: string[] = [];
  for (let i = 0; i < cleanedLines.length; i++) {
    const current = cleanedLines[i];
    const next = cleanedLines[i + 1];
    const currentClean = stripBulletsAndNumbering(current);
    const nextClean = next ? stripBulletsAndNumbering(next) : '';
    const currentWordCount = currentClean.split(/\s+/).filter(Boolean).length;
    const nextWordCount = nextClean ? nextClean.split(/\s+/).filter(Boolean).length : 0;

    const looksLikePureHeading =
      Boolean(next) &&
      !currentClean.includes(':') &&
      !currentClean.includes(',') &&
      !currentClean.includes('(') &&
      !currentClean.endsWith('.') &&
      currentWordCount <= 2 &&
      nextWordCount >= 5 &&
      nextClean.endsWith('.');

    if (looksLikePureHeading && next) {
      mergedLines.push(`${currentClean}: ${next}`);
      i++; // Skip the consumed explanation line
    } else {
      mergedLines.push(current);
    }
  }

  return mergedLines.map((line) => {
    const cleanLine = stripBulletsAndNumbering(line);
    const colonMatch = cleanLine.match(/^([^:]{2,90}):\s*(.+)$/);

    let keyTerm = '';
    let explanation = '';

    if (colonMatch) {
      keyTerm = colonMatch[1].trim();
      explanation = colonMatch[2].trim();
    } else {
      // No colon: main noun phrase = leading 1–4 content words
      const normWords = normalizeWritingText(cleanLine)
        .split(/\s+/)
        .filter((w) => w && !STOPWORDS.has(w));
      const keyWordCount = Math.min(4, Math.max(1, normWords.length));
      keyTerm = normWords.slice(0, keyWordCount).join(' ');
      explanation = normWords.slice(keyWordCount).join(' ');
    }

    const keyTermTokens = Array.from(new Set(tokenizeWritingText(keyTerm)));
    const explanationTokens = Array.from(
      new Set(tokenizeWritingText(explanation).filter((t) => !keyTermTokens.includes(t)))
    );
    const allTokens = Array.from(new Set([...keyTermTokens, ...explanationTokens]));

    return {
      displayPoint: line,
      keyTerm: keyTerm || cleanLine,
      explanation,
      keyTermTokens,
      explanationTokens,
      allTokens,
    };
  });
}

// ============================================================================
// STEP 3, 4 & 5: STUDENT CHUNKING, MULTI-SIGNAL SIMILARITY & CREDIT GRADING
// ============================================================================

/**
 * Splits a student's free-text response into meaningful chunks by newline,
 * comma, Arabic comma, semicolon, bullets, periods (non-decimal), and "and" / "&".
 */
export function splitStudentAnswerChunks(studentAnswer: string): string[] {
  if (!studentAnswer || !studentAnswer.trim()) return [];

  const rawChunks = studentAnswer
    .split(/\n+|[,،;•▪◦]+|(?<!\d)\.(?!\d)|\s+\band\b\s+|\s*&\s*/i)
    .map((c) => stripBulletsAndNumbering(c).trim())
    .filter((c) => c.length > 0);

  return rawChunks.length > 0 ? rawChunks : [studentAnswer.trim()];
}

/**
 * Grades a single study/writing question completely offline using lenient,
 * order-independent, typo-tolerant matching.
 */
export function gradeWritingQuestion(
  question: ExamWritingQuestion,
  userAnswer: string,
  includeDebug = false
): WritingGradeResult {
  const questionType: 'points' | 'points_with_explanation' =
    question.type === 'points_with_explanation' ? 'points_with_explanation' : 'points';

  const extractedPoints = extractModelPoints(question.answer ?? []);
  const studentChunks = splitStudentAnswerChunks(userAnswer);
  const allStudentTokens = Array.from(new Set(tokenizeWritingText(userAnswer)));
  const normalizedFullStudent = normalizeWritingText(userAnswer);
  const questionTokens = new Set(tokenizeWritingText(question.question));

  const matchedStudentTokensSet = new Set<string>();

  if (extractedPoints.length === 0) {
    return {
      uid: question.uid,
      sheetId: question.sheetId,
      questionType,
      score: userAnswer.trim() ? 1 : 0,
      percentage: userAnswer.trim() ? 100 : 0,
      status: userAnswer.trim() ? 'correct' : 'wrong',
      matchedStudentTokens: [],
      points: [],
    };
  }

  // Empty student answer -> 0% immediately
  if (allStudentTokens.length === 0) {
    return {
      uid: question.uid,
      sheetId: question.sheetId,
      questionType,
      score: 0,
      percentage: 0,
      status: 'wrong',
      matchedStudentTokens: [],
      points: extractedPoints.map((pt) => ({
        point: pt.displayPoint,
        keyTerm: pt.keyTerm,
        similarity: 0,
        credit: 0,
        status: 'missing',
        matchedChunk: null,
        ...(includeDebug
          ? {
              debug: {
                keywordScore: 0,
                chunkScore: 0,
                keyTermScore: 0,
                explanationScore: 0,
                rawScore: 0,
                keyTermHit: false,
                questionType,
              },
            }
          : {}),
      })),
    };
  }

  const chunkEntries = studentChunks.map((raw) => ({
    raw,
    norm: normalizeWritingText(raw),
    tokens: Array.from(new Set(tokenizeWritingText(raw))),
  }));

  // Helper: find matched student tokens for a set of model tokens
  const evaluateTokenOverlap = (
    modelTokens: string[],
    studentTokens: string[],
    hasDistinctiveTokens: boolean
  ): {ratio: number; distinctiveMatched: number; matchedStudentToks: string[]} => {
    if (modelTokens.length === 0) {
      return {ratio: 0, distinctiveMatched: 0, matchedStudentToks: []};
    }

    let totalWeight = 0;
    let matchedWeight = 0;
    let distinctiveMatched = 0;
    const matchedStudentToks: string[] = [];

    for (const mt of modelTokens) {
      const weight =
        hasDistinctiveTokens && questionTokens.has(mt)
          ? WRITING_GRADING_CONFIG.questionEchoWeightMultiplier
          : 1;
      totalWeight += weight;

      const hit = studentTokens.find((st) => isFuzzyTokenMatch(mt, st));
      if (hit) {
        matchedWeight += weight;
        matchedStudentToks.push(hit);
        if (!questionTokens.has(mt)) {
          distinctiveMatched++;
        }
      }
    }

    return {
      ratio: totalWeight > 0 ? matchedWeight / totalWeight : 0,
      distinctiveMatched,
      matchedStudentToks,
    };
  };

  interface IntermediatePointEval {
    pt: ExtractedModelPoint;
    keywordScore: number;
    chunkScore: number;
    keyTermScore: number;
    explanationScore: number;
    rawScore: number;
    keyTermHit: boolean;
    bestChunk: string | null;
  }

  const intermediate: IntermediatePointEval[] = extractedPoints.map((pt) => {
    const hasDistinctive = pt.allTokens.some((t) => !questionTokens.has(t));

    // (a) Weighted keyword coverage across the entire student answer
    let totalKwWeight = 0;
    let matchedKwWeight = 0;
    let distinctiveHits = 0;

    for (const mt of pt.allTokens) {
      const isKey = pt.keyTermTokens.includes(mt);
      const baseWeight = isKey
        ? WRITING_GRADING_CONFIG.keyTermKeywordWeight
        : WRITING_GRADING_CONFIG.explanationKeywordWeight;
      const echoMult =
        hasDistinctive && questionTokens.has(mt)
          ? WRITING_GRADING_CONFIG.questionEchoWeightMultiplier
          : 1;
      const w = baseWeight * echoMult;
      totalKwWeight += w;

      const hit = allStudentTokens.find((st) => isFuzzyTokenMatch(mt, st));
      if (hit) {
        matchedKwWeight += w;
        matchedStudentTokensSet.add(hit);
        if (!questionTokens.has(mt)) {
          distinctiveHits++;
        }
      }
    }

    const keywordScore = totalKwWeight > 0 ? matchedKwWeight / totalKwWeight : 0;

    // (b) Best chunk similarity (order-independent token-set + trigram Dice)
    const normalizedPoint = normalizeWritingText(pt.displayPoint);
    let bestChunkScore = 0;
    let bestChunkRaw: string | null = null;

    const candidates =
      chunkEntries.length > 0
        ? chunkEntries
        : [{raw: userAnswer.trim(), norm: normalizedFullStudent, tokens: allStudentTokens}];

    for (const ch of candidates) {
      const overlap = evaluateTokenOverlap(pt.allTokens, ch.tokens, hasDistinctive);
      if (overlap.distinctiveMatched === 0 && hasDistinctive) {
        // Require at least one non-question content token match to claim a chunk matched
        continue;
      }

      // Order-independent token-set containment/Dice blend (lenient toward concise student chunks)
      const chunkDice =
        pt.allTokens.length + ch.tokens.length > 0
          ? (2 * overlap.distinctiveMatched) / (pt.allTokens.length + ch.tokens.length)
          : 0;
      const tokenSetSim = Math.max(overlap.ratio, 0.7 * overlap.ratio + 0.3 * chunkDice);
      const diceSim = trigramDiceSimilarity(normalizedPoint, ch.norm);
      const combinedChunk = Math.max(tokenSetSim, 0.65 * tokenSetSim + 0.35 * diceSim);

      if (combinedChunk > bestChunkScore) {
        bestChunkScore = combinedChunk;
        bestChunkRaw = ch.raw;
      }
    }

    // (c) Key-term hit signal
    const keyHasDistinctive = pt.keyTermTokens.some((t) => !questionTokens.has(t));
    const keyEval = evaluateTokenOverlap(pt.keyTermTokens, allStudentTokens, keyHasDistinctive);
    const keyTermDice = trigramDiceSimilarity(
      normalizeWritingText(pt.keyTerm),
      normalizedFullStudent
    );
    const keyTermScore = Math.max(keyEval.ratio, keyTermDice);
    const keyTermHit =
      keyEval.ratio >= WRITING_GRADING_CONFIG.keyTermHitMinRatio &&
      (!keyHasDistinctive || keyEval.distinctiveMatched > 0);

    // Explanation-only score (for points_with_explanation partial credit)
    const expHasDistinctive = pt.explanationTokens.some((t) => !questionTokens.has(t));
    const expEval = evaluateTokenOverlap(
      pt.explanationTokens,
      allStudentTokens,
      expHasDistinctive
    );
    const explanationScore =
      pt.explanationTokens.length > 0 ? expEval.ratio : keywordScore;

    // Require at least 1 distinctive hit if the point has distinctive words
    const gatedKeywordScore =
      hasDistinctive && distinctiveHits === 0 ? Math.min(keywordScore, 0.15) : keywordScore;
    const rawScore = Math.min(
      1,
      Math.max(
        gatedKeywordScore,
        bestChunkScore,
        keyTermHit ? WRITING_GRADING_CONFIG.keyTermHitFloor : 0
      )
    );

    // Pick best matching chunk even if rawScore came from full text / multi-chunk
    if (!bestChunkRaw && rawScore >= WRITING_GRADING_CONFIG.pointPartialThreshold) {
      bestChunkRaw = userAnswer.trim();
    }

    return {
      pt,
      keywordScore: gatedKeywordScore,
      chunkScore: bestChunkScore,
      keyTermScore,
      explanationScore,
      rawScore,
      keyTermHit,
      bestChunk: bestChunkRaw,
    };
  });

  // Check if most key terms were hit (for optional bonus on points_with_explanation)
  const keyTermHitsCount = intermediate.filter((item) => item.keyTermHit).length;
  const majorityKeyTermsHit =
    intermediate.length > 0 &&
    keyTermHitsCount / intermediate.length >= WRITING_GRADING_CONFIG.majorityKeyTermsBonusRatio;

  let totalCredit = 0;
  const pointFeedbacks: WritingPointFeedback[] = intermediate.map((item) => {
    let effectiveScore = item.rawScore;
    let credit = 0;
    let status: PointMatchStatus = 'missing';

    if (questionType === 'points_with_explanation') {
      const weightedScore =
        WRITING_GRADING_CONFIG.explanationTypeWeights.keyTerm * item.keyTermScore +
        WRITING_GRADING_CONFIG.explanationTypeWeights.explanation * item.explanationScore;
      effectiveScore = Math.min(1, weightedScore);

      // Step 5: Naming the key term earns FULL credit even without the explanation;
      // writing only the explanation without the key term earns PARTIAL credit (50%).
      if (
        item.keyTermHit ||
        effectiveScore >= WRITING_GRADING_CONFIG.pointFullThreshold ||
        (majorityKeyTermsHit && item.keyTermScore >= 0.5)
      ) {
        credit = WRITING_GRADING_CONFIG.pointFullCredit;
        status = 'covered';
        effectiveScore = Math.max(effectiveScore, item.keyTermHit ? 0.85 : effectiveScore);
      } else if (
        item.explanationScore >= WRITING_GRADING_CONFIG.explanationOnlyPartialThreshold ||
        effectiveScore >= WRITING_GRADING_CONFIG.pointPartialThreshold ||
        item.rawScore >= WRITING_GRADING_CONFIG.pointPartialThreshold
      ) {
        credit = WRITING_GRADING_CONFIG.pointPartialCredit;
        status = 'partial';
        effectiveScore = Math.max(effectiveScore, Math.min(0.6, item.rawScore));
      } else {
        credit = 0;
        status = 'missing';
      }
    } else {
      // Standard "points" question
      if (effectiveScore >= WRITING_GRADING_CONFIG.pointFullThreshold) {
        credit = WRITING_GRADING_CONFIG.pointFullCredit;
        status = 'covered';
      } else if (effectiveScore >= WRITING_GRADING_CONFIG.pointPartialThreshold) {
        credit = WRITING_GRADING_CONFIG.pointPartialCredit;
        status = 'partial';
      } else {
        credit = 0;
        status = 'missing';
      }
    }

    totalCredit += credit;

    return {
      point: item.pt.displayPoint,
      keyTerm: item.pt.keyTerm,
      similarity: Number(effectiveScore.toFixed(2)),
      credit,
      status,
      matchedChunk: status === 'missing' ? null : item.bestChunk,
      ...(includeDebug
        ? {
            debug: {
              keywordScore: Number(item.keywordScore.toFixed(2)),
              chunkScore: Number(item.chunkScore.toFixed(2)),
              keyTermScore: Number(item.keyTermScore.toFixed(2)),
              explanationScore: Number(item.explanationScore.toFixed(2)),
              rawScore: Number(item.rawScore.toFixed(2)),
              keyTermHit: item.keyTermHit,
              questionType,
            },
          }
        : {}),
    };
  });

  const finalScore = Math.min(1, totalCredit / extractedPoints.length);
  const percentage = Math.round(finalScore * 100);

  let status: WritingStatus = 'wrong';
  if (finalScore >= WRITING_GRADING_CONFIG.questionCorrectThreshold) {
    status = 'correct';
  } else if (finalScore >= WRITING_GRADING_CONFIG.questionPartialThreshold) {
    status = 'partial';
  }

  return {
    uid: question.uid,
    sheetId: question.sheetId,
    questionType,
    score: finalScore,
    percentage,
    status,
    matchedStudentTokens: Array.from(matchedStudentTokensSet),
    points: pointFeedbacks,
  };
}

/**
 * Splits a student's raw answer string into tokens/separators and marks words
 * whose normalized/stemmed form matched any model point, for soft highlighting.
 */
export function highlightMatchedStudentAnswer(
  rawAnswer: string,
  matchedTokens: string[]
): Array<{text: string; matched: boolean}> {
  if (!rawAnswer) return [];
  if (matchedTokens.length === 0) return [{text: rawAnswer, matched: false}];

  // Split preserving whitespace and punctuation segments
  const parts = rawAnswer.split(/([A-Za-z0-9\u0600-\u06FF'-]+)/g);
  return parts
    .filter((part) => part.length > 0)
    .map((part) => {
      if (!/[A-Za-z0-9\u0600-\u06FF]/.test(part)) {
        return {text: part, matched: false};
      }
      const partTokens = tokenizeWritingText(part);
      const isMatched = partTokens.some((pt) =>
        matchedTokens.some((mt) => isFuzzyTokenMatch(mt, pt))
      );
      return {text: part, matched: isMatched};
    });
}
