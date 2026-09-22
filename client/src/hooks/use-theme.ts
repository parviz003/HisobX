import { useContext } from 'react';
import { ThemeContext } from '@/app/providers/theme-provider';

export type { Theme, ResolvedTheme } from '@/app/providers/theme-provider';

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme faqat ThemeProvider ichida ishlatiladi');
  return ctx;
}
