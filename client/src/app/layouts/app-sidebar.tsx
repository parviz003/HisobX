import { useState } from 'react';
import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Settings, LogOut } from 'lucide-react';
import { navItemsFor, type NavItem } from '@/app/navigation';
import { BrandLogo } from '@/components/common/brand-logo';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/use-auth';
import type { Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';
import { SettingsDialog } from './settings-dialog';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Admin',
  MANAGER: 'Menejer',
  SELLER: 'Sotuvchi',
  SUPERADMIN: 'Superadmin',
};

type AppSidebarProps = {
  role: Role;
  onSignOut?: () => void;
};

/** Planshet/kompyuterda chap tomondagi navigatsiya. */
export function AppSidebar({ role, onSignOut }: AppSidebarProps) {
  const { t } = useTranslation('nav');
  const { user } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Kompyuterda bo'linish shart emas — hamma bo'lim bitta ro'yxatda.
  const items: NavItem[] = [...navItemsFor(role, 'tab'), ...navItemsFor(role, 'more')].filter(
    (item, index, all) => all.findIndex((other) => other.path === item.path) === index,
  );

  const displayName = user?.fullName || user?.name || 'Foydalanuvchi';
  const roleLabel = ROLE_LABELS[role] ?? role;

  const initials = (() => {
    if (!displayName) return 'HX';
    const parts = displayName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  })();

  return (
    <>
      <aside className="bg-sidebar hidden w-64 shrink-0 border-r md:flex md:flex-col h-dvh sticky top-0">
        {/* Yuqori logotip */}
        <div className="flex h-16 items-center px-5 shrink-0 border-b">
          <BrandLogo />
        </div>

        {/* Asosiy navigatsiya ro'yxati */}
        <nav aria-label={t('menu')} className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-1">
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2 text-[14px] font-medium transition-colors duration-150',
                      isActive
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-xs'
                        : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
                    )
                  }
                >
                  <item.icon className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{t(item.labelKey)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Pastki profil va sozlamalar paneli */}
        <div className="p-3 border-t bg-sidebar/50 shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl p-1.5 transition-colors">
            {/* Avatar */}
            <Avatar className="size-10 border border-sidebar-border shrink-0 shadow-xs">
              {user?.imageUrl && <AvatarImage src={user.imageUrl} alt={displayName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>

            {/* Ism va Lavozim */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-sidebar-foreground leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground mt-0.5">
                {roleLabel}
              </p>
            </div>

            {/* Sozlamalar va Chiqish tugmalari */}
            <div className="flex items-center gap-0.5 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                title={t('settings')}
                aria-label={t('settings')}
                onClick={() => setSettingsOpen(true)}
              >
                <Settings className="size-4" />
              </Button>

              {onSignOut && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  title="Chiqish"
                  aria-label="Chiqish"
                  onClick={onSignOut}
                >
                  <LogOut className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Sozlamalar oynasi */}
      <SettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        role={role}
        onSignOut={onSignOut}
      />
    </>
  );
}
