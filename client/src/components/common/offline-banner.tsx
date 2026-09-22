import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Ilova faqat online ishlaydi — internet uzilsa doimiy ogohlantirish chiqadi.
 */
export function OfflineBanner() {
  const { t } = useTranslation('common');
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOffline(false);
    const goOffline = () => setIsOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="bg-warning text-warning-foreground pt-safe flex items-center justify-center gap-2 px-4 py-2 text-[13px] font-medium"
    >
      <WifiOff className="size-4 shrink-0" aria-hidden />
      <span>{t('state.offline')}</span>
    </div>
  );
}
