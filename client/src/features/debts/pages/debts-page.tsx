import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function DebtsPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('debts')} stage="6-bosqich" />;
}
