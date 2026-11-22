import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractModelPoints,
  gradeWritingQuestion,
  highlightMatchedStudentAnswer,
  normalizeWritingText,
  splitStudentAnswerChunks,
} from './writingGrading';
import type {ExamWritingQuestion} from '../types/exam';

function makeStudyQuestion(
  overrides: Partial<ExamWritingQuestion> & Pick<ExamWritingQuestion, 'question' | 'answer'>
): ExamWritingQuestion {
  return {
    uid: '01_vital-signs:study-test',
    id: 'study-test',
    sheetId: '01_vital-signs',
    sheetArabicTitle: 'العلامات الحيوية',
    sheetEnglishTitle: 'Vital Signs',
    type: 'points',
    ...overrides,
  };
}

test('1. Same points in a different order receive the exact same score as the correct order', () => {
  const q = makeStudyQuestion({
    question: 'What are the supplies needed to check vital signs?',
    answer: [
      'Stethoscope',
      'Blood pressure cuff',
      'Thermometer',
      'Pulse oximetry',
    ],
  });

  const ordered = gradeWritingQuestion(
    q,
    'Stethoscope, Blood pressure cuff, Thermometer, Pulse oximetry'
  );
  const reversed = gradeWritingQuestion(
    q,
    'Pulse oximetry\nThermometer; Blood pressure cuff and Stethoscope'
  );

  assert.equal(ordered.percentage, 100);
  assert.equal(reversed.percentage, 100);
  assert.equal(reversed.score, ordered.score);
  assert.equal(reversed.status, 'correct');
});

test('2. Spelling mistakes ("respiratry rate", "temprature") are forgiven and matched', () => {
  const q = makeStudyQuestion({
    question: 'List key vital signs.',
    answer: ['Respiratory rate', 'Temperature'],
  });

  const res = gradeWritingQuestion(q, 'respiratry rate and temprature');
  assert.equal(res.percentage, 100);
  assert.equal(res.status, 'correct');
  assert.equal(res.points[0].status, 'covered');
  assert.equal(res.points[1].status, 'covered');
  assert.ok(res.points[0].matchedChunk);
  assert.ok(res.points[1].matchedChunk);
});

test('3. Singular and plural differences ("kidneys" vs "kidney") match equally', () => {
  const q = makeStudyQuestion({
    question: 'Which organ filters blood?',
    answer: ['Kidney filtration'],
  });

  const res = gradeWritingQuestion(q, 'kidneys filtrations');
  assert.equal(res.percentage, 100);
  assert.equal(res.points[0].status, 'covered');
});

test('4. Medical abbreviations ("BP" vs "blood pressure", "HR", "RR", "CKD") match both ways', () => {
  const q1 = makeStudyQuestion({
    question: 'Name key cardiovascular vital signs.',
    answer: ['Blood pressure', 'Heart rate'],
  });
  const res1 = gradeWritingQuestion(q1, 'BP and HR');
  assert.equal(res1.percentage, 100);
  assert.equal(res1.points[0].status, 'covered');
  assert.equal(res1.points[1].status, 'covered');

  const q2 = makeStudyQuestion({
    question: 'What does CKD stand for and mean?',
    answer: ['CKD: progressive loss of kidney function'],
    type: 'points_with_explanation',
  });
  const res2 = gradeWritingQuestion(q2, 'chronic kidney disease');
  assert.equal(res2.percentage, 100);
  assert.equal(res2.points[0].status, 'covered');
});

test('5. Shorter answer with only key terms on a points_with_explanation question earns full credit', () => {
  const q = makeStudyQuestion({
    question: 'What are the fever patterns and what do they mean?',
    type: 'points_with_explanation',
    answer: [
      'Sustained: continuous high temperature.',
      'Intermittent: fluctuating up and down.',
      'Recurrent: disappearing and returning over time.',
      'Nocturnal: specifically spiking during the night-time.',
    ],
  });

  const res = gradeWritingQuestion(q, 'sustained, intermittent, recurrent, nocturnal');
  assert.equal(res.percentage, 100);
  assert.equal(res.status, 'correct');
  assert.ok(res.points.every((p) => p.status === 'covered'));
});

