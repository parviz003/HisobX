import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * 1-bosqichda faqat qobiq. To'liq kirish oqimi (telefon + parol, Telegram
 * ulanish, OTP, parolni tiklash) 2-bosqichda yoziladi.
 */
export default function LoginPage() {
  const { t } = useTranslation('auth');

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[22px]">{t('signIn.title')}</CardTitle>
        <CardDescription>{t('signIn.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-[13px]">{t('placeholders.stage')}</p>
      </CardContent>
    </Card>
  );
}
