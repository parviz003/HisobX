import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function DashboardPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('dashboard')} stage="8-bosqich" />;
}
