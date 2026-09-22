import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type SearchInputProps = {
  value: string;
  /** Debounce (300ms) dan keyin chaqiriladi. */
  onDebouncedChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
};

export const SEARCH_DEBOUNCE_MS = 300;

export function SearchInput({
  value,
  onDebouncedChange,
  placeholder,
  className,
  autoFocus,
}: SearchInputProps) {
  const { t } = useTranslation('common');
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);

  // Tashqaridan (masalan URL'dan) qiymat o'zgarsa, ichki holatni moslaymiz.
  // React tavsiya qiladigan usul: holatni effekt emas, render paytida to'g'rilash.
  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onDebouncedChange(draft), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, value, onDebouncedChange]);

  return (
    <div className={cn('relative', className)}>
      <Search
        className="text-muted-foreground pointer-events-none absolute inset-y-0 left-3 my-auto size-4"
        aria-hidden
      />
      <Input
        type="search"
        // POS'da qidiruv ochilishi bilan yozishni boshlash kerak — bu ataylab.
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder ?? t('actions.search')}
        aria-label={placeholder ?? t('actions.search')}
        className="px-10"
      />
      {draft ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 my-auto size-9"
          onClick={() => setDraft('')}
          aria-label={t('actions.close')}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
