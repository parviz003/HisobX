import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function CashPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('cash')} stage="7-bosqich" />;
}
