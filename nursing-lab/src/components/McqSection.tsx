import React, {useMemo, useState} from 'react';
import {ArrowLeft, Check, Filter, SkipForward, X} from 'lucide-react';
import type {ExamMcqQuestion, McqGradeResult} from '../types/exam';

interface McqSectionProps {
  questions: ExamMcqQuestion[];
  answers: Record<string, 'A' | 'B' | 'C' | 'D' | null>;
  skippedUids: Set<string>;
  isGraded: boolean;
  gradeResults: McqGradeResult[];
  hasNextWriting: boolean;
  onSelectOption: (uid: string, originalKey: 'A' | 'B' | 'C' | 'D') => void;
  onSkipQuestion: (uid: string) => void;
  onGrade: () => void;
  onNextSection: () => void;
}

export const McqSection: React.FC<McqSectionProps> = ({
  questions,
  answers,
  skippedUids,
  isGraded,
  gradeResults,
  hasNextWriting,
  onSelectOption,
  onSkipQuestion,
  onGrade,
  onNextSection,
}) => {
  const [showWrongOnly, setShowWrongOnly] = useState(false);

  const gradeMap = useMemo(
    () => new Map(gradeResults.map((r) => [r.uid, r])),
    [gradeResults]
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => Boolean(answers[q.uid])).length,
    [questions, answers]
  );

  const partSummary = useMemo(() => {
    if (!isGraded) return null;
    const earned = gradeResults.reduce((s, r) => s + r.score, 0);
    const total = questions.length;
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    return {earned, total, pct};
  }, [isGraded, gradeResults, questions.length]);

  const wrongCount = useMemo(() => {
    if (!isGraded) return 0;
    return questions.filter((q) => !gradeMap.get(q.uid)?.isCorrect).length;
  }, [questions, isGraded, gradeMap]);

  const visibleQuestions = useMemo(() => {
    if (!isGraded || !showWrongOnly) return questions;
    return questions.filter((q) => !gradeMap.get(q.uid)?.isCorrect);
  }, [questions, isGraded, showWrongOnly, gradeMap]);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 animate-screen-enter">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[var(--accent)]">القسم الثاني</p>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
            الاختيار من متعدد (MCQ)
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
          <span>تمت الإجابة:</span>
          <span dir="ltr" className="inline-block tabular-nums font-medium">
            {answeredCount} / {questions.length}
          </span>
        </div>
      </div>

      {isGraded && partSummary && (
        <section
          aria-live="polite"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
        >
          <div className="space-y-0.5">
            <p className="text-[12px] text-[var(--text-muted)]">نتيجة قسم الاختيار من متعدد</p>
            <p className="text-[17px] font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <span dir="ltr" className="inline-block tabular-nums">
                {partSummary.earned} / {partSummary.total}
              </span>
              <span className="text-[14px] font-medium text-[var(--accent)] tabular-nums">
                ({partSummary.pct}%)
              </span>
            </p>
          </div>

          {wrongCount > 0 && (
            <button
              type="button"
              onClick={() => setShowWrongOnly((prev) => !prev)}
              aria-pressed={showWrongOnly}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border px-3.5 py-2 text-[12px] font-medium transition-colors ${
                showWrongOnly
                  ? 'border-[var(--error)] bg-[var(--error-soft)] text-[var(--error)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {showWrongOnly ? 'عرض جميع الأسئلة' : `الأخطاء فقط (${wrongCount})`}
              </span>
            </button>
          )}
        </section>
      )}

      {visibleQuestions.length === 0 && isGraded ? (
        <div className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center text-[14px] text-[var(--success)]">
          ممتاز! جميع إجاباتك في هذا القسم صحيحة.
        </div>
      ) : (
        <ol className="space-y-4">
          {visibleQuestions.map((q) => {
            const globalIndex = questions.findIndex((item) => item.uid === q.uid);
            const selectedKey = answers[q.uid] ?? null;
            const grade = gradeMap.get(q.uid);
            const isSkipped = skippedUids.has(q.uid) && !selectedKey;

            return (
              <li
                key={q.uid}
                className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4 sm:p-5"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] tabular-nums">
                    <span dir="ltr" className="inline-block font-semibold text-[var(--accent)] tabular-nums">
                      {globalIndex + 1}/{questions.length}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{q.sheetArabicTitle}</span>
                    {isSkipped && !isGraded && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-[var(--amber)]">تم التخطي</span>
                      </>
                    )}
                  </div>

                  {!isGraded && (
                    <button
                      type="button"
                      onClick={() => onSkipQuestion(q.uid)}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-[14px] px-2.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      aria-label={`تخطي السؤال ${globalIndex + 1}`}
                    >
                      <span>تخطي</span>
                      <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}

                  {isGraded && grade && (
                    <span
                      className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                        grade.isCorrect ? 'text-[var(--success)]' : 'text-[var(--error)]'
                      }`}
                    >
                      {grade.isCorrect ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>صحيح</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span>{selectedKey ? 'خطأ' : 'لم يُجب'}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                <p dir="ltr" className="font-en mb-4 text-[15px] font-medium leading-[1.6] text-[var(--text-primary)]">
                  {q.question}
                </p>

                <div dir="ltr" className="font-en space-y-2" role="radiogroup" aria-label={`Question ${globalIndex + 1} options`}>
                  {q.shuffledOptions.map((opt) => {
                    const isSelected = selectedKey === opt.originalKey;
                    const isCorrectOption = opt.originalKey === q.answer;

                    let optionStyle =
                      'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] hover:border-[var(--accent)]/60';

                    if (!isGraded && isSelected) {
                      optionStyle =
                        'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--text-primary)]';
                    } else if (isGraded) {
                      if (isCorrectOption) {
                        optionStyle =
                          'border-[var(--success)] bg-[var(--success-soft)] text-[var(--text-primary)]';
                      } else if (isSelected && !isCorrectOption) {
                        optionStyle =
                          'border-[var(--error)] bg-[var(--error-soft)] text-[var(--text-primary)]';
                      } else {
                        optionStyle =
                          'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] opacity-75';
                      }
                    }

                    return (
                      <button
                        key={opt.originalKey}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        disabled={isGraded}
                        onClick={() => onSelectOption(q.uid, opt.originalKey)}
                        className={`flex w-full min-h-[46px] items-center justify-between gap-3 rounded-[14px] border px-3.5 py-2.5 text-left text-[14px] transition-all duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${optionStyle}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[12px] font-semibold ${
                              isSelected && !isGraded
                                ? 'border-[var(--accent)] bg-[var(--accent)] text-white'
                                : isGraded && isCorrectOption
                                  ? 'border-[var(--success)] bg-[var(--success)] text-white'
                                  : isGraded && isSelected && !isCorrectOption
                                    ? 'border-[var(--error)] bg-[var(--error)] text-white'
                                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)]'
                            }`}
                          >
                            {opt.displayLabel}
                          </span>
                          <span className="leading-[1.5]">{opt.text}</span>
                        </div>

                        {isGraded && isCorrectOption && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--success)] shrink-0">
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Correct</span>
                          </span>
                        )}
                        {isGraded && isSelected && !isCorrectOption && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--error)] shrink-0">
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Your choice</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          {!isGraded ? (
            <button
              type="button"
              onClick={onGrade}
              className="w-full min-h-[48px] rounded-[14px] bg-[var(--accent)] px-5 py-3 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              تصحيح ومراجعة
            </button>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--text-secondary)] tabular-nums shrink-0">
                <span dir="ltr" className="inline-block">
                  {partSummary?.earned} / {partSummary?.total}
                </span>
                <span>({partSummary?.pct}%)</span>
              </div>
              <button
                type="button"
                onClick={onNextSection}
                className="flex-1 sm:flex-initial inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <span>
                  {hasNextWriting ? 'الانتقال إلى الأسئلة الكتابية' : 'عرض النتيجة النهائية'}
                </span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
