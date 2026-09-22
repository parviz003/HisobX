import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function ProfilePage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('profile')} stage="2-bosqich" />;
}
