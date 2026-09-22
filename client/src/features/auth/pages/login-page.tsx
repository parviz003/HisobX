import { useEffect } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/common/phone-input';
import { useCountdown, formatCountdown } from '@/hooks/use-countdown';
import { useAuth } from '../hooks/use-auth';
import { useSignIn } from '../hooks/use-sign-in';
import { signInSchema, type SignInValues } from '../schemas';
import { PasswordField } from '../components/password-field';
import { DeviceLimitDialog } from '../components/device-limit-dialog';
import { homePathFor } from '@/app/navigation';

/**
 * Kirish sahifasi. Ro'yxatdan o'tish havolasi ATAYLAB yo'q — foydalanuvchini
 * faqat yuqori rol yaratadi (topshiriq 1-bo'lim).
 */
export default function LoginPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const [searchParams] = useSearchParams();
  const { isAuthenticated, isLoading, role } = useAuth();

  const {
    signIn,
    isPending,
    error,
    blockedUntil,
    clearBlock,
    deviceLimit,
    closeDeviceLimit,
    retryAfterDeviceFreed,
  } = useSignIn();

  const blockedSeconds = useCountdown(blockedUntil);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { phone: '', password: '' },
  });

  const phoneValue = useWatch({ control: form.control, name: 'phone' });

  // Blok tugagach tugmani yana ochamiz.
  useEffect(() => {
    if (blockedUntil && blockedSeconds === 0) clearBlock();
  }, [blockedUntil, blockedSeconds, clearBlock]);

  // Backend 400 xatolarini tegishli maydonlarga bog'laymiz.
  useEffect(() => {
    if (!error?.fieldErrors) return;
    for (const [field, message] of Object.entries(error.fieldErrors)) {
      if (field === 'phone' || field === 'password') {
        form.setError(field, { message });
      }
    }
  }, [error, form]);

  // Kirgan foydalanuvchi /login ga kelsa, ichkariga qaytariladi.
  if (!isLoading && isAuthenticated) {
    const redirect = searchParams.get('redirect');
    return <Navigate to={redirect || homePathFor(role)} replace />;
  }

  const isBlocked = blockedSeconds > 0;
  const generalError =
    error && !error.fieldErrors && error.status !== 429 && !deviceLimit
      ? error.message.startsWith('errors.')
        ? t(`errors:${error.message.slice('errors.'.length)}`)
        : error.message
      : null;

  return (
    <>
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-[22px]">{t('auth:signIn.title')}</CardTitle>
          <CardDescription>{t('auth:signIn.subtitle')}</CardDescription>
        </CardHeader>

        <CardContent>
          <form
            noValidate
            onSubmit={(event) => void form.handleSubmit((values) => signIn(values))(event)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="phone">{t('auth:signIn.phone')}</Label>
              <PhoneInput
                id="phone"
                value={phoneValue}
                onChange={(value) =>
                  form.setValue('phone', value, { shouldValidate: form.formState.isSubmitted })
                }
                disabled={isPending || isBlocked}
                aria-invalid={Boolean(form.formState.errors.phone)}
              />
              {form.formState.errors.phone ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${form.formState.errors.phone.message}`)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth:signIn.password')}</Label>
              <PasswordField
                id="password"
                disabled={isPending || isBlocked}
                aria-invalid={Boolean(form.formState.errors.password)}
                {...form.register('password')}
              />
              {form.formState.errors.password ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${form.formState.errors.password.message}`)}
                </p>
              ) : null}
            </div>

            {isBlocked ? (
              <p
                role="alert"
                className="bg-warning/12 text-warning rounded-xl px-3 py-2 text-[13px]"
              >
                {t('errors:tooManyRequests', { time: formatCountdown(blockedSeconds) })}
              </p>
            ) : null}

            {generalError ? (
              <p role="alert" className="text-destructive text-[13px]">
                {generalError}
              </p>
            ) : null}

            <Button
              type="submit"
              className="min-h-touch w-full"
              disabled={isPending || isBlocked}
            >
              {t('auth:signIn.submit')}
            </Button>

            <div className="text-center">
              <Link
                to="/login/forgot-password"
                className="text-primary min-h-touch inline-flex items-center text-[13px] font-medium"
              >
                {t('auth:signIn.forgot')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      <DeviceLimitDialog
        open={deviceLimit !== null}
        onOpenChange={(open) => !open && closeDeviceLimit()}
        devices={deviceLimit ?? []}
        onFreed={retryAfterDeviceFreed}
        retrying={isPending}
      />
    </>
  );
}
