import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useIsDesktop } from '@/hooks/use-media-query';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/utils';

export type { DateRange };

type DateRangePickerProps = {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
  placeholder?: string;
};

/** Tez tanlovlar — hisobotlar va savdolar ro'yxatida ishlatiladi. */
export function presetRange(preset: 'today' | 'yesterday' | 'week' | 'month'): DateRange {
  const today = new Date();
  const start = new Date(today);

  switch (preset) {
    case 'yesterday':
      start.setDate(today.getDate() - 1);
      return { from: start, to: start };
    case 'week':
      start.setDate(today.getDate() - 6);
      return { from: start, to: today };
    case 'month':
      start.setDate(1);
      return { from: start, to: today };
    default:
      return { from: today, to: today };
  }
}

export function DateRangePicker({
  value,
  onChange,
  className,
  placeholder,
}: DateRangePickerProps) {
  const { t } = useTranslation('common');
  const isDesktop = useIsDesktop();
  const [open, setOpen] = useState(false);

  const label =
    value?.from && value.to
      ? `${formatDate(value.from)} — ${formatDate(value.to)}`
      : value?.from
        ? formatDate(value.from)
        : (placeholder ?? t('actions.search'));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('min-h-touch justify-start font-normal', className)}
        >
          <CalendarDays className="size-4" aria-hidden />
          <span className="truncate">{label}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          numberOfMonths={isDesktop ? 2 : 1}
          // Popover ochilganda fokus kalendarga o'tadi — klaviatura uchun zarur.
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      </PopoverContent>
    </Popover>
  );
}
