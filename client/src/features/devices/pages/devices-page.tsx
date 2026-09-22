import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function DevicesPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('devices')} stage="2-bosqich" />;
}
