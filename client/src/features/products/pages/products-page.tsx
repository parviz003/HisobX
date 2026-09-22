import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function ProductsPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('products')} stage="3-bosqich" />;
}
