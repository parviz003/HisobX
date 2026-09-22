import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { isApiError } from '@/lib/api/errors';

/** 401 refresh interceptor'da hal qilinadi; bularda qayta urinish mantiqsiz. */
const NO_RETRY_STATUSES = [401, 403, 404, 429];

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error) => {
          if (isApiError(error) && NO_RETRY_STATUSES.includes(error.status)) return false;
          return failureCount < 2;
        },
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
        onError: (error) => {
          if (!isApiError(error)) {
            toast.error(i18n.t('errors:generic'));
            return;
          }
          // 400 maydon xatolari formada ko'rsatiladi — toast chiqarmaymiz.
          if (error.status === 400 && error.fieldErrors) return;

          const message = error.message.startsWith('errors.')
            ? i18n.t(`errors:${error.message.slice('errors.'.length)}`, {
                time: error.retryAfter ? `${error.retryAfter} s` : '',
              })
            : error.message;
          toast.error(message);
        },
      },
    },
  });
}

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(createQueryClient);
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
