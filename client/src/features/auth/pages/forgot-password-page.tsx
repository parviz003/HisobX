import { useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { PhoneInput } from '@/components/common/phone-input';
import { isApiError } from '@/lib/api/errors';
import { authApi } from '../api/auth-api';
import { startAuthFlow } from '../api/auth-flow';
import { isTelegramLinkRequired } from '../api/types';
import { forgotPasswordSchema, type ForgotPasswordValues } from '../schemas';

/**
 * Parolni tiklashning 1-qadami (topshiriq 2.5).
 * Javob raqam tizimda bor-yo'qligini OSHKOR QILMAYDI — matn har doim bir xil.
 */
export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phone: '' },
  });

  const phoneValue = useWatch({ control: form.control, name: 'phone' });

  const mutation = useMutation({
    mutationFn: (values: ForgotPasswordValues) => authApi.forgotPassword(values.phone),
    onSuccess: (response, values) => {
      if (isTelegramLinkRequired(response)) {
        startAuthFlow('reset', values.phone, {
          linkToken: response.linkToken,
          botUrl: response.botUrl,
          linkExpiresAt: response.linkExpiresAt,
        });
        void navigate('/login/telegram');
        return;
      }

      startAuthFlow('reset', values.phone, {
        expiresAt: response.expiresAt,
        resendAvailableAt: response.resendAvailableAt,
        devCode: response.code ?? null,
      });
      void navigate('/login/reset-password');
    },
    onError: (error, values) => {
      // Raqam topilmasa ham foydalanuvchiga bir xil natija ko'rsatamiz:
      // mavjudlikni oshkor qilmaslik uchun keyingi qadamga o'tkazamiz.
      if (isApiError(error) && (error.status === 404 || error.status === 400)) {
        startAuthFlow('reset', values.phone);
        void navigate('/login/reset-password');
      }
    },
    meta: { silentStatuses: [400, 404] },
  });

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-[22px]">{t('forgot.title')}</CardTitle>
        <CardDescription>{t('forgot.subtitle')}</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          noValidate
          onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="phone">{t('signIn.phone')}</Label>
            <PhoneInput
              id="phone"
              value={phoneValue}
              onChange={(value) =>
                form.setValue('phone', value, { shouldValidate: form.formState.isSubmitted })
              }
              disabled={mutation.isPending}
              aria-invalid={Boolean(form.formState.errors.phone)}
            />
            {form.formState.errors.phone ? (
              <p role="alert" className="text-destructive text-[13px]">
                {t(form.formState.errors.phone.message ?? '')}
              </p>
            ) : null}
          </div>

          <Button type="submit" className="min-h-touch w-full" disabled={mutation.isPending}>
            {t('forgot.submit')}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="min-h-touch w-full"
            onClick={() => void navigate('/login')}
          >
            {t('otp.backToLogin')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
