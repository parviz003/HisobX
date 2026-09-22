import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function PosPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('pos')} stage="4-bosqich" />;
}
