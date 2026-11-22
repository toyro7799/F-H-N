import React, {useMemo, useRef, useState} from 'react';
import {ArrowLeft, Check, EyeOff, Filter, SkipForward, X} from 'lucide-react';
import type {ExamFillInQuestion, FillInGradeResult} from '../types/exam';

interface FillInBlankSectionProps {
  questions: ExamFillInQuestion[];
  answerBank: string[];
  answers: Record<string, string[]>;
  skippedUids: Set<string>;
  isGraded: boolean;
  gradeResults: FillInGradeResult[];
  hasNextMcq: boolean;
  hasNextWriting: boolean;
  onChangeBlank: (uid: string, blankIndex: number, value: string) => void;
  onSkipQuestion: (uid: string) => void;
  onGrade: () => void;
  onNextSection: () => void;
}

export const FillInBlankSection: React.FC<FillInBlankSectionProps> = ({
  questions,
  answerBank,
  answers,
  skippedUids,
  isGraded,
  gradeResults,
  hasNextMcq,
  hasNextWriting,
  onChangeBlank,
  onSkipQuestion,
  onGrade,
  onNextSection,
}) => {
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [showBank, setShowBank] = useState(true);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const gradeMap = useMemo(
    () => new Map(gradeResults.map((r) => [r.uid, r])),
    [gradeResults]
  );

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const vals = answers[q.uid] ?? [];
      return vals.some((v) => v.trim().length > 0);
    }).length;
  }, [questions, answers]);

  const partSummary = useMemo(() => {
    if (!isGraded) return null;
    const earned = gradeResults.reduce((sum, r) => sum + r.score, 0);
    const total = questions.length;
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    return {earned: Number(earned.toFixed(1)), total, pct};
  }, [isGraded, gradeResults, questions.length]);

  const visibleQuestions = useMemo(() => {
    if (!isGraded || !showWrongOnly) return questions;
    return questions.filter((q) => !gradeMap.get(q.uid)?.isFullyCorrect);
  }, [questions, isGraded, showWrongOnly, gradeMap]);

  const wrongCount = useMemo(() => {
    if (!isGraded) return 0;
    return questions.filter((q) => !gradeMap.get(q.uid)?.isFullyCorrect).length;
  }, [questions, isGraded, gradeMap]);

  const handleSkip = (uid: string, idx: number) => {
    onSkipQuestion(uid);
    const nextQ = visibleQuestions[idx + 1];
    if (nextQ) {
      const nextInput = inputRefs.current[`${nextQ.uid}-0`];
      nextInput?.focus();
    }
  };

  const nextLabel = hasNextMcq
    ? 'الانتقال إلى أسئلة MCQ'
    : hasNextWriting
      ? 'الانتقال إلى الأسئلة الكتابية'
      : 'عرض النتيجة النهائية';

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 animate-screen-enter">
      {/* Section Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[var(--accent)]">القسم الأول</p>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
            أكمل الفراغ (Fill in the Blank)
          </h1>
        </div>
        <div className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
          <span>تمت الإجابة:</span>
          <span dir="ltr" className="inline-block tabular-nums font-medium">
            {answeredCount} / {questions.length}
          </span>
        </div>
      </div>

      {/* Answer Bank */}
      <section
        aria-label="بنك الإجابات"
        className="mb-6 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">
              بنك الإجابات (Answer Bank)
            </h2>
            <p className="text-[12px] text-[var(--text-muted)]">
              للاستعانة فقط — مرتبة عشوائياً ولا تشير إلى رقم السؤال
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowBank((prev) => !prev)}
            aria-expanded={showBank}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-[14px] px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {showBank ? (
              <>
                <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إخفاء</span>
              </>
            ) : (
              <span>إظهار ({answerBank.length})</span>
            )}
          </button>
        </div>

        {showBank && (
          <div
            dir="ltr"
            className="font-en flex flex-wrap gap-2 pt-1"
            aria-label="قائمة الإجابات المقترحة"
          >
            {answerBank.map((chip, idx) => (
              <span
                key={`${chip}-${idx}`}
                className="inline-flex items-center rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-2.5 py-1 text-[13px] text-[var(--text-primary)]"
              >
                {chip}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Graded Part Score Banner & Wrong-only Filter */}
      {isGraded && partSummary && (
        <section
          aria-live="polite"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
        >
          <div className="space-y-0.5">
            <p className="text-[12px] text-[var(--text-muted)]">نتيجة قسم أكمل الفراغ</p>
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
                {showWrongOnly
                  ? 'عرض جميع الأسئلة'
                  : `الأخطاء فقط (${wrongCount})`}
              </span>
            </button>
          )}
        </section>
      )}

      {/* Questions List */}
      {visibleQuestions.length === 0 && isGraded ? (
        <div className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center text-[14px] text-[var(--success)]">
          ممتاز! جميع إجاباتك في هذا القسم صحيحة.
        </div>
      ) : (
        <ol className="space-y-4">
          {visibleQuestions.map((q, qIdx) => {
            const globalIndex = questions.findIndex((item) => item.uid === q.uid);
            const userVals = answers[q.uid] ?? Array(q.blanksCount).fill('');
            const grade = gradeMap.get(q.uid);
            const isSkipped = skippedUids.has(q.uid) && userVals.every((v) => !v.trim());

            const cardBorder = isGraded
              ? grade?.isFullyCorrect
                ? 'border-[var(--success)]/60 bg-[var(--success-soft)]/35'
                : 'border-[var(--error)]/60 bg-[var(--error-soft)]/35'
              : 'border-[var(--border-hairline)] bg-[var(--bg-surface)]';

            return (
              <li
                key={q.uid}
                className={`rounded-[14px] border p-4 sm:p-5 transition-colors ${cardBorder}`}
              >
                {/* Question metadata */}
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
                      onClick={() => handleSkip(q.uid, qIdx)}
                      className="inline-flex min-h-[44px] items-center gap-1 rounded-[14px] px-2.5 text-[12px] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      aria-label={`تخطي السؤال ${globalIndex + 1}`}
                    >
                      <span>تخطي</span>
                      <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}

                  {isGraded && grade && (
                    <span
                      className={`inline-flex items-center gap-1 text-[12px] font-semibold ${
                        grade.isFullyCorrect
                          ? 'text-[var(--success)]'
                          : 'text-[var(--error)]'
                      }`}
                    >
                      {grade.isFullyCorrect ? (
                        <>
                          <Check className="h-4 w-4" aria-hidden="true" />
                          <span>صحيح</span>
                        </>
                      ) : (
                        <>
                          <X className="h-4 w-4" aria-hidden="true" />
                          <span>
                            {grade.score > 0 ? 'صحيح جزئياً' : 'خطأ'}
                          </span>
                        </>
                      )}
                    </span>
                  )}
                </div>

                {/* LTR English sentence with inline inputs */}
                <div
                  dir="ltr"
                  className="font-en text-[15px] leading-[1.9] text-[var(--text-primary)]"
                >
                  {q.segments.map((seg, segIdx) => {
                    const isBlankAfter = segIdx < q.blanksCount;
                    const blankVal = userVals[segIdx] ?? '';
                    const blankGrade = grade?.blanks[segIdx];

                    const inputStyle = isGraded
                      ? blankGrade?.isCorrect
                        ? 'border-[var(--success)] bg-[var(--success-soft)] text-[var(--text-primary)]'
                        : 'border-[var(--error)] bg-[var(--error-soft)] text-[var(--text-primary)]'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-primary)] focus:border-[var(--accent)]';

                    return (
                      <React.Fragment key={segIdx}>
                        <span>{seg}</span>
                        {isBlankAfter && (
                          <input
                            ref={(el) => {
                              inputRefs.current[`${q.uid}-${segIdx}`] = el;
                            }}
                            type="text"
                            dir="ltr"
                            disabled={isGraded}
                            value={blankVal}
                            onChange={(e) => onChangeBlank(q.uid, segIdx, e.target.value)}
                            placeholder="………"
                            aria-label={`Question ${globalIndex + 1} blank ${segIdx + 1}`}
                            autoComplete="off"
                            autoCapitalize="none"
                            spellCheck={false}
                            className={`mx-1 inline-block min-h-[36px] w-32 sm:w-40 rounded-[8px] border px-2.5 py-0.5 text-[14px] font-medium transition-colors focus:outline-none ${inputStyle}`}
                          />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Show expected answer in place if any blank is wrong */}
                {isGraded && grade && !grade.isFullyCorrect && (
                  <div className="mt-3 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-[13px]">
                    <span className="text-[var(--text-secondary)]">الإجابة الصحيحة: </span>
                    <span dir="ltr" className="font-en font-semibold text-[var(--success)]">
                      {q.displayAnswersPerBlank.join('; ')}
                    </span>
                  </div>
                )}
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
              تصحيح ومراجعة إجاباتي
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
                <span>{nextLabel}</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
