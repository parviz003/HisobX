import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCountdown } from '@/hooks/use-countdown';
import { useIsDesktop } from '@/hooks/use-media-query';
import { authApi } from '../api/auth-api';
import { authKeys } from '../api/queryKeys';
import { clearAuthFlow, patchAuthFlow, useAuthFlow } from '../api/auth-flow';

/** Holat 2 soniyada bir tekshiriladi (topshiriq 5.2-3). */
const POLL_INTERVAL_MS = 2000;

/**
 * Telegram ulanmagan foydalanuvchi uchun ekran (topshiriq 2.2).
 * Ulanish aniqlanishi bilan avtomatik OTP ekraniga o'tadi.
 */
export default function TelegramLinkPage() {
  const { t } = useTranslation(['auth', 'common']);
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const flow = useAuthFlow();

  const token = flow?.linkToken ?? null;
  // Manzilni backend beradi (`/auth/signin` javobidagi `botUrl`) — klientda sozlanmaydi.
  const botUrl = flow?.botUrl ?? '';
  const secondsLeft = useCountdown(flow?.linkExpiresAt);
  const expired = Boolean(flow?.linkExpiresAt) && secondsLeft === 0;

  const status = useQuery({
    queryKey: authKeys.telegramLink(token ?? ''),
    queryFn: ({ signal }) => authApi.telegramLinkStatus(token ?? '', signal),
    enabled: Boolean(token) && !expired,
    refetchInterval: POLL_INTERVAL_MS,
    // Ulanishni kutish uzoq davom etishi mumkin — xatoda ham urinaveramiz.
    retry: false,
  });

  const linked = status.data?.linked === true;

  // Ulangach kod allaqachon botga yuborilgan bo'ladi — OTP ekraniga o'tamiz.
  useEffect(() => {
    if (!linked) return;
    patchAuthFlow({
      expiresAt: status.data?.expiresAt ?? null,
      resendAvailableAt: status.data?.resendAvailableAt ?? null,
    });
    void navigate('/login/otp', { replace: true });
  }, [linked, status.data, navigate]);

  if (!flow || !token) return <Navigate to="/login" replace />;

  const restart = () => {
    clearAuthFlow();
    void navigate('/login', { replace: true });
  };

  if (expired) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[22px]">{t('auth:telegram.expiredTitle')}</CardTitle>
          <CardDescription>{t('auth:telegram.expiredBody')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="min-h-touch w-full" onClick={restart}>
            {t('auth:telegram.restart')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[22px]">{t('auth:telegram.title')}</CardTitle>
        <CardDescription>{t('auth:telegram.intro')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {botUrl ? (
          <Button asChild className="min-h-touch w-full text-base">
            <a href={botUrl} target="_blank" rel="noopener noreferrer">
              <Send className="size-5" aria-hidden />
              {t('auth:telegram.openBot')}
            </a>
          </Button>
        ) : (
          <p role="alert" className="text-destructive text-[13px]">
            {t('auth:telegram.missingBotUrl')}
          </p>
        )}

        {/* QR faqat kompyuterda: foydalanuvchi telefonidan skanerlaydi. */}
        {isDesktop && botUrl ? (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl bg-white p-3">
              <QRCodeSVG value={botUrl} size={160} />
            </div>
            <p className="text-muted-foreground text-center text-[13px]">
              {t('auth:telegram.qrHint')}
            </p>
          </div>
        ) : null}

        <ol className="space-y-2">
          {(['one', 'two', 'three'] as const).map((step, index) => (
            <li key={step} className="flex items-center gap-3">
              <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold">
                {index + 1}
              </span>
              <span className="text-[15px]">{t(`auth:telegram.steps.${step}`)}</span>
            </li>
          ))}
        </ol>

        <div
          role="status"
          className="text-muted-foreground flex items-center justify-center gap-2 text-[13px]"
        >
          {linked ? (
            <>
              <CheckCircle2 className="text-success size-4" aria-hidden />
              {t('auth:telegram.linked')}
            </>
          ) : (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              {t('auth:telegram.waiting')}
            </>
          )}
        </div>

        <Button variant="ghost" className="min-h-touch w-full" onClick={restart}>
          {t('auth:otp.backToLogin')}
        </Button>
      </CardContent>
    </Card>
  );
}
