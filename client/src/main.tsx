import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';

import '@/lib/i18n';
import './index.css';
import { AppProviders } from '@/app/providers';
import { router } from '@/app/router';
import { startMocks } from '@/mocks/browser';

async function bootstrap() {
  // MSW faqat VITE_USE_MOCKS=true bo'lganda ishga tushadi.
  await startMocks();

  const container = document.getElementById('root');
  if (!container) throw new Error('#root topilmadi');

  createRoot(container).render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>,
  );
}

void bootstrap();
