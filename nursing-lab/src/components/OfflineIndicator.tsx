import React from 'react';
import {WifiOff} from 'lucide-react';
import {useOnlineStatus} from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-14 left-4 z-40 inline-flex items-center gap-2 rounded-[14px] border border-[var(--amber)]/40 bg-[var(--amber-soft)] px-3 py-1.5 text-[12px] font-medium text-[var(--amber)]"
    >
      <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
      <span>وضع عدم الاتصال — التصحيح يعمل محلياً</span>
    </div>
  );
};
