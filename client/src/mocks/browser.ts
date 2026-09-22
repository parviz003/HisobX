/**
 * MSW faqat `VITE_USE_MOCKS=true` bo'lganda yuklanadi.
 * Import dinamik — shu sabab production bundle'ga MSW umuman tushmaydi.
 */
export async function startMocks() {
  if (import.meta.env.VITE_USE_MOCKS !== 'true') return;

  const [{ setupWorker }, { handlers }] = await Promise.all([
    import('msw/browser'),
    import('./handlers'),
  ]);

  const worker = setupWorker(...handlers);
  await worker.start({
    // Mock'da yo'q so'rovlar haqiqiy backend'ga o'tadi.
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