test('6. Explanation-only match without key term in points_with_explanation earns partial credit', () => {
  const q = makeStudyQuestion({
    question: 'Describe drug classes.',
    type: 'points_with_explanation',
    answer: [
      'Decongestants: Phenylephrine reduces nasal mucosal swelling',
    ],
  });

  const res = gradeWritingQuestion(q, 'Phenylephrine reduces nasal mucosal swelling');
  assert.equal(res.points[0].status, 'partial');
  assert.equal(res.points[0].credit, 0.5);
  assert.equal(res.percentage, 50);
  assert.equal(res.status, 'partial');
});

test('7. Vaguely related answer sharing about half of the keywords earns ~50% (partial)', () => {
  const q = makeStudyQuestion({
    question: 'Describe chest physiotherapy steps.',
    type: 'points',
    answer: [
      'Deep breathing coughing postural drainage percussion',
    ],
  });

  const res = gradeWritingQuestion(q, 'deep breathing exercises');
  assert.equal(res.points[0].status, 'partial');
  assert.equal(res.percentage, 50);
  assert.equal(res.status, 'partial');
});

test('8. Completely unrelated answer and empty answer both score 0%', () => {
  const q = makeStudyQuestion({
    question: 'What are the two stages of respiration?',
    type: 'points_with_explanation',
    answer: [
      'Inspiration: taking air rich in O2 into lungs.',
      'Expiration: giving out CO2 to atmosphere.',
    ],
  });

  const unrelated = gradeWritingQuestion(
    q,
    'Glomerulonephritis causes kidney inflammation and hematuria.'
  );
  assert.equal(unrelated.percentage, 0);
  assert.equal(unrelated.status, 'wrong');
  assert.ok(unrelated.points.every((p) => p.status === 'missing' && p.matchedChunk === null));

  const empty = gradeWritingQuestion(q, '   ');
  assert.equal(empty.percentage, 0);
  assert.equal(empty.status, 'wrong');
  assert.ok(empty.points.every((p) => p.status === 'missing' && p.matchedChunk === null));
});

test('9. Pure heading lines merge cleanly with following explanation lines and normalization handles hyphens/Arabic digits', () => {
  const extracted = extractModelPoints([
    'Functions:',
    'Inspiration',
    'Process of taking air rich in O2 from atmosphere.',
    'Expiration',
    'Process of giving out CO2 from lungs.',
  ]);

  assert.equal(extracted.length, 2);
  assert.equal(extracted[0].keyTerm, 'Inspiration');
  assert.equal(extracted[1].keyTerm, 'Expiration');

  assert.equal(normalizeWritingText('fight-or-flight ٣٧'), 'fight or flight 37');
  assert.deepEqual(splitStudentAnswerChunks('BP, HR; temperature and RR\nO2'), [
    'BP',
    'HR',
    'temperature',
    'RR',
    'O2',
  ]);
});

test('10. Debug mode attaches point debug metadata and matched word highlighting catches typos & abbreviations', () => {
  const q = makeStudyQuestion({
    question: 'List vital signs.',
    answer: ['Blood pressure', 'Temperature'],
  });

  const res = gradeWritingQuestion(q, 'BP and temprature are normal', true);
  assert.ok(res.points[0].debug);
  assert.equal(res.points[0].debug?.questionType, 'points');

  const highlighted = highlightMatchedStudentAnswer(
    'BP and temprature are normal',
    res.matchedStudentTokens
  );
  const matchedWords = highlighted.filter((h) => h.matched).map((h) => h.text.toLowerCase());
  assert.ok(matchedWords.includes('bp'));
  assert.ok(matchedWords.includes('temprature'));
});
