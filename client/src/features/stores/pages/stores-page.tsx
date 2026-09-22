import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function StoresPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('stores')} stage="9-bosqich" />;
}
