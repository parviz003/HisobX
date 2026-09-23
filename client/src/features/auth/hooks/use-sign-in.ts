import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router';
import { useMutation } from '@tanstack/react-query';
import { isApiError, type ApiError } from '@/lib/api/errors';
import { authApi } from '../api/auth-api';
import { deviceLimitDevices } from '../api/device-limit';
import { startAuthFlow } from '../api/auth-flow';
import { isTelegramLinkRequired, type Device, type SignInResponse } from '../api/types';

type SignInInput = { phone: string; password: string };

/**
 * Kirish oqimi (topshiriq 2.1, 2.2, 2.4, 2.6):
 * signin → Telegram ulanish yoki OTP ekrani.
 * Qurilma limiti va 429 alohida boshqariladi.
 */
export function useSignIn() {
  const navigate = useNavigate();
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [deviceLimit, setDeviceLimit] = useState<Device[] | null>(null);
  const [lastInput, setLastInput] = useState<SignInInput | null>(null);

  const goToNextStep = useCallback(
    (phone: string, response: SignInResponse) => {
      if (isTelegramLinkRequired(response)) {
        startAuthFlow('signin', phone, {
          linkToken: response.linkToken,
          botUrl: response.botUrl,
          linkExpiresAt: response.linkExpiresAt,
        });
        void navigate('/login/telegram');
        return;
      }

      startAuthFlow('signin', phone, {
        expiresAt: response.expiresAt,
        resendAvailableAt: response.resendAvailableAt,
        windowExpiresAt: response.windowExpiresAt ?? null,
        devCode: response.code ?? null,
        qrToken: response.qrToken ?? null,
        qrBotUrl: response.qrBotUrl ?? null,
      });
      void navigate('/login/otp');
    },
    [navigate],
  );

  const mutation = useMutation({
    mutationFn: ({ phone, password }: SignInInput) => authApi.signIn(phone, password),
    onMutate: (input) => {
      setLastInput(input);
      setDeviceLimit(null);
    },
    onSuccess: (response, input) => goToNextStep(input.phone, response),
    onError: (error) => {
      if (!isApiError(error)) return;

      if (error.status === 429 && error.retryAfter) {
        setBlockedUntil(new Date(Date.now() + error.retryAfter * 1000).toISOString());
        return;
      }

      const devices = deviceLimitDevices(error);
      if (devices !== null) setDeviceLimit(devices);
    },
    // 429 va qurilma limiti toast'siz, ekranning o'zida ko'rsatiladi.
    meta: { silentStatuses: [429] },
  });

  /** Qurilma chiqarilgach chaqiriladi — kirish o'zi qayta uriniladi. */
  const retryAfterDeviceFreed = useCallback(() => {
    if (!lastInput) return;
    mutation.mutate(lastInput);
  }, [lastInput, mutation]);

  return {
    signIn: mutation.mutate,
    isPending: mutation.isPending,
    error: isApiError(mutation.error) ? (mutation.error as ApiError) : null,
    blockedUntil,
    clearBlock: () => setBlockedUntil(null),
    deviceLimit,
    closeDeviceLimit: () => setDeviceLimit(null),
    retryAfterDeviceFreed,
  };
}
