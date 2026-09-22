import { NavLink } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { navItemsFor } from '@/app/navigation';
import type { Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type BottomTabBarProps = {
  role: Role;
  onOpenMore: () => void;
};

/**
 * Telefon'dagi doimiy pastki navigatsiya. Maksimum 5 element:
 * 4 tasi rolga qarab, oxirgisi doim "Ko'proq".
 */
export function BottomTabBar({ role, onOpenMore }: BottomTabBarProps) {
  const { t } = useTranslation('nav');
  const tabs = navItemsFor(role, 'tab').slice(0, 4);

  return (
    <nav
      aria-label={t('menu')}
      className="bg-card pb-safe fixed inset-x-0 bottom-0 z-40 border-t md:hidden"
    >
      <ul className="grid grid-cols-5">
        {tabs.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'min-h-touch flex flex-col items-center justify-center gap-1 px-1 py-2 transition-colors duration-150',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'flex items-center justify-center rounded-xl transition-colors duration-150',
                      // Savdo tugmasi ajratib ko'rsatiladi — eng ko'p bosiladigan amal.
                      item.highlight
                        ? 'bg-primary text-primary-foreground -mt-5 size-12 shadow-lg'
                        : 'size-6',
                      !item.highlight && isActive && 'text-primary',
                    )}
                  >
                    <item.icon className={item.highlight ? 'size-6' : 'size-5'} aria-hidden />
                  </span>
                  <span className="text-[11px] leading-none font-medium">
                    {t(item.labelKey)}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}

        <li>
          <button
            type="button"
            onClick={onOpenMore}
            className="min-h-touch text-muted-foreground flex w-full flex-col items-center justify-center gap-1 px-1 py-2"
          >
            <span className="flex size-6 items-center justify-center">
              <MoreHorizontal className="size-5" aria-hidden />
            </span>
            <span className="text-[11px] leading-none font-medium">{t('more')}</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
