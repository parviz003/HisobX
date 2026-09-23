import { Download, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useInstallPrompt } from '@/hooks/use-install-prompt';

/** Telefonga o'rnatish taklifi — pastki tab bar ustida chiqadi. */
export function InstallPrompt() {
  const { t } = useTranslation('common');
  const { visible, canPrompt, needsIosHint, promptInstall, dismiss } = useInstallPrompt();

  if (!visible) return null;

  return (
    <div className="bg-card fixed inset-x-4 bottom-24 z-40 rounded-2xl border p-4 shadow-lg dark:shadow-none md:bottom-4 md:left-auto md:w-80">
      <div className="flex items-start gap-3">
        <div className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Download className="size-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium">{t('pwa.installTitle')}</p>
          <p className="text-muted-foreground mt-1 text-[13px]">
            {needsIosHint && !canPrompt ? t('pwa.iosHint') : t('pwa.installBody')}
          </p>
          {canPrompt ? (
            <Button className="min-h-touch mt-3 w-full" onClick={() => void promptInstall()}>
              {t('actions.install')}
            </Button>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="-mt-1 -mr-1 shrink-0"
          onClick={dismiss}
          aria-label={t('actions.close')}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
