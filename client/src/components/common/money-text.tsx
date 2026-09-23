import { formatMoney, toAmount } from '@/lib/format';
import { cn } from '@/lib/utils';

type MoneyTextProps = {
  /** Kontrakt bo'yicha `number`; `string` o'tish davri uchun qabul qilinadi. */
  value: string | number | null | undefined;
  /** `in` — kirim (yashil), `out` — chiqim (qizil), `debt` — qarz (rose) */
  tone?: 'default' | 'in' | 'out' | 'debt' | 'auto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  withSign?: boolean;
  withSuffix?: boolean;
  className?: string;
};

const SIZE_CLASS = {
  sm: 'text-[13px]',
  md: 'text-base',
  lg: 'text-xl font-semibold',
  xl: 'text-3xl font-bold tracking-tight',
} as const;

export function MoneyText({
  value,
  tone = 'default',
  size = 'md',
  withSign = false,
  withSuffix = true,
  className,
}: MoneyTextProps) {
  // `auto` — ishorasiga qarab rang tanlaydi (kassa harakatlari uchun qulay).
  const amount = toAmount(value);
  const resolvedTone =
    tone === 'auto' ? (amount < 0 ? 'out' : amount > 0 ? 'in' : 'default') : tone;

  return (
    <span
      className={cn(
        'tabular',
        SIZE_CLASS[size],
        resolvedTone === 'in' && 'text-money-in',
        resolvedTone === 'out' && 'text-money-out',
        resolvedTone === 'debt' && 'text-debt',
        className,
      )}
    >
      {formatMoney(value, { sign: withSign, withSuffix })}
    </span>
  );
}
