import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { isApiError } from '@/lib/api/errors';
import { authApi } from '../api/auth-api';
import { clearAuthFlow, useAuthFlow } from '../api/auth-flow';
import { resetPasswordSchema, type ResetPasswordValues } from '../schemas';
import { OtpField } from '../components/otp-field';
import { PasswordField } from '../components/password-field';
import { PasswordStrength } from '../components/password-strength';

/** Parolni tiklashning 2-qadami: kod + yangi parol (topshiriq 2.5). */
export default function ResetPasswordPage() {
  const { t } = useTranslation(['auth', 'errors']);
  const navigate = useNavigate();
  const flow = useAuthFlow();
  const [code, setCode] = useState('');

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { code: '', password: '', confirmPassword: '' },
  });

  // Kataklardagi qiymatni forma holatiga ko'chiramiz.
  useEffect(() => {
    form.setValue('code', code, { shouldValidate: form.formState.isSubmitted });
  }, [code, form]);

  const passwordValue = useWatch({ control: form.control, name: 'password' });

  const mutation = useMutation({
    mutationFn: (values: ResetPasswordValues) =>
      authApi.resetPassword(flow?.phone ?? '', values.code, values.password),
    onSuccess: () => {
      clearAuthFlow();
      toast.success(t('auth:reset.success'));
      void navigate('/login', { replace: true });
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 400) setCode('');
    },
  });

  if (!flow || flow.purpose !== 'reset') return <Navigate to="/login" replace />;


  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[22px]">{t('auth:reset.title')}</CardTitle>
        <CardDescription>{t('auth:reset.subtitle')}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Raqam mavjudligini oshkor qilmaydigan neytral matn. */}
        <p className="bg-muted text-muted-foreground rounded-xl px-3 py-2 text-[13px]">
          {t('auth:forgot.neutralNotice')}
        </p>

        <form
          noValidate
          onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>{t('auth:otp.label')}</Label>
            <OtpField
              label={t('auth:otp.label')}
              value={code}
              onChange={setCode}
              onComplete={() => undefined}
              disabled={mutation.isPending}
              invalid={Boolean(form.formState.errors.code)}
            />
            {form.formState.errors.code ? (
              <p role="alert" className="text-destructive text-center text-[13px]">
                {t(`auth:${form.formState.errors.code.message}`)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('auth:reset.newPassword')}</Label>
            <PasswordField
              id="password"
              isNew
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.password)}
              {...form.register('password')}
            />
            <PasswordStrength value={passwordValue} />
            {form.formState.errors.password ? (
              <p role="alert" className="text-destructive text-[13px]">
                {t(`auth:${form.formState.errors.password.message}`)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t('auth:reset.confirmPassword')}</Label>
            <PasswordField
              id="confirmPassword"
              isNew
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.confirmPassword)}
              {...form.register('confirmPassword')}
            />
            {form.formState.errors.confirmPassword ? (
              <p role="alert" className="text-destructive text-[13px]">
                {t(`auth:${form.formState.errors.confirmPassword.message}`)}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="min-h-touch w-full" disabled={mutation.isPending}>
            {t('auth:reset.submit')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="min-h-touch w-full"
            onClick={() => {
              clearAuthFlow();
              void navigate('/login');
            }}
          >
            {t('auth:otp.backToLogin')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
