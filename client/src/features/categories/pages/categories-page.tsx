import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function CategoriesPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('categories')} stage="3-bosqich" />;
}
