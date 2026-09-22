import { useEffect, useState } from 'react';

/** Chrome/Android'da beforeinstallprompt hodisasi (standart tiplarda yo'q). */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const DISMISS_KEY = 'hisobx-install-dismissed';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari'da standart bo'lmagan `navigator.standalone`
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * "Ilovani o'rnatish" taklifi.
 * Android — brauzerning o'z taklifi; iPhone — qo'lda qo'shish yo'riqnomasi.
 */
export function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    return () => window.removeEventListener('beforeinstallprompt', onPrompt);
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // Saqlab bo'lmasa, taklif keyingi ochilishda yana chiqadi.
    }
  };

  const installed = isStandalone();
  const ios = isIos();

  return {
    /** Android: brauzer taklifini ko'rsatish mumkin. */
    canPrompt: Boolean(deferred),
    /** iPhone'da qo'lda qo'shish yo'riqnomasi kerak. */
    needsIosHint: ios && !installed,
    visible: !installed && !dismissed && (Boolean(deferred) || (ios && !installed)),
    promptInstall: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      dismiss();
    },
    dismiss,
  };
}
