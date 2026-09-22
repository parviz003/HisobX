import { useTranslation } from 'react-i18next';
import { passwordStrength } from '../schemas';
import { cn } from '@/lib/utils';

const TONE = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-info',
  'bg-success',
] as const;

/** Parol kuchliligi ko'rsatkichi (topshiriq 2.5). */
export function PasswordStrength({ value }: { value: string }) {
  const { t } = useTranslation('auth');
  const score = passwordStrength(value);

  if (!value) return null;

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1" aria-hidden>
        {[0, 1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors duration-150',
              index < score ? TONE[score] : 'bg-muted',
            )}
          />
        ))}
      </div>
      <p className="text-muted-foreground text-[13px]">
        {t('reset.strength.label')}: {t(`reset.strength.${score}`)}
      </p>
    </div>
  );
}
