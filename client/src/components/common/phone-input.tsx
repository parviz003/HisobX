import { forwardRef } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type PhoneInputProps = {
  value: string;
  /** Har doim `+998901234567` formatida qaytaradi. */
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  'aria-invalid'?: boolean;
  'aria-label'?: string;
};

/** `90 123 45 67` ko'rinishida ko'rsatadi. */
function toMask(local: string): string {
  const parts = [local.slice(0, 2), local.slice(2, 5), local.slice(5, 7), local.slice(7, 9)];
  return parts.filter(Boolean).join(' ');
}

function toLocalDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  const withoutCode = digits.startsWith('998') ? digits.slice(3) : digits;
  return withoutCode.slice(0, 9);
}

/** `+998` prefiksi doimiy, foydalanuvchi faqat 9 raqam kiritadi. */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onChange, disabled, id, className, ...aria },
  ref,
) {
  const local = toLocalDigits(value);

  return (
    <div className="relative">
      <span className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 flex items-center text-[15px]">
        +998
      </span>
      <Input
        {...aria}
        ref={ref}
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        disabled={disabled}
        placeholder="90 123 45 67"
        value={toMask(local)}
        onChange={(event) => {
          const next = toLocalDigits(event.target.value);
          onChange(next === '' ? '' : `+998${next}`);
        }}
        className={cn('tabular pl-14', className)}
      />
    </div>
  );
});
