import { Component, type ErrorInfo, type ReactNode } from 'react';
import i18n from '@/lib/i18n';

type State = { hasError: boolean };

/**
 * Global ErrorBoundary — komponentda kutilmagan xato bo'lsa, oq ekran o'rniga
 * tushunarli xabar ko'rsatadi.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO(10-bosqich): Sentry ulangach, xato shu yerdan yuboriladi.
    console.error('ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-semibold">{i18n.t('errors:crashTitle')}</p>
        <p className="text-muted-foreground max-w-sm text-sm">{i18n.t('errors:crashBody')}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="bg-primary text-primary-foreground min-h-touch mt-2 rounded-xl px-5 font-medium"
        >
          {i18n.t('common:actions.retry')}
        </button>
      </div>
    );
  }
}
