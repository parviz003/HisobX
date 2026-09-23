import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { UNITS } from '../schemas';
import type { Unit } from '@/lib/format';

/** O'lchov birligi — segmentli tanlov (topshiriq 3.3). */
export function UnitSelect({
  value,
  onChange,
  disabled,
}: {
  value: Unit;
  onChange: (unit: Unit) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('catalog');

  return (
    <div
      role="radiogroup"
      aria-label={t('products.fields.unit')}
      className="bg-muted flex gap-1 rounded-xl p-1"
    >
      {UNITS.map((unit) => (
        <Button
          key={unit}
          type="button"
          role="radio"
          aria-checked={value === unit}
          variant={value === unit ? 'default' : 'ghost'}
          className="min-h-touch flex-1"
          disabled={disabled}
          onClick={() => onChange(unit)}
        >
          {unit}
        </Button>
      ))}
    </div>
  );
}
