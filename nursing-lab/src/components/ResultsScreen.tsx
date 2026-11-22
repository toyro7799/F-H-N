import React from 'react';
import {LayoutGrid, RefreshCw, RotateCcw} from 'lucide-react';
import type {ExamSummary} from '../types/exam';

interface ResultsScreenProps {
  summary: ExamSummary;
  hasWrongQuestions: boolean;
  onRetryWrong: () => void;
  onNewExamSameSheets: () => void;
  onChangeSheets: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  summary,
  hasWrongQuestions,
  onRetryWrong,
  onNewExamSameSheets,
  onChangeSheets,
}) => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeOffset = circumference - (summary.totalScore / 100) * circumference;

  const scoreColor =
    summary.totalScore >= 75
      ? 'var(--success)'
      : summary.totalScore >= 60
        ? 'var(--accent)'
        : 'var(--amber)';

  const parts = [
    {key: 'fib', title: 'أكمل الفراغ', weight: '٣٠٪', data: summary.fillIn},
    {key: 'mcq', title: 'الاختيار من متعدد', weight: '٤٠٪', data: summary.mcq},
    {key: 'writing', title: 'الأسئلة الكتابية', weight: '٣٠٪', data: summary.writing},
  ].filter((p) => p.data.total > 0);

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-8 animate-screen-enter">
      {/* Circular Score Hero */}
      <section
        aria-label="النتيجة النهائية"
        className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 sm:p-8 text-center"
      >
        <div className="mx-auto relative flex h-36 w-36 items-center justify-center">
          <svg className="h-36 w-36 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke="var(--border-hairline)"
              strokeWidth="8"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular-nums text-[30px] font-bold leading-none text-[var(--text-primary)]">
              {summary.totalScore}
            </span>
            <span className="mt-1 text-[12px] text-[var(--text-muted)] tabular-nums">
              من ١٠٠
            </span>
          </div>
        </div>

        <h1 className="mt-4 text-[22px] font-semibold text-[var(--text-primary)]">
          {summary.gradeLabel}
        </h1>
        <p className="mx-auto mt-1.5 max-w-md text-[14px] leading-[1.6] text-[var(--text-secondary)]">
          {summary.encouragement}
        </p>
      </section>

      {/* Per-Part Breakdown */}
      <section aria-labelledby="parts-breakdown-heading" className="mt-6">
        <h2
          id="parts-breakdown-heading"
          className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]"
        >
          تفصيل الأقسام
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {parts.map((part) => (
            <div
              key={part.key}
              className="rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-4"
            >
              <div className="flex items-center justify-between gap-2 text-[12px] text-[var(--text-muted)]">
                <span>{part.title}</span>
                <span>الوزن {part.weight}</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2 tabular-nums">
                <span dir="ltr" className="inline-block text-[18px] font-semibold text-[var(--text-primary)] tabular-nums">
                  {part.data.earned} / {part.data.total}
                </span>
                <span className="text-[13px] font-medium text-[var(--accent)]">
                  {part.data.percentage}%
                </span>
              </div>
              <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                <div
                  className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
                  style={{width: `${part.data.percentage}%`}}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Per-Sheet Breakdown */}
      {summary.sheetBreakdown.length > 0 && (
        <section aria-labelledby="sheets-breakdown-heading" className="mt-6">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2
              id="sheets-breakdown-heading"
              className="text-[15px] font-semibold text-[var(--text-primary)]"
            >
              الأداء حسب الشيت
            </h2>
            {summary.strongestSheet && summary.weakestSheet && (
              <p className="text-[12px] text-[var(--text-secondary)]">
                الأقوى: <span className="font-semibold text-[var(--success)]">{summary.strongestSheet.arabicTitle}</span>
                {' · '}
                الأضعف: <span className="font-semibold text-[var(--amber)]">{summary.weakestSheet.arabicTitle}</span>
              </p>
            )}
          </div>

          <ul className="divide-y divide-[var(--border-hairline)] rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
            {summary.sheetBreakdown.map((item) => {
              const isStrongest =
                summary.sheetBreakdown.length > 1 &&
                summary.strongestSheet?.sheetId === item.sheetId;
              const isWeakest =
                summary.sheetBreakdown.length > 1 &&
                summary.weakestSheet?.sheetId === item.sheetId &&
                item.sheetId !== summary.strongestSheet?.sheetId;

              return (
                <li
                  key={item.sheetId}
                  className="flex items-center justify-between gap-4 px-4 py-3.5"
                >
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">
                      {item.arabicTitle}
                      {isStrongest && (
                        <span className="mr-2 text-[12px] font-medium text-[var(--success)]">
                          (الأقوى)
                        </span>
                      )}
                      {isWeakest && (
                        <span className="mr-2 text-[12px] font-medium text-[var(--amber)]">
                          (يحتاج مراجعة)
                        </span>
                      )}
                    </p>
                    <p dir="ltr" className="font-en text-[12px] text-[var(--text-muted)] text-right">
                      {item.englishTitle}
                    </p>
                  </div>

                  <div className="text-left tabular-nums shrink-0">
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {item.percentage}%
                    </p>
                    <p dir="ltr" className="text-[12px] text-[var(--text-muted)] tabular-nums">
                      {item.earned} / {item.total}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Action Buttons */}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <button
          type="button"
          disabled={!hasWrongQuestions}
          onClick={onRetryWrong}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-4 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>إعادة الأسئلة الخاطئة فقط</span>
        </button>

        <button
          type="button"
          onClick={onNewExamSameSheets}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>امتحان جديد</span>
        </button>

        <button
          type="button"
          onClick={onChangeSheets}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-3 text-[14px] font-semibold text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          <span>تغيير الشيتات</span>
        </button>
      </div>
    </main>
  );
};
