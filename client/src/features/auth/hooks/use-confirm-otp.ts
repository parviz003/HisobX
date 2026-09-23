import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { isApiError } from '@/lib/api/errors';
import { homePathFor } from '@/app/navigation';
import { authApi } from '../api/auth-api';
import { authKeys } from '../api/queryKeys';
import { clearAuthFlow, patchAuthFlow, useAuthFlow } from '../api/auth-flow';
import { isTelegramLinkRequired } from '../api/types';
import type { CurrentUser } from '../api/types';

/**
 * OTP tasdiqlash va qayta yuborish (topshiriq 2.3).
 * Tasdiqlangach backend cookie o'rnatadi, biz /users/me ni o'qib rolga mos
 * sahifaga o'tamiz.
 */
export function useConfirmOtp(redirectTo: string | null) {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const flow = useAuthFlow();
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);

  const confirm = useMutation({
    mutationFn: (code: string) => authApi.confirm(flow?.phone ?? '', code),
    onSuccess: async () => {
      clearAuthFlow();
      // Cookie o'rnatildi — foydalanuvchini yangidan o'qiymiz.
      const user = await queryClient.fetchQuery<CurrentUser>({
        queryKey: authKeys.me(),
        queryFn: ({ signal }) => authApi.me(signal),
      });
      void navigate(redirectTo || homePathFor(user.role), { replace: true });
    },
    onError: (error) => {
      if (!isApiError(error)) return;

      if (error.status === 429 && error.retryAfter) {
        setBlockedUntil(new Date(Date.now() + error.retryAfter * 1000).toISOString());
        return;
      }

      // Har bir xato urinish qolgan urinishlar sonini kamaytiradi.
      if (flow) patchAuthFlow({ attemptsLeft: Math.max(0, flow.attemptsLeft - 1) });
    },
    meta: { silentStatuses: [429] },
  });

  const resend = useMutation({
    mutationFn: () => authApi.resendOtp(flow?.phone ?? ''),
    onSuccess: (response) => {
      if (isTelegramLinkRequired(response)) {
        patchAuthFlow({
          linkToken: response.linkToken,
          botUrl: response.botUrl,
          linkExpiresAt: response.linkExpiresAt,
        });
        void navigate('/login/telegram', { replace: true });
        return;
      }
      patchAuthFlow({
        expiresAt: response.expiresAt,
        resendAvailableAt: response.resendAvailableAt,
        devCode: response.code ?? null,
        // Yangi kod — urinishlar ham yangilanadi.
        attemptsLeft: flow?.attemptsLeft ?? 3,
        qrToken: 'qrToken' in response ? response.qrToken : flow?.qrToken,
        qrBotUrl: 'qrBotUrl' in response ? response.qrBotUrl : flow?.qrBotUrl,
      });
      toast.success(t('otp.resent'));
    },
    onError: (error) => {
      if (isApiError(error) && error.status === 429 && error.retryAfter) {
        patchAuthFlow({
          resendAvailableAt: new Date(Date.now() + error.retryAfter * 1000).toISOString(),
        });
      }
    },
    meta: { silentStatuses: [429] },
  });

  const backToLogin = useCallback(() => {
    clearAuthFlow();
    void navigate('/login', { replace: true });
  }, [navigate]);

  return {
    flow,
    confirm: confirm.mutate,
    isConfirming: confirm.isPending,
    confirmError: isApiError(confirm.error) ? confirm.error : null,
    resend: resend.mutate,
    isResending: resend.isPending,
    blockedUntil,
    backToLogin,
  };
}
