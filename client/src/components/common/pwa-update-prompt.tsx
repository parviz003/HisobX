import { useEffect } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

/** Yangi versiya chiqqanda "Yangilash" toast'i (10-bosqichda kengaytiriladi). */
export function PwaUpdatePrompt() {
  const { t } = useTranslation('common');
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!needRefresh) return;
    toast(t('pwa.updateTitle'), {
      description: t('pwa.updateBody'),
      duration: Infinity,
      action: {
        label: t('actions.update'),
        onClick: () => void updateServiceWorker(true),
      },
      onDismiss: () => setNeedRefresh(false),
    });
  }, [needRefresh, setNeedRefresh, updateServiceWorker, t]);

  return null;
}
