import { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type PasswordFieldProps = Omit<React.ComponentProps<typeof Input>, 'type'> & {
  /** Yangi parol maydonlarida brauzerga to'g'ri maslahat berish uchun. */
  isNew?: boolean;
};

/** Parol maydoni — ko'rsatish/yashirish tugmasi bilan. */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ className, isNew = false, ...props }, ref) {
    const { t } = useTranslation('auth');
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <Input
          {...props}
          ref={ref}
          type={visible ? 'text' : 'password'}
          autoComplete={isNew ? 'new-password' : 'current-password'}
          className={cn('pr-12', className)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute inset-y-0 right-0 my-auto size-10"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? t('signIn.hidePassword') : t('signIn.showPassword')}
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </Button>
      </div>
    );
  },
);
