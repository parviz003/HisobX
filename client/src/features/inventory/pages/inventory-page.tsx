import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function InventoryPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('inventory')} stage="3-bosqich" />;
}
