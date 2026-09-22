import { NavLink } from 'react-router';
import { useTranslation } from 'react-i18next';
import { navItemsFor, type NavItem } from '@/app/navigation';
import { BrandLogo } from '@/components/common/brand-logo';
import type { Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';

/** Planshet/kompyuterda chap tomondagi navigatsiya. */
export function AppSidebar({ role }: { role: Role }) {
  const { t } = useTranslation('nav');

  // Kompyuterda bo'linish shart emas — hamma bo'lim bitta ro'yxatda.
  const items: NavItem[] = [...navItemsFor(role, 'tab'), ...navItemsFor(role, 'more')].filter(
    (item, index, all) => all.findIndex((other) => other.path === item.path) === index,
  );

  return (
    <aside className="bg-sidebar hidden w-60 shrink-0 border-r md:flex md:flex-col">
      <div className="flex h-16 items-center px-5">
        <BrandLogo />
      </div>
      <nav aria-label={t('menu')} className="flex-1 overflow-y-auto px-3 pb-4">
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors duration-150',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent',
                  )
                }
              >
                <item.icon className="size-5 shrink-0" aria-hidden />
                {t(item.labelKey)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
