import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function StaffPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('staff')} stage="9-bosqich" />;
}
