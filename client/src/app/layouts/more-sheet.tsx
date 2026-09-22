import { useNavigate } from 'react-router';
import { LogOut, Moon, Sun, Laptop, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { navItemsFor } from '@/app/navigation';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { useLanguage } from '@/hooks/use-language';
import type { Role } from '@/lib/permissions';
import { cn } from '@/lib/utils';

type MoreSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onSignOut: () => void;
};

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Laptop, labelKey: 'theme.system' },
];

/** Telefon'da "Ko'proq" tugmasi ochadigan sheet: qolgan bo'limlar va sozlamalar. */
export function MoreSheet({ open, onOpenChange, role, onSignOut }: MoreSheetProps) {
  const { t } = useTranslation(['nav', 'common']);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, languages, setLanguage } = useLanguage();

  const items = navItemsFor(role, 'more');

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('nav:more')}</SheetTitle>
          <SheetDescription className="sr-only">{t('nav:menu')}</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 px-4 pb-2">
          {items.map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => {
                onOpenChange(false);
                void navigate(item.path);
              }}
              className="hover:bg-accent min-h-touch flex flex-col items-center gap-2 rounded-2xl p-3 text-center transition-colors duration-150"
            >
              <item.icon className="text-primary size-5" aria-hidden />
              <span className="text-[13px] leading-tight font-medium">{t(item.labelKey)}</span>
            </button>
          ))}
        </div>

        <Separator className="my-2" />

        <div className="space-y-4 px-4">
          <div>
            <p className="text-muted-foreground mb-2 text-[13px] font-medium">
              {t('common:theme.label')}
            </p>
            <div className="flex gap-2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={theme === option.value ? 'default' : 'outline'}
                  className="min-h-touch flex-1"
                  onClick={() => setTheme(option.value)}
                >
                  <option.icon className="size-4" aria-hidden />
                  <span className="text-[13px]">{t(`common:${option.labelKey}`)}</span>
                </Button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-[13px] font-medium">
              <Languages className="size-4" aria-hidden />
              {t('common:language.label')}
            </p>
            <div className="flex gap-2">
              {languages.map((code) => (
                <Button
                  key={code}
                  type="button"
                  variant={language === code ? 'default' : 'outline'}
                  className="min-h-touch flex-1"
                  onClick={() => setLanguage(code)}
                >
                  {t(`common:language.${code}`)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="pb-safe p-4">
          <Button
            type="button"
            variant="outline"
            className={cn('min-h-touch text-destructive w-full')}
            onClick={onSignOut}
          >
            <LogOut className="size-4" aria-hidden />
            {t('common:actions.signOut')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
