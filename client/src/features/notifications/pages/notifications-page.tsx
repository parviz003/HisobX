import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function NotificationsPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('notifications')} stage="9-bosqich" />;
}
