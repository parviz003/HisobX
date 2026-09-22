import { useNavigate } from 'react-router';
import { ShieldAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';

export default function ForbiddenPage() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={ShieldAlert}
        title={t('forbiddenTitle')}
        description={t('forbiddenBody')}
        action={
          <Button className="min-h-touch" onClick={() => void navigate('/')}>
            {t('goHome')}
          </Button>
        }
      />
    </div>
  );
}
