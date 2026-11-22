import React from 'react';
import {AlertCircle, ArrowLeft, Check, RotateCcw, Trash2} from 'lucide-react';
import {SHEET_CATALOG} from '../config/examConfig';
import type {
  ExamHistoryEntry,
  LoadedSheet,
  SavedExamProgress,
  SheetCatalogItem,
} from '../types/exam';
import {getQuestionCounts} from '../utils/questionSelection';

interface WelcomeScreenProps {
  mode: 'welcome' | 'sheets';
  onEnterSelection: () => void;
  sheets: LoadedSheet[];
  failedSheets: Array<{item: SheetCatalogItem; reason: string}>;
  isLoading: boolean;
  onRetryLoad: () => void;
  selectedSheetIds: string[];
  onToggleSheet: (sheetId: string) => void;
  onToggleSelectAll: () => void;
  onStartExam: () => void;
  history: ExamHistoryEntry[];
  onClearHistory: () => void;
  savedProgress: SavedExamProgress | null;
  onResumeProgress: () => void;
  onDiscardProgress: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  mode,
  onEnterSelection,
  sheets,
  failedSheets,
  isLoading,
  onRetryLoad,
  selectedSheetIds,
  onToggleSheet,
  onToggleSelectAll,
  onStartExam,
  history,
  onClearHistory,
  savedProgress,
  onResumeProgress,
  onDiscardProgress,
}) => {
  const sheetMap = new Map(sheets.map((s) => [s.sheetId, s]));
  const availableSheetIds = sheets.map((s) => s.sheetId);
  const allSelected =
    availableSheetIds.length > 0 &&
    availableSheetIds.every((id) => selectedSheetIds.includes(id));

  const selectedCount = selectedSheetIds.length;
  const previewCounts = selectedCount > 0 ? getQuestionCounts(selectedCount) : null;

  const formatSheetButtonLabel = (count: number): string => {
    if (count === 0) return 'ابدأ الامتحان (اختر شيتاً واحداً على الأقل)';
    if (count === 1) return 'ابدأ الامتحان (شيت واحد)';
    if (count === 2) return 'ابدأ الامتحان (شيتان)';
    if (count <= 10) return `ابدأ الامتحان (${count} شيتات)`;
    return `ابدأ الامتحان (${count} شيت)`;
  };

  if (mode === 'welcome') {
    return (
      <main className="mx-auto flex min-h-[calc(100dvh-60px)] max-w-2xl flex-col justify-center px-4 py-10 animate-screen-enter">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[12px] font-medium text-[var(--accent)]">
              أساسيات التمريض والتشريح
            </p>
            <h1 className="text-[28px] sm:text-[34px] font-semibold leading-tight text-[var(--text-primary)] [text-wrap:balance]">
              اختبر فهمك في الشيتات الطبية بهدوء وتركيز
            </h1>
            <p className="text-[15px] leading-[1.7] text-[var(--text-secondary)] max-w-xl">
              اختر شيتاً واحداً أو أكثر من أصل ١٠ شيتات، وأجب عن أسئلة أكمل الفراغ والاختيار من
              متعدد والأسئلة الكتابية مع تصحيح فوري يعمل بالكامل دون إنترنت.
            </p>
          </div>

          {/* Resume auto-saved progress banner */}
          {savedProgress && (
            <section
              aria-label="استكمال الامتحان السابق"
              className="rounded-[14px] border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-4 sm:p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                    لديك امتحان غير مكتمل محفوظ تلقائياً
                  </p>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    {savedProgress.exam.selectedSheetIds.length} شيتات · آخر قسم:{' '}
                    {savedProgress.step === 'fib'
                      ? 'أكمل الفراغ'
                      : savedProgress.step === 'mcq'
                        ? 'الاختيار من متعدد'
                        : 'الأسئلة الكتابية'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={onResumeProgress}
                    className="min-h-[44px] rounded-[14px] bg-[var(--accent)] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)] whitespace-nowrap"
                  >
                    استكمال من حيث توقفت
                  </button>
                  <button
                    type="button"
                    onClick={onDiscardProgress}
                    className="min-h-[44px] rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] text-[var(--text-secondary)] hover:text-[var(--error)] whitespace-nowrap"
                  >
                    تجاهل
                  </button>
                </div>
              </div>
            </section>
          )}

          <div className="pt-1">
            <button
              type="button"
              onClick={onEnterSelection}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-8 py-3 text-[15px] font-semibold text-white transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <span>ابدأ</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Recent results history */}
          {history.length > 0 && (
            <section aria-labelledby="recent-results-heading" className="pt-6 border-t border-[var(--border-hairline)]">
              <div className="mb-3 flex items-center justify-between gap-4">
                <h2
                  id="recent-results-heading"
                  className="text-[14px] font-semibold text-[var(--text-primary)]"
                >
                  آخر النتائج
                </h2>
                <button
                  type="button"
                  onClick={onClearHistory}
                  className="inline-flex min-h-[44px] items-center gap-1 rounded-[14px] px-2 text-[12px] text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>مسح السجل</span>
                </button>
              </div>
              <ul className="divide-y divide-[var(--border-hairline)] rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]">
                {history.slice(0, 5).map((entry) => {
                  const formattedDate = new Date(entry.date).toLocaleDateString('ar-EG', {
                    month: 'short',
                    day: 'numeric',
                  });
                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-4 px-4 py-3 text-[13px]"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="truncate font-medium text-[var(--text-primary)]">
                          {entry.sheetNames.slice(0, 2).join('، ')}
                          {entry.sheetNames.length > 2
                            ? ` (+${entry.sheetNames.length - 2})`
                            : ''}
                        </p>
                        <p className="text-[12px] text-[var(--text-muted)]">
                          {formattedDate} · {entry.gradeLabel}
                        </p>
                      </div>
                      <span
                        dir="ltr"
                        className="inline-block tabular-nums text-[15px] font-semibold text-[var(--accent)] shrink-0"
                      >
                        {entry.totalScore}/100
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 pb-28 pt-6 animate-screen-enter">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold text-[var(--text-primary)]">
            اختر الشيتات للاختبار
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {previewCounts
              ? `سيتم توليد ${previewCounts.fillIn} أكمل الفراغ · ${previewCounts.mcq} اختيار من متعدد · ${previewCounts.writing} أسئلة كتابية`
              : '١–٤ شيتات: ١٩ سؤالاً · ٥–١٠ شيتات: ٣٣ سؤالاً'}
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleSelectAll}
          disabled={sheets.length === 0}
          aria-pressed={allSelected}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] disabled:opacity-50 whitespace-nowrap"
        >
          <span>{allSelected ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</span>
        </button>
      </div>

      {/* Graceful load error alert */}
      {failedSheets.length > 0 && (
        <div
          role="alert"
          className="mb-5 flex flex-col gap-3 rounded-[14px] border border-[var(--error)]/40 bg-[var(--error-soft)] p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2.5 text-[13px] text-[var(--text-primary)]">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--error)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">تعذر تحميل {failedSheets.length} ملف/ملفات شيت:</p>
              <p className="text-[12px] text-[var(--text-secondary)]">
                {failedSheets.map((f) => `${f.item.filename} (${f.reason})`).join(' — ')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetryLoad}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--text-primary)] hover:border-[var(--accent)] shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>إعادة المحاولة</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy="true">
          {Array.from({length: 6}).map((_, i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {SHEET_CATALOG.map((catalogItem, index) => {
            const loaded = sheetMap.get(catalogItem.id);
            const isSelected = selectedSheetIds.includes(catalogItem.id);
            const isDisabled = !loaded;

            const mcqCount = loaded?.multiple_choice.length ?? 0;
            const fibCount = loaded?.fill_in_the_blank.length ?? 0;
            const studyCount = loaded?.study_questions.length ?? 0;

            return (
              <button
                key={catalogItem.id}
                type="button"
                disabled={isDisabled}
                onClick={() => onToggleSheet(catalogItem.id)}
                aria-pressed={isSelected}
                style={{animationDelay: `${Math.min(index * 35, 320)}ms`}}
                className={`animate-card-stagger group relative flex w-full items-start justify-between gap-3 rounded-[14px] border p-4 text-right transition-all duration-150 active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]/50'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:border-[var(--accent)]/50'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-[12px] text-[var(--text-muted)] tabular-nums">
                    <span className="font-semibold text-[var(--accent)]">
                      {String(catalogItem.number).padStart(2, '0')}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-en truncate">{catalogItem.englishTitle}</span>
                  </div>

                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">
                    {catalogItem.arabicTitle}
                  </p>

                  {loaded ? (
                    <p className="text-[12px] text-[var(--text-secondary)] tabular-nums">
                      {fibCount} أكمل · {mcqCount} اختيار · {studyCount} كتابي
                    </p>
                  ) : (
                    <p className="text-[12px] text-[var(--error)]">غير متاح حالياً</p>
                  )}
                </div>

                <span
                  aria-hidden="true"
                  className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-white animate-check-pop'
                      : 'border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-transparent'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Sticky bottom CTA bar (respects <= 15% mobile height) */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-[var(--border-hairline)] bg-[var(--bg-canvas)]/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl">
          <button
            type="button"
            disabled={selectedCount === 0}
            onClick={onStartExam}
            className="w-full min-h-[48px] rounded-[14px] bg-[var(--accent)] px-5 py-3 text-[15px] font-semibold text-white transition-all duration-150 hover:bg-[var(--accent-hover)] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-[var(--bg-subtle)] disabled:text-[var(--text-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {formatSheetButtonLabel(selectedCount)}
          </button>
        </div>
      </div>
    </main>
  );
};
