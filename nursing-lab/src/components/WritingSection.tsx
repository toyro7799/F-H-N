import React, {useEffect, useMemo, useRef, useState} from 'react';
import {AlertCircle, ArrowLeft, Check, ChevronDown, Filter, SkipForward, X} from 'lucide-react';
import type {ExamWritingQuestion, WritingGradeResult} from '../types/exam';
import {highlightMatchedStudentAnswer} from '../utils/writingGrading';

interface WritingSectionProps {
  questions: ExamWritingQuestion[];
  answers: Record<string, string>;
  skippedUids: Set<string>;
  isGraded: boolean;
  gradeResults: WritingGradeResult[];
  debugMode?: boolean;
  onChangeAnswer: (uid: string, value: string) => void;
  onSkipQuestion: (uid: string) => void;
  onGrade: () => void;
  onFinishExam: () => void;
}

export const WritingSection: React.FC<WritingSectionProps> = ({
  questions,
  answers,
  skippedUids,
  isGraded,
  gradeResults,
  debugMode = false,
  onChangeAnswer,
  onSkipQuestion,
  onGrade,
  onFinishExam,
}) => {
  const [showWrongOnly, setShowWrongOnly] = useState(false);
  const [openModels, setOpenModels] = useState<Record<string, boolean>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const gradeMap = useMemo(
    () => new Map(gradeResults.map((r) => [r.uid, r])),
    [gradeResults]
  );

  const answeredCount = useMemo(
    () => questions.filter((q) => (answers[q.uid] ?? '').trim().length > 0).length,
    [questions, answers]
  );

  const partSummary = useMemo(() => {
    if (!isGraded) return null;
    const earned = gradeResults.reduce((s, r) => s + r.score, 0);
    const total = questions.length;
    const pct = total > 0 ? Math.round((earned / total) * 100) : 0;
    return {earned: Number(earned.toFixed(1)), total, pct};
  }, [isGraded, gradeResults, questions.length]);

  const wrongCount = useMemo(() => {
    if (!isGraded) return 0;
    return questions.filter((q) => gradeMap.get(q.uid)?.status !== 'correct').length;
  }, [questions, isGraded, gradeMap]);

  const visibleQuestions = useMemo(() => {
    if (!isGraded || !showWrongOnly) return questions;
    return questions.filter((q) => gradeMap.get(q.uid)?.status !== 'correct');
  }, [questions, isGraded, showWrongOnly, gradeMap]);

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.max(88, el.scrollHeight)}px`;
  };

  useEffect(() => {
    for (const el of Object.values(textareaRefs.current)) {
      if (el) autoResize(el);
    }
  }, [answers, visibleQuestions.length, isGraded]);

  const toggleModel = (uid: string) => {
    setOpenModels((prev) => ({...prev, [uid]: !prev[uid]}));
  };

  return (
    <main className="mx-auto max-w-3xl px-4 pb-28 pt-6 animate-screen-enter">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[12px] font-medium text-[var(--accent)]">القسم الثالث</p>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
            الأسئلة الكتابية (Study Questions)
          </h1>
          <p className="text-[12px] text-[var(--text-muted)]">
            اكتب النقاط الأساسية بالإنجليزية — الترتيب والأخطاء الإملائية البسيطة لا تُنقص الدرجة
          </p>
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
            <p className="text-[12px] text-[var(--text-muted)]">نتيجة الأسئلة الكتابية</p>
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
                  ? 'border-[var(--amber)] bg-[var(--amber-soft)] text-[var(--amber)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
              }`}
            >
              <Filter className="h-3.5 w-3.5" aria-hidden="true" />
              <span>
                {showWrongOnly ? 'عرض جميع الأسئلة' : `غير المكتملة فقط (${wrongCount})`}
              </span>
            </button>
          )}
        </section>
      )}

      {visibleQuestions.length === 0 && isGraded ? (
        <div className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-center text-[14px] text-[var(--success)]">
          رائع! أتممت جميع الأسئلة الكتابية بدرجة ممتازة.
        </div>
      ) : (
        <ol className="space-y-4">
          {visibleQuestions.map((q) => {
            const globalIndex = questions.findIndex((item) => item.uid === q.uid);
            const value = answers[q.uid] ?? '';
            const grade = gradeMap.get(q.uid);
            const isSkipped = skippedUids.has(q.uid) && !value.trim();
            const isModelOpen = Boolean(openModels[q.uid]);

            const cardTone = !isGraded
              ? 'border-[var(--border-hairline)] bg-[var(--bg-surface)]'
              : grade?.status === 'correct'
                ? 'border-[var(--success)]/60 bg-[var(--success-soft)]/25'
                : grade?.status === 'partial'
                  ? 'border-[var(--amber)]/60 bg-[var(--amber-soft)]/25'
                  : 'border-[var(--error)]/60 bg-[var(--error-soft)]/25';

            const highlightedParts =
              isGraded && grade
                ? highlightMatchedStudentAnswer(value, grade.matchedStudentTokens)
                : [];

            return (
              <li
                key={q.uid}
                className={`rounded-[14px] border p-4 sm:p-5 transition-colors ${cardTone}`}
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
                      className={`inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums ${
                        grade.status === 'correct'
                          ? 'text-[var(--success)]'
                          : grade.status === 'partial'
                            ? 'text-[var(--amber)]'
                            : 'text-[var(--error)]'
                      }`}
                    >
                      {grade.status === 'correct' && <Check className="h-4 w-4" aria-hidden="true" />}
                      {grade.status === 'partial' && (
                        <AlertCircle className="h-4 w-4" aria-hidden="true" />
                      )}
                      {grade.status === 'wrong' && <X className="h-4 w-4" aria-hidden="true" />}
                      <span>
                        {grade.percentage}% ·{' '}
                        {grade.status === 'correct'
                          ? 'صحيحة'
                          : grade.status === 'partial'
                            ? 'إجابة جزئية'
                            : 'تحتاج مراجعة'}
                      </span>
                    </span>
                  )}
                </div>

                <p
                  dir="ltr"
                  className="font-en mb-3 text-[15px] font-medium leading-[1.6] text-[var(--text-primary)]"
                >
                  {q.question}
                </p>

                {/* Before grading: editable auto-growing textarea (no model answer shown) */}
                {!isGraded && (
                  <textarea
                    ref={(el) => {
                      textareaRefs.current[q.uid] = el;
                    }}
                    dir="ltr"
                    rows={3}
                    value={value}
                    onChange={(e) => {
                      autoResize(e.target);
                      onChangeAnswer(q.uid, e.target.value);
                    }}
                    placeholder="Write your answer points here..."
                    aria-label={`Answer for study question ${globalIndex + 1}`}
                    className="font-en w-full resize-none rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3.5 py-2.5 text-[14px] leading-[1.6] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none"
                  />
                )}

                {/* After grading: Side-by-side comparison + point-by-point matching + collapsible model answer */}
                {isGraded && grade && (
                  <div className="mt-3 space-y-4">
                    {/* Two-column comparison (stacked on mobile) */}
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {/* Column 1: Student Answer with softly highlighted matched words */}
                      <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
                        <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">
                          إجابتك
                        </p>
                        {value.trim() ? (
                          <div
                            dir="ltr"
                            className="font-en whitespace-pre-wrap text-[13px] leading-[1.7] text-[var(--text-primary)]"
                          >
                            {highlightedParts.map((part, pIdx) =>
                              part.matched ? (
                                <mark
                                  key={pIdx}
                                  className="rounded-[4px] bg-[var(--success-soft)] px-1 py-0.5 text-[var(--text-primary)]"
                                >
                                  {part.text}
                                </mark>
                              ) : (
                                <React.Fragment key={pIdx}>{part.text}</React.Fragment>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-[13px] text-[var(--text-muted)]">لم تكتب إجابة</p>
                        )}
                      </div>

                      {/* Column 2: Model Answer Points */}
                      <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-3.5">
                        <p className="mb-2 text-[12px] font-semibold text-[var(--text-secondary)]">
                          الإجابة النموذجية
                        </p>
                        <ul
                          dir="ltr"
                          className="font-en list-disc pl-4 space-y-1 text-[13px] leading-[1.6] text-[var(--text-secondary)]"
                        >
                          {grade.points.map((pt, idx) => (
                            <li key={idx}>{pt.point}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Point-by-point breakdown */}
                    <div className="space-y-1.5">
                      <p className="text-[12px] font-semibold text-[var(--text-secondary)]">
                        تفصيل النقاط:
                      </p>
                      <ul className="space-y-2">
                        {grade.points.map((pt, idx) => {
                          const isCovered = pt.status === 'covered';
                          const isPartial = pt.status === 'partial';
                          const simPct = Math.round(pt.similarity * 100);

                          const rowColors = isCovered
                            ? 'border-[var(--success)]/40 bg-[var(--success-soft)]'
                            : isPartial
                              ? 'border-[var(--amber)]/40 bg-[var(--amber-soft)]'
                              : 'border-[var(--error)]/35 bg-[var(--error-soft)]/70';

                          const statusBadgeText = isCovered
                            ? 'صحيحة'
                            : isPartial
                              ? 'قريبة / جزئية'
                              : 'ناقصة';

                          const statusColorClass = isCovered
                            ? 'text-[var(--success)]'
                            : isPartial
                              ? 'text-[var(--amber)]'
                              : 'text-[var(--error)]';

                          return (
                            <li
                              key={idx}
                              className={`rounded-[12px] border px-3.5 py-2.5 text-[13px] space-y-1.5 ${rowColors}`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={`inline-flex items-center gap-1.5 text-[12px] font-semibold ${statusColorClass}`}
                                >
                                  {isCovered ? (
                                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                                  ) : isPartial ? (
                                    <span aria-hidden="true">≈</span>
                                  ) : (
                                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                  <span>{statusBadgeText}</span>
                                </span>

                                <span
                                  dir="ltr"
                                  className={`text-[11px] font-semibold tabular-nums ${statusColorClass}`}
                                >
                                  {simPct}%
                                </span>
                              </div>

                              <p
                                dir="ltr"
                                className="font-en text-left leading-[1.55] text-[var(--text-primary)]"
                              >
                                {pt.point}
                              </p>

                              <p className="text-[12px] leading-[1.5] text-[var(--text-secondary)]">
                                {pt.matchedChunk ? (
                                  <>
                                    <span className="font-medium">تقصد: </span>
                                    <span
                                      dir="ltr"
                                      className="font-en inline-block text-[var(--text-primary)]"
                                    >
                                      «{pt.matchedChunk}»
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[var(--error)] font-medium">
                                    لم تُذكر
                                  </span>
                                )}
                              </p>

                              {debugMode && pt.debug && (
                                <p
                                  dir="ltr"
                                  className="font-en text-left text-[11px] text-[var(--text-muted)] tabular-nums"
                                >
                                  [debug] type={pt.debug.questionType} | credit={pt.credit} |
                                  raw={pt.debug.rawScore} | kw={pt.debug.keywordScore} | chunk=
                                  {pt.debug.chunkScore} | keyTerm={pt.debug.keyTermScore} (hit=
                                  {String(pt.debug.keyTermHit)}) | exp=
                                  {pt.debug.explanationScore}
                                </p>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* Collapsible Full Model Answer */}
                    <div className="rounded-[12px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                      <button
                        type="button"
                        onClick={() => toggleModel(q.uid)}
                        aria-expanded={isModelOpen}
                        className="flex w-full min-h-[44px] items-center justify-between gap-2 px-3.5 py-2 text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--accent)]"
                      >
                        <span>الإجابة النموذجية الكاملة</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isModelOpen ? 'rotate-180' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isModelOpen && (
                        <div
                          dir="ltr"
                          className="font-en border-t border-[var(--border-hairline)] px-3.5 py-3 text-[13px] leading-[1.6] text-[var(--text-secondary)] space-y-3"
                        >
                          <ul className="list-disc pl-5 space-y-1">
                            {q.answer.map((line, i) => (
                              <li key={i}>{line}</li>
                            ))}
                          </ul>

                          {q.table && (
                            <div className="overflow-x-auto">
                              <table className="w-full border-collapse text-left text-[12px]">
                                <thead>
                                  <tr className="border-b border-[var(--border-hairline)]">
                                    {q.table.headers.map((h, hi) => (
                                      <th
                                        key={hi}
                                        className="py-1.5 pr-3 font-semibold text-[var(--text-primary)]"
                                      >
                                        {h}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-hairline)]">
                                  {q.table.rows.map((row, ri) => (
                                    <tr key={ri}>
                                      {row.map((cell, ci) => (
                                        <td key={ci} className="py-1.5 pr-3">
                                          {cell}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
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
                onClick={onFinishExam}
                className="flex-1 sm:flex-initial inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-6 py-3 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                <span>عرض النتيجة النهائية</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};
