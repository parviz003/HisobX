import { useNavigate } from 'react-router';
import {
  Moon,
  Sun,
  Laptop,
  Languages,
  User,
  Smartphone,
  Store,
  Bell,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { useLanguage } from '@/hooks/use-language';
import type { Role } from '@/lib/permissions';

type SettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
  onSignOut?: () => void;
};

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Laptop, labelKey: 'theme.system' },
];

export function SettingsDialog({
  open,
  onOpenChange,
  role,
  onSignOut,
}: SettingsDialogProps) {
  const { t } = useTranslation(['nav', 'common']);
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { language, languages, setLanguage } = useLanguage();

  const handleNavigate = (path: string) => {
    onOpenChange(false);
    void navigate(path);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md gap-5 p-6 rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-semibold">
            {t('nav:settings')}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t('common:settings.subtitle', 'Tizim ko‘rinishi va til sozlamalari')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ko'rinish (Mavzu) */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('common:theme.label')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {THEME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  size="sm"
                  variant={theme === option.value ? 'default' : 'outline'}
                  className="flex items-center justify-center gap-1.5 h-9 text-xs"
                  onClick={() => setTheme(option.value)}
                >
                  <option.icon className="size-3.5" aria-hidden />
                  <span>{t(`common:${option.labelKey}`)}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Til */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Languages className="size-3.5" aria-hidden />
              {t('common:language.label')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {languages.map((code) => (
                <Button
                  key={code}
                  type="button"
                  size="sm"
                  variant={language === code ? 'default' : 'outline'}
                  className="h-9 text-xs"
                  onClick={() => setLanguage(code)}
                >
                  {t(`common:language.${code}`)}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tezkor havolalar */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t('common:quickLinks', 'Tezkor bo‘limlar')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() => handleNavigate('/profile')}
              >
                <User className="size-3.5 text-muted-foreground" />
                <span>{t('nav:profile')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() => handleNavigate('/devices')}
              >
                <Smartphone className="size-3.5 text-muted-foreground" />
                <span>{t('nav:devices')}</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="justify-start gap-2 h-9 text-xs"
                onClick={() => handleNavigate('/notifications')}
              >
                <Bell className="size-3.5 text-muted-foreground" />
                <span>{t('nav:notifications')}</span>
              </Button>

              {(role === 'ADMIN' || role === 'MANAGER' || role === 'SUPERADMIN') && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2 h-9 text-xs"
                  onClick={() => handleNavigate('/settings')}
                >
                  <Store className="size-3.5 text-muted-foreground" />
                  <span>{t('nav:storeSettings', 'Do‘kon')}</span>
                </Button>
              )}
            </div>
          </div>

          {onSignOut && (
            <>
              <Separator />
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-center gap-2 h-9 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onOpenChange(false);
                  onSignOut();
                }}
              >
                <LogOut className="size-4" aria-hidden />
                <span>{t('common:actions.signOut')}</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
