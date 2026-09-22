import type { ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { ThemeProvider } from '@/app/providers/theme-provider';

/** Testlarda qayta urinish va keshsiz toza klient. */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: ReactNode,
  options: RenderOptions & { queryClient?: QueryClient } = {},
) {
  const { queryClient = createTestQueryClient(), ...rest } = options;

  return render(
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </ThemeProvider>
    </I18nextProvider>,
    rest,
  );
}

/** Router talab qiladigan sahifalar uchun. */
export function renderRoute(
  routes: RouteObject[],
  initialEntries: string[] = ['/'],
  options: { queryClient?: QueryClient } = {},
) {
  const router = createMemoryRouter(routes, { initialEntries });
  return {
    router,
    ...renderWithProviders(<RouterProvider router={router} />, options),
  };
}
