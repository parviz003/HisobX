import { forwardRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { QUANTITY_DECIMALS, type Unit } from '@/lib/format';
import { cn } from '@/lib/utils';

type QuantityInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  unit: Unit;
  max?: number;
  disabled?: boolean;
  withSteppers?: boolean;
  id?: string;
  className?: string;
  'aria-label'?: string;
};

/** `dona` → butun son; `kg`/`litr` → 3 xonagacha kasr, vergul ham qabul qilinadi. */
export const QuantityInput = forwardRef<HTMLInputElement, QuantityInputProps>(
  function QuantityInput(
    { value, onChange, unit, max, disabled, withSteppers = true, id, className, ...aria },
    ref,
  ) {
    const isInteger = unit === 'dona';
    const step = isInteger ? 1 : 0.1;
    // Yozish jarayonida "1," kabi tugallanmagan qiymat yo'qolmasligi uchun
    // matnni alohida saqlaymiz.
    const [draft, setDraft] = useState<string | null>(null);

    const display = draft ?? (value === null ? '' : String(value).replace('.', ','));

    const clamp = (next: number) => {
      const limited = max !== undefined ? Math.min(next, max) : next;
      const positive = Math.max(0, limited);
      const factor = 10 ** (isInteger ? 0 : QUANTITY_DECIMALS);
      return Math.round(positive * factor) / factor;
    };

    const nudge = (delta: number) => onChange(clamp((value ?? 0) + delta));

    return (
      <div className={cn('flex items-center gap-2', className)}>
        {withSteppers ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-touch shrink-0"
            disabled={disabled || (value ?? 0) <= 0}
            onClick={() => nudge(-step)}
            aria-label="Kamaytirish"
          >
            <Minus className="size-4" />
          </Button>
        ) : null}

        <Input
          {...aria}
          ref={ref}
          id={id}
          type="text"
          inputMode={isInteger ? 'numeric' : 'decimal'}
          autoComplete="off"
          disabled={disabled}
          value={display}
          onChange={(event) => {
            const raw = event.target.value;
            const allowed = isInteger ? /^\d*$/ : /^\d*[.,]?\d{0,3}$/;
            if (!allowed.test(raw)) return;
            setDraft(raw);
            if (raw === '' || raw === ',' || raw === '.') {
              onChange(null);
              return;
            }
            const parsed = Number(raw.replace(',', '.'));
            if (Number.isFinite(parsed)) onChange(clamp(parsed));
          }}
          onBlur={() => setDraft(null)}
          className="tabular text-center"
        />

        {withSteppers ? (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="min-h-touch shrink-0"
            disabled={disabled || (max !== undefined && (value ?? 0) >= max)}
            onClick={() => nudge(step)}
            aria-label="Oshirish"
          >
            <Plus className="size-4" />
          </Button>
        ) : null}

        <span className="text-muted-foreground w-10 shrink-0 text-[13px]">{unit}</span>
      </div>
    );
  },
);
