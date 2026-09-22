import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function CustomersPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('customers')} stage="6-bosqich" />;
}
