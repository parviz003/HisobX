import { Moon, Sun, Laptop, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTheme, type Theme } from '@/hooks/use-theme';
import { useLanguage } from '@/hooks/use-language';

const THEME_OPTIONS: { value: Theme; icon: typeof Sun; labelKey: string }[] = [
  { value: 'light', icon: Sun, labelKey: 'theme.light' },
  { value: 'dark', icon: Moon, labelKey: 'theme.dark' },
  { value: 'system', icon: Laptop, labelKey: 'theme.system' },
];

/** Til va tema tanlovi — profil sahifasida va "Ko'proq" sheet'ida takrorlanadi. */
export function PreferencesCard() {
  const { t } = useTranslation(['auth', 'common']);
  const { theme, setTheme } = useTheme();
  const { language, languages, setLanguage } = useLanguage();

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">{t('auth:profile.preferences')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
                aria-pressed={theme === option.value}
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
                aria-pressed={language === code}
                onClick={() => setLanguage(code)}
              >
                {t(`common:language.${code}`)}
              </Button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
