import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

/**
 * Hali tayyor bo'lmagan imkoniyatlar (masalan chek chiqarish) uchun tugma:
 * bosilganda "Tez orada qo'shiladi" xabarini ko'rsatadi.
 */
export function ComingSoonButton({
  children,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { t } = useTranslation('common');

  return (
    <Button
      {...props}
      onClick={(event) => {
        onClick?.(event);
        toast.info(t('state.comingSoon'));
      }}
    >
      {children}
    </Button>
  );
}
