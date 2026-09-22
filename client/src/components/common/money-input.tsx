import { forwardRef, useId } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type MoneyInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
  'aria-invalid'?: boolean;
};

const NBSP = ' ';

function toDisplay(value: number | null): string {
  if (value === null) return '';
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

/**
 * Pul kiritish maydoni: yozilayotganda mingliklarni ajratadi, backend'ga
 * butun son (so'm) uzatiladi.
 */
export const MoneyInput = forwardRef<HTMLInputElement, MoneyInputProps>(function MoneyInput(
  { value, onChange, placeholder, disabled, id, className, ...aria },
  ref,
) {
  const fallbackId = useId();

  return (
    <div className="relative">
      <Input
        {...aria}
        ref={ref}
        id={id ?? fallbackId}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder ?? '0'}
        value={toDisplay(value)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, '');
          onChange(digits === '' ? null : Number(digits));
        }}
        className={cn('tabular pr-14 text-right', className)}
      />
      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-[13px]">
        so'm
      </span>
    </div>
  );
});
