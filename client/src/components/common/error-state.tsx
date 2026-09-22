import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ErrorStateProps = {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
};

export function ErrorState({ title, description, onRetry, className }: ErrorStateProps) {
  const { t } = useTranslation(['common', 'errors']);

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl px-6 py-12 text-center',
        className,
      )}
    >
      <div className="bg-destructive/10 text-destructive mb-4 flex size-14 items-center justify-center rounded-2xl">
        <AlertTriangle className="size-7" aria-hidden />
      </div>
      <p className="text-base font-medium">{title ?? t('common:state.errorTitle')}</p>
      <p className="text-muted-foreground mt-1 max-w-sm text-[13px] sm:text-sm">
        {description ?? t('errors:generic')}
      </p>
      {onRetry ? (
        <Button variant="outline" className="mt-5 min-h-touch" onClick={onRetry}>
          {t('common:actions.retry')}
        </Button>
      ) : null}
    </div>
  );
}
