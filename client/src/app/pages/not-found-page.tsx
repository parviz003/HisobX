import { useNavigate } from 'react-router';
import { FileQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';

export default function NotFoundPage() {
  const { t } = useTranslation('errors');
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        icon={FileQuestion}
        title={t('pageNotFoundTitle')}
        description={t('pageNotFoundBody')}
        action={
          <Button className="min-h-touch" onClick={() => void navigate('/')}>
            {t('goHome')}
          </Button>
        }
      />
    </div>
  );
}
