import { useEffect, useState } from 'react';

/**
 * Berilgan ISO vaqtgacha qolgan soniyalarni sanaydi.
 * Vaqt absolyut bo'lgani uchun sahifa yangilansa ham to'g'ri ishlaydi.
 */
export function useCountdown(target: string | null | undefined): number {
  const compute = () => {
    if (!target) return 0;
    const ms = new Date(target).getTime() - Date.now();
    return Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0;
  };

  const [seconds, setSeconds] = useState(compute);
  const [syncedTarget, setSyncedTarget] = useState(target);

  // Nishon o'zgarsa, qiymatni effekt emas, render paytida to'g'rilaymiz.
  if (target !== syncedTarget) {
    setSyncedTarget(target);
    setSeconds(compute());
  }

  useEffect(() => {
    if (!target) return;
    const timer = setInterval(() => {
      const ms = new Date(target).getTime() - Date.now();
      setSeconds(Number.isFinite(ms) ? Math.max(0, Math.ceil(ms / 1000)) : 0);
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return seconds;
}

/** `95` → `01:35`. */
export function formatCountdown(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}
