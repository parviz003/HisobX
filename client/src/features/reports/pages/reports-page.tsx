import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function ReportsPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('reports')} stage="8-bosqich" />;
}
