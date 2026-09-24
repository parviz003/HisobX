import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { LogOut, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/common/page-header';
import { ImageUpload } from '@/components/common/image-upload';
import { PhoneInput } from '@/components/common/phone-input';
import { StatusBadge } from '@/components/common/status-badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { authApi } from '@/features/auth/api/auth-api';
import { authKeys } from '@/features/auth/api/queryKeys';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { PasswordField } from '@/features/auth/components/password-field';
import { PasswordStrength } from '@/features/auth/components/password-strength';
import {
  changePasswordSchema,
  profileSchema,
  type ChangePasswordValues,
  type ProfileValues,
} from '@/features/auth/schemas';
import { emitSessionEvent, setImpersonatedStoreId } from '@/lib/api/session';
import { api } from '@/lib/api/client';
import { profileApi } from '../api/profile-api';
import { PreferencesCard } from '../components/preferences-card';

/** Profil: ism, telefon, avatar, parol, til/tema, Telegram holati (topshiriq 2.8). */
export default function ProfilePage() {
  const { t } = useTranslation(['auth', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { fullName: user?.fullName ?? '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const profilePhone = useWatch({ control: profileForm.control, name: 'phone' });
  const newPassword = useWatch({ control: passwordForm.control, name: 'password' });

  const refreshMe = () => queryClient.invalidateQueries({ queryKey: authKeys.me() });

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileValues) => {
      await profileApi.update(values);
      if (avatarFile) await profileApi.uploadImage(avatarFile);
    },
    onSuccess: async () => {
      setAvatarFile(null);
      await refreshMe();
      toast.success(t('auth:profile.saved'));
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: () => profileApi.removeImage(),
    onSuccess: refreshMe,
  });

  const passwordMutation = useMutation({
    mutationFn: (values: ChangePasswordValues) => profileApi.changePassword(values.password),
    onSuccess: () => {
      passwordForm.reset();
      toast.success(t('auth:profile.passwordChanged'));
    },
  });

  const signOut = async () => {
    try {
      await authApi.signOut();
    } catch {
      // Cookie eskirgan bo'lsa ham foydalanuvchini chiqaramiz.
    }
    setImpersonatedStoreId(null);
    queryClient.clear();
    emitSessionEvent({ type: 'signed-out', reason: 'manual' });
    void navigate('/login', { replace: true });
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('auth:profile.title')} />

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t('auth:profile.personal')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={(event) => void profileForm.handleSubmit((values) => updateMutation.mutate(values))(event)}
            className="space-y-4"
          >
            <ImageUpload
              label={t('auth:profile.avatar')}
              currentUrl={user?.imageUrl ?? null}
              file={avatarFile}
              onFileChange={setAvatarFile}
              onRemoveCurrent={() => removeImageMutation.mutate()}
              disabled={updateMutation.isPending}
            />

            <div className="space-y-2">
              <Label htmlFor="fullName">{t('auth:profile.fullName')}</Label>
              <Input
                id="fullName"
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(profileForm.formState.errors.fullName)}
                {...profileForm.register('fullName')}
              />
              {profileForm.formState.errors.fullName ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${profileForm.formState.errors.fullName.message}`)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-phone">{t('auth:profile.phone')}</Label>
              <PhoneInput
                id="profile-phone"
                value={profilePhone}
                onChange={(value) => profileForm.setValue('phone', value, { shouldValidate: true })}
                disabled={updateMutation.isPending}
                aria-invalid={Boolean(profileForm.formState.errors.phone)}
              />
              {profileForm.formState.errors.phone ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${profileForm.formState.errors.phone.message}`)}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-muted/20 p-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-medium">{t('auth:profile.telegramStatus')}:</span>
                <StatusBadge tone={user?.telegramLinked ? 'success' : 'neutral'}>
                  <Send className="mr-1 size-3" aria-hidden />
                  {user?.telegramLinked
                    ? t('auth:profile.telegramLinked')
                    : t('auth:profile.telegramNotLinked')}
                </StatusBadge>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={async () => {
                  try {
                    const res = await api.post<any>('/telegram/invite');
                    const botUrl = res.data?.data?.botUrl || res.data?.botUrl;
                    if (botUrl) {
                      window.open(botUrl, '_blank', 'noopener,noreferrer');
                    } else {
                      toast.error('Havola topilmadi');
                    }
                  } catch {
                    toast.error('Telegram botga ulanish havolasini olib bo‘lmadi');
                  }
                }}
              >
                <Send className="size-3.5" />
                <span>{user?.telegramLinked ? 'Qayta ulash' : 'Telegramni ulash'}</span>
              </Button>
            </div>

            <Button
              type="submit"
              className="min-h-touch w-full sm:w-auto"
              disabled={updateMutation.isPending}
            >
              {t('common:actions.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="text-base">{t('auth:profile.changePassword')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            noValidate
            onSubmit={(event) => void passwordForm.handleSubmit((values) => passwordMutation.mutate(values))(event)}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="new-password">{t('auth:profile.newPassword')}</Label>
              <PasswordField
                id="new-password"
                isNew
                disabled={passwordMutation.isPending}
                aria-invalid={Boolean(passwordForm.formState.errors.password)}
                {...passwordForm.register('password')}
              />
              <PasswordStrength value={newPassword} />
              {passwordForm.formState.errors.password ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${passwordForm.formState.errors.password.message}`)}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">{t('auth:profile.confirmPassword')}</Label>
              <PasswordField
                id="confirm-new-password"
                isNew
                disabled={passwordMutation.isPending}
                aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                {...passwordForm.register('confirmPassword')}
              />
              {passwordForm.formState.errors.confirmPassword ? (
                <p role="alert" className="text-destructive text-[13px]">
                  {t(`auth:${passwordForm.formState.errors.confirmPassword.message}`)}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="outline"
              className="min-h-touch w-full sm:w-auto"
              disabled={passwordMutation.isPending}
            >
              {t('auth:profile.changePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <PreferencesCard />

      <Button
        variant="outline"
        className="min-h-touch text-destructive w-full"
        onClick={() => setSignOutOpen(true)}
      >
        <LogOut className="size-4" aria-hidden />
        {t('common:actions.signOut')}
      </Button>

      <ConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title={t('auth:profile.signOutTitle')}
        description={t('auth:profile.signOutBody')}
        confirmLabel={t('common:actions.signOut')}
        destructive
        onConfirm={() => void signOut()}
      />
    </div>
  );
}
