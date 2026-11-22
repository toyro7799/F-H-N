import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeExamSummary,
  gradeFillInQuestion,
  gradeMcqQuestion,
  gradeSingleBlank,
  gradeWritingQuestion,
  levenshtein,
  normalizeFillInText,
} from './grading';
import {buildExamFromSheets} from './questionSelection';
import type {ExamFillInQuestion, ExamWritingQuestion, LoadedSheet} from '../types/exam';

test('normalizeFillInText handles punctuation, articles, hyphens, subscripts, and Arabic diacritics', () => {
  assert.equal(normalizeFillInText('  The Warm-Blooded! '), 'warm blooded');
  assert.equal(normalizeFillInText('O₂'), 'o2');
  assert.equal(normalizeFillInText('المُخَاطُ'), 'المخاط');
  assert.equal(normalizeFillInText('an artery.'), 'artery');
});

test('levenshtein calculates edit distances accurately', () => {
  assert.equal(levenshtein('kitten', 'sitting'), 3);
  assert.equal(levenshtein('vital', 'vitl'), 1);
});

test('gradeSingleBlank allows minor typos, singular/plural, and blocks wrong numbers', () => {
  // Exact and article/hyphen normalization
  assert.equal(gradeSingleBlank('warm blooded', ['warm-blooded']), true);
  assert.equal(gradeSingleBlank('a hypothalamus', ['hypothalamus']), true);

  // Singular / plural tolerance
  assert.equal(gradeSingleBlank('disease', ['diseases']), true);
  assert.equal(gradeSingleBlank('arteries', ['artery']), true);

  // Typo tolerance: <=1 for <8 chars, <=2 for >=8 chars
  assert.equal(gradeSingleBlank('vitl', ['vital']), true);
  assert.equal(gradeSingleBlank('vxzz', ['vital']), false);
  assert.equal(gradeSingleBlank('hypothalmus', ['hypothalamus']), true);
  assert.equal(gradeSingleBlank('hypotlamus', ['hypothalamus']), true);

  // Numeric answers must not fuzzy-match different numbers
  assert.equal(gradeSingleBlank('20', ['30']), false);
  assert.equal(gradeSingleBlank('30', ['30']), true);
});

test('gradeFillInQuestion awards partial credit for multi-blank questions', () => {
  const q: ExamFillInQuestion = {
    uid: '03:fib-5',
    id: 'fib-5',
    sheetId: '03_respiration',
    sheetArabicTitle: 'فسيولوجيا التنفس',
    sheetEnglishTitle: 'Physiology of Respiration',
    question: 'Between ________ and ________ fissures.',
    answer: 'oblique; transverse',
    accepted_answers: ['oblique; transverse'],
    blanksCount: 2,
    segments: ['Between ', ' and ', ' fissures.'],
    expectedPerBlank: [['oblique'], ['transverse']],
    displayAnswersPerBlank: ['oblique', 'transverse'],
  };

  const partial = gradeFillInQuestion(q, ['oblique', 'wrong']);
  assert.equal(partial.score, 0.5);
  assert.equal(partial.isFullyCorrect, false);
  assert.equal(partial.blanks[0].isCorrect, true);
  assert.equal(partial.blanks[1].isCorrect, false);

  const full = gradeFillInQuestion(q, ['oblique', 'transvers']); // 1 typo on >=8 chars
  assert.equal(full.score, 1);
  assert.equal(full.isFullyCorrect, true);
});

test('gradeWritingQuestion matches concise keyword answers regardless of order or extra words', () => {
  const q: ExamWritingQuestion = {
    uid: '01:study-5',
    id: 'study-5',
    sheetId: '01_vital-signs',
    sheetArabicTitle: 'العلامات الحيوية',
    sheetEnglishTitle: 'Vital Signs',
    question: 'What are the two main categories of pain?',
    answer: ['Acute pain', 'Chronic pain'],
  };

  // Concise reversed order with extra filler words -> should still score 100%
  const good = gradeWritingQuestion(
    q,
    'In nursing assessment there are chronic pain and also acute pain types.'
  );
  assert.equal(good.status, 'correct');
  assert.equal(good.percentage, 100);
  assert.equal(good.points[0].status, 'covered');
  assert.equal(good.points[1].status, 'covered');

  // Missing one point -> 50% (partial)
  const half = gradeWritingQuestion(q, 'Only acute pain is mentioned here.');
  assert.equal(half.status, 'partial');
  assert.equal(half.percentage, 50);

  // Empty or irrelevant -> wrong
  const bad = gradeWritingQuestion(q, 'blood pressure cuff');
  assert.equal(bad.status, 'wrong');
  assert.equal(bad.percentage, 0);
});

test('computeExamSummary calculates weighted /100 total and identifies strongest/weakest sheets', () => {
  const makeSheet = (idx: number): LoadedSheet => ({
    exam_id: idx,
    slug: `s${idx}`,
    title: `Sheet ${idx}`,
    sheetId: `0${idx}_s${idx}`,
    sheetNumber: idx,
    arabicTitle: `شيت ${idx}`,
    englishTitle: `Sheet ${idx}`,
    multiple_choice: Array.from({length: 10}, (_, i) => ({
      id: `m-${i}`,
      question: `Q${i}`,
      options: {A: 'a', B: 'b', C: 'c', D: 'd'},
      answer: 'A',
      answer_text: 'a',
    })),
    fill_in_the_blank: Array.from({length: 10}, (_, i) => ({
      id: `f-${i}`,
      question: `Blank ________ ${i}`,
      answer: 'yes',
      accepted_answers: ['yes'],
    })),
    study_questions: Array.from({length: 10}, (_, i) => ({
      id: `st-${i}`,
      question: `Study ${i}`,
      answer: ['oxygen', 'carbon dioxide'],
    })),
  });

  const exam = buildExamFromSheets([makeSheet(1), makeSheet(2)], ['01_s1', '02_s2']);
  // Answer sheet 1 correctly and sheet 2 wrongly
  const fibGrades = exam.fillIn.map((q) =>
    gradeFillInQuestion(q, q.sheetId === '01_s1' ? ['yes'] : ['no'])
  );
  const mcqGrades = exam.mcq.map((q) =>
    gradeMcqQuestion(q, q.sheetId === '01_s1' ? 'A' : 'B')
  );
  const writingGrades = exam.writing.map((q) =>
    gradeWritingQuestion(q, q.sheetId === '01_s1' ? 'oxygen carbon dioxide' : '')
  );

  const summary = computeExamSummary(exam, fibGrades, mcqGrades, writingGrades);
  assert.ok(summary.totalScore > 0 && summary.totalScore < 100);
  assert.equal(summary.strongestSheet?.sheetId, '01_s1');
  assert.equal(summary.weakestSheet?.sheetId, '02_s2');
});
