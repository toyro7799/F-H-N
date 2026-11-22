import React from 'react';
import {Clock, Moon, Sun} from 'lucide-react';
import {PWAInstallButton} from './PWAInstallButton';

interface HeaderBarProps {
  progressPercent: number;
  stepLabel: string;
  showTimerToggle: boolean;
  timerEnabled: boolean;
  elapsedSeconds: number;
  onToggleTimer: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onGoHome?: () => void;
}

export function formatElapsedTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  progressPercent,
  stepLabel,
  showTimerToggle,
  timerEnabled,
  elapsedSeconds,
  onToggleTimer,
  theme,
  onToggleTheme,
  onGoHome,
}) => {
  const clamped = Math.max(0, Math.min(100, progressPercent));

  return (
    <header className="sticky top-0 z-30 bg-[var(--bg-canvas)]/95 backdrop-blur-md border-b border-[var(--border-hairline)]">
      {/* Thin top progress bar */}
      <div
        className="h-[3px] w-full bg-[var(--border-hairline)] overflow-hidden"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label="تقدم الامتحان"
      >
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-out"
          style={{width: `${clamped}%`}}
        />
      </div>

      <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-1.5 min-h-[52px]">
        <div className="flex items-center gap-3 min-w-0">
          {onGoHome ? (
            <button
              type="button"
              onClick={onGoHome}
              className="min-h-[44px] text-[15px] font-semibold text-[var(--text-primary)] hover:text-[var(--accent)] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] rounded-lg px-1"
            >
              مختبر التمريض
            </button>
          ) : (
            <span className="text-[15px] font-semibold text-[var(--text-primary)] whitespace-nowrap shrink-0">
              مختبر التمريض
            </span>
          )}
          {stepLabel && (
            <span className="hidden sm:inline text-[12px] text-[var(--text-muted)] truncate">
              · {stepLabel}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {showTimerToggle && (
            <button
              type="button"
              onClick={onToggleTimer}
              aria-pressed={timerEnabled}
              aria-label={timerEnabled ? 'إيقاف المؤقت' : 'تفعيل المؤقت'}
              className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border px-3 py-1.5 text-[12px] font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] ${
                timerEnabled
                  ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]/50'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden="true" />
              <span className="tabular-nums">
                {timerEnabled ? formatElapsedTime(elapsedSeconds) : 'المؤقت'}
              </span>
            </button>
          )}

          <PWAInstallButton />

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
