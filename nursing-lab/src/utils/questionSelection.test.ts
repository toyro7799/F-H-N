import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildExamFromSheets,
  buildRetryWrongExam,
  getQuestionCounts,
  parseFillInExpectedAnswers,
  splitBlankSegments,
} from './questionSelection';
import type {LoadedSheet} from '../types/exam';

function createMockSheet(idx: number, count = 20): LoadedSheet {
  const sheetId = `0${idx}_sheet-${idx}`;
  return {
    exam_id: idx,
    slug: `sheet-${idx}`,
    title: `Sheet ${idx}`,
    sheetId,
    sheetNumber: idx,
    arabicTitle: `شيت ${idx}`,
    englishTitle: `Sheet ${idx}`,
    multiple_choice: Array.from({length: count}, (_, i) => ({
      id: `mcq-${i + 1}`,
      question: `S${idx} MCQ ${i + 1}`,
      options: {A: 'Opt A', B: 'Opt B', C: 'Opt C', D: 'Opt D'},
      answer: 'B',
      answer_text: 'Opt B',
    })),
    fill_in_the_blank: Array.from({length: count}, (_, i) => ({
      id: `fib-${i + 1}`,
      question:
        i === 0
          ? `S${idx} dual ________ and ________ blank`
          : `S${idx} single ________ blank ${i + 1}`,
      answer: i === 0 ? `alpha${idx}; beta${idx}` : `ans-${idx}-${i + 1}`,
      accepted_answers: [i === 0 ? `alpha${idx}; beta${idx}` : `ans-${idx}-${i + 1}`],
    })),
    study_questions: Array.from({length: count}, (_, i) => ({
      id: `study-${i + 1}`,
      question: `S${idx} Study ${i + 1}`,
      answer: ['First key point', 'Second key point'],
    })),
  };
}

test('getQuestionCounts returns 10/5/4 for 1-4 sheets and 15/10/8 for 5-10 sheets', () => {
  assert.deepEqual(getQuestionCounts(1), {fillIn: 10, mcq: 5, writing: 4});
  assert.deepEqual(getQuestionCounts(4), {fillIn: 10, mcq: 5, writing: 4});
  assert.deepEqual(getQuestionCounts(5), {fillIn: 15, mcq: 10, writing: 8});
  assert.deepEqual(getQuestionCounts(10), {fillIn: 15, mcq: 10, writing: 8});
});

test('splitBlankSegments handles 8 and 10 underscores', () => {
  const single = splitBlankSegments('Body temperature is ________ °C.');
  assert.equal(single.blanksCount, 1);
  assert.equal(single.segments.length, 2);

  const dual = splitBlankSegments('Both __________ and __________ are needed.');
  assert.equal(dual.blanksCount, 2);
  assert.equal(dual.segments.length, 3);
});

test('parseFillInExpectedAnswers splits multi-blank ; and parenthetical variants', () => {
  const dual = parseFillInExpectedAnswers(
    {
      id: 'fib-1',
      question: 'A ________ B ________',
      answer: 'PCT (Proximal convoluted tubules); DCT (Distal convoluted tubules)',
      accepted_answers: ['PCT (Proximal convoluted tubules); DCT (Distal convoluted tubules)'],
    },
    2
  );
  assert.equal(dual.displayAnswersPerBlank.length, 2);
  assert.ok(dual.expectedPerBlank[0].includes('PCT'));
  assert.ok(dual.expectedPerBlank[0].includes('Proximal convoluted tubules'));
  assert.ok(dual.expectedPerBlank[1].includes('DCT'));

  const slashDual = parseFillInExpectedAnswers(
    {
      id: 'fib-5',
      question: 'Check ________ and ________ administration.',
      answer: 'before / after',
      accepted_answers: ['before / after'],
    },
    2
  );
  assert.deepEqual(slashDual.displayAnswersPerBlank, ['before', 'after']);
});

test('buildExamFromSheets balances questions across selected sheets with no repeats and valid Answer Bank', () => {
  const sheets = [1, 2, 3, 4, 5].map((i) => createMockSheet(i, 20));
  const exam = buildExamFromSheets(
    sheets,
    ['01_sheet-1', '02_sheet-2', '03_sheet-3'],
    () => 0.42
  );

  assert.equal(exam.fillIn.length, 10);
  assert.equal(exam.mcq.length, 5);
  assert.equal(exam.writing.length, 4);

  // Zero duplicates
  assert.equal(new Set(exam.fillIn.map((q) => q.uid)).size, 10);
  assert.equal(new Set(exam.mcq.map((q) => q.uid)).size, 5);
  assert.equal(new Set(exam.writing.map((q) => q.uid)).size, 4);

  // Balanced distribution across 3 sheets for 10 FIB: 4, 3, 3
  const fibPerSheet = new Map<string, number>();
  for (const q of exam.fillIn) {
    fibPerSheet.set(q.sheetId, (fibPerSheet.get(q.sheetId) ?? 0) + 1);
  }
  const counts = Array.from(fibPerSheet.values()).sort();
  assert.deepEqual(counts, [3, 3, 4]);

  // Answer bank has total chip count equal to sum of displayAnswersPerBlank
  const expectedBankCount = exam.fillIn.reduce(
    (sum, q) => sum + q.displayAnswersPerBlank.length,
    0
  );
  assert.equal(exam.answerBank.length, expectedBankCount);

  // MCQ shuffled options preserve originalKey B mapping to Opt B
  for (const q of exam.mcq) {
    const correctOpt = q.shuffledOptions.find((o) => o.originalKey === q.answer);
    assert.ok(correctOpt);
    assert.equal(correctOpt.text, 'Opt B');
  }
});

test('buildRetryWrongExam keeps only wrong questions and rebuilds Answer Bank', () => {
  const sheets = [createMockSheet(1, 15)];
  const exam = buildExamFromSheets(sheets, ['01_sheet-1']);
  const wrongFib = new Set([exam.fillIn[0].uid, exam.fillIn[1].uid]);
  const wrongMcq = new Set([exam.mcq[0].uid]);
  const wrongWriting = new Set<string>();

  const retry = buildRetryWrongExam(exam, wrongFib, wrongMcq, wrongWriting);
  assert.equal(retry.isRetryWrongOnly, true);
  assert.equal(retry.fillIn.length, 2);
  assert.equal(retry.mcq.length, 1);
  assert.equal(retry.writing.length, 0);
  assert.equal(
    retry.answerBank.length,
    retry.fillIn.reduce((s, q) => s + q.displayAnswersPerBlank.length, 0)
  );
});
