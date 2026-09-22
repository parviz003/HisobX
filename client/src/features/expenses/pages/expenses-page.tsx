import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function ExpensesPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('expenses')} stage="7-bosqich" />;
}
