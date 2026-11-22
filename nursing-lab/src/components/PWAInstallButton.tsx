import React, {useState} from 'react';
import {Download, X} from 'lucide-react';
import {usePWAInstall} from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const {isInstallable, isInstalled, isIOS, install} = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        aria-label="تثبيت التطبيق على الجهاز"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>تثبيت</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] px-3 py-2 text-[12px] font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          aria-label="إضافة إلى الشاشة الرئيسية"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          <span>تثبيت</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs"
          >
            <div className="w-full max-w-sm rounded-[14px] border border-[var(--border-hairline)] bg-[var(--bg-surface)] p-6 text-[var(--text-primary)]">
              <div className="flex items-center justify-between gap-4">
                <h3 id="ios-install-title" className="text-[16px] font-semibold">
                  إضافة التطبيق للشاشة الرئيسية
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[14px] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                  aria-label="إغلاق نافذة التثبيت"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="mt-4 space-y-2 text-[14px] text-[var(--text-secondary)] list-decimal list-inside">
                <li>اضغط على زر المشاركة (Share) في شريط متصفح سفاري.</li>
                <li>اختر «إضافة إلى الشاشة الرئيسية» (Add to Home Screen).</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-[14px] bg-[var(--accent)] px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
              >
                فهمت
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
