import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { BrandLogo } from '@/components/common/brand-logo';
import { OfflineBanner } from '@/components/common/offline-banner';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { notificationsApi, notificationKeys } from '@/features/notifications/api/notifications-api';
import { api } from '@/lib/api/client';
import { emitSessionEvent, setImpersonatedStoreId } from '@/lib/api/session';
import { AppSidebar } from './app-sidebar';
import { BottomTabBar } from './bottom-tab-bar';
import { MoreSheet } from './more-sheet';

/**
 * Ilovaning asosiy qobig'i.
 * Telefon: yuqorida header, pastda tab bar. Kompyuter: chapda sidebar.
 */
export function AppLayout() {
  const { t } = useTranslation(['nav', 'common']);
  const { role, impersonatedStoreId } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const signOut = async () => {
    try {
      await api.post('/auth/signout');
    } catch {
      // Cookie baribir eskirgan bo'lishi mumkin — foydalanuvchini chiqaramiz.
    }
    setImpersonatedStoreId(null);
    queryClient.clear();
    // Boshqa tab'lar ham chiqadi (BroadcastChannel).
    emitSessionEvent({ type: 'signed-out', reason: 'manual' });
    void navigate('/login', { replace: true });
  };

  if (!role) return null;

  const effectiveRole = role === 'SUPERADMIN' && Boolean(impersonatedStoreId) ? 'MANAGER' : role;

  const { data: unreadNotifications } = useQuery({
    queryKey: notificationKeys.list(false),
    queryFn: ({ signal }) => notificationsApi.list(false, signal),
    enabled: Boolean(role && (role !== 'SUPERADMIN' || impersonatedStoreId)),
    refetchInterval: 30000,
  });

  const unreadCount = unreadNotifications?.items?.length ?? 0;

  return (
    <div className="bg-background flex min-h-dvh">
      <AppSidebar role={effectiveRole} onSignOut={() => void signOut()} />

      <div className="flex min-w-0 flex-1 flex-col">
        <OfflineBanner />

        {role === 'SUPERADMIN' && Boolean(impersonatedStoreId) && (
          <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
              <span>
                Siz hozir <strong>#{impersonatedStoreId}</strong>-sonli do&apos;konni ko&apos;rish rejimidasiz (Faqat ko&apos;rish)
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs bg-background text-foreground hover:bg-muted"
              onClick={() => {
                setImpersonatedStoreId(null);
                void navigate('/stores');
              }}
            >
              Do&apos;konlar ro&apos;yxatiga qaytish
            </Button>
          </div>
        )}

        <header className="bg-card pt-safe sticky top-0 z-30 flex h-16 items-center gap-2 border-b px-4 md:h-16">
          <div className="md:hidden">
            <BrandLogo showText={false} />
          </div>
          <div className="flex-1" />

          <Button
            variant="ghost"
            size="icon"
            className="min-h-touch relative"
            aria-label={t('nav:notifications')}
            onClick={() => void navigate('/notifications')}
          >
            <Bell className="size-5" aria-hidden />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
            )}
          </Button>
        </header>

        {/* pb-28: pastki tab bar kontentni to'sib qolmasligi uchun */}
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 pt-4 pb-28 md:pb-8">
          <Outlet />
        </main>

        <BottomTabBar role={effectiveRole} onOpenMore={() => setMoreOpen(true)} />
      </div>

      <MoreSheet
        open={moreOpen}
        onOpenChange={setMoreOpen}
        role={effectiveRole}
        onSignOut={() => void signOut()}
      />
    </div>
  );
}

