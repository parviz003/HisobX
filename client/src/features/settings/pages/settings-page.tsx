import { useTranslation } from 'react-i18next';
import { StagePlaceholder } from '@/app/pages/stage-placeholder';

export default function SettingsPage() {
  const { t } = useTranslation('nav');
  return <StagePlaceholder title={t('settings')} stage="9-bosqich" />;
}
