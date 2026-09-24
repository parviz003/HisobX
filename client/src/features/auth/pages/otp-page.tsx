import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useCountdown, formatCountdown } from '@/hooks/use-countdown';
import { formatPhone } from '@/lib/format';
import { OtpField } from '../components/otp-field';
import { useConfirmOtp } from '../hooks/use-confirm-otp';

/** Kirish va parolni tiklash oqimlarida ishlatiladigan OTP ekrani. */
export default function OtpPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [seenError, setSeenError] = useState<unknown>(null);

  const {
    flow,
    confirm,
    isConfirming,
    confirmError,
    resend,
    isResending,
    blockedUntil,
    backToLogin,
  } = useConfirmOtp(searchParams.get('redirect'));

  const expiresIn = useCountdown(flow?.expiresAt);
  const resendIn = useCountdown(flow?.resendAvailableAt);
  const windowLeft = useCountdown(flow?.windowExpiresAt);
  const blockedSeconds = useCountdown(blockedUntil);

  // Xato kiritilgandan keyin kataklar tozalanadi (render paytida — React tavsiyasi).
  if (confirmError && confirmError !== seenError) {
    setSeenError(confirmError);
    setCode('');
  }

  if (!flow) return <Navigate to="/login" replace />;

  const codeExpired = Boolean(flow?.expiresAt) && expiresIn === 0;
  const windowExpired = Boolean(flow?.windowExpiresAt) && windowLeft === 0;
  const outOfAttempts = (flow?.attemptsLeft ?? 0) <= 0;
  const isBlocked = blockedSeconds > 0;

  // Urinishlar tugagan yoki 10 daqiqalik oyna yopilgan — login'ga qaytaramiz.
  if (outOfAttempts || windowExpired) {
    const titleKey = outOfAttempts ? 'auth:otp.blockedTitle' : 'auth:otp.windowExpiredTitle';
    const bodyKey = outOfAttempts ? 'auth:otp.blockedBody' : 'auth:otp.windowExpiredBody';

    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[22px]">{t(titleKey)}</CardTitle>
          <CardDescription>{t(bodyKey)}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="min-h-touch w-full" onClick={backToLogin}>
            {t('auth:otp.backToLogin')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const canResend = resendIn === 0 && !isResending && !isBlocked;
  const canSubmit = code.length === 6 && !isConfirming && !codeExpired && !isBlocked;
  const botUrl = flow.qrBotUrl || flow.botUrl;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[22px]">{t('auth:otp.title')}</CardTitle>
        <CardDescription>
          {t('auth:otp.sentToTelegram')} · {formatPhone(flow.phone)}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        <OtpField
          label={t('auth:otp.label')}
          value={code}
          onChange={setCode}
          // 6 raqam to'lishi bilan avtomatik yuboriladi.
          onComplete={(value) => {
            if (!codeExpired && !isBlocked) confirm(value);
          }}
          disabled={isConfirming || codeExpired || isBlocked}
          invalid={Boolean(confirmError) && confirmError?.status !== 429}
        />

        {botUrl ? (
          <Button asChild variant="outline" className="min-h-touch w-full">
            <a href={botUrl} target="_blank" rel="noopener noreferrer">
              <Send className="size-4" aria-hidden />
              {t('auth:otp.openBot')}
            </a>
          </Button>
        ) : null}

        <div className="space-y-1 text-center">
          {codeExpired ? (
            <p role="alert" className="text-destructive text-[13px]">
              {t('auth:otp.expired')}
            </p>
          ) : (
            <p className="text-muted-foreground tabular text-[13px]">
              {t('auth:otp.expiresIn', { time: formatCountdown(expiresIn) })}
            </p>
          )}

          <p className="text-muted-foreground text-[13px]">
            {t('auth:otp.attemptsLeft', { count: flow.attemptsLeft })}
          </p>
        </div>

        {isBlocked ? (
          <p
            role="alert"
            className="bg-warning/12 text-warning rounded-xl px-3 py-2 text-center text-[13px]"
          >
            {t('errors:tooManyRequests', { time: formatCountdown(blockedSeconds) })}
          </p>
        ) : null}

        <Button
          type="button"
          className="min-h-touch w-full"
          disabled={!canSubmit}
          onClick={() => confirm(code)}
        >
          {t('auth:otp.title')}
        </Button>

        <Button
          type="button"
          variant="ghost"
          className="min-h-touch tabular w-full"
          disabled={!canResend}
          onClick={() => resend()}
        >
          {canResend
            ? t('auth:otp.resend')
            : t('auth:otp.resendIn', { time: formatCountdown(resendIn) })}
        </Button>

        {/* Dev rejimida backend kodni javobda qaytaradi — sinashni osonlashtiradi. */}
        {import.meta.env.DEV && flow.devCode ? (
          <p className="bg-muted text-muted-foreground tabular rounded-xl px-3 py-2 text-center text-[13px]">
            {t('auth:otp.devCode', { code: flow.devCode })}
          </p>
        ) : null}

        <Button variant="ghost" className="min-h-touch w-full" onClick={backToLogin}>
          {t('auth:otp.backToLogin')}
        </Button>
      </CardContent>
    </Card>
  );
}
