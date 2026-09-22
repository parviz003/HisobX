/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/react" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_PROXY_TARGET: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_USE_MOCKS: string;
  readonly VITE_TELEGRAM_BOT_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
