import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { toApiError } from '@/lib/api/errors';
import { deviceRemovalMessage } from '@/features/auth/api/device-limit';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { authApi } from '@/features/auth/api/auth-api';
import { authKeys } from '@/features/auth/api/queryKeys';
import { DeviceCard } from '@/features/auth/components/device-card';

/** Foydalanuvchining faol qurilmalari (topshiriq 2.7). */
export default function DevicesPage() {
  const { t } = useTranslation(['auth', 'common']);
  const queryClient = useQueryClient();
  const [pendingId, setPendingId] = useState<number | null>(null);

  const query = useQuery({
    queryKey: authKeys.devices(),
    queryFn: ({ signal }) => authApi.devices(signal),
  });

  const removeMutation = useMutation({
    mutationFn: (id: number) => authApi.removeDevice(id),
    onSuccess: async () => {
      toast.success(t('auth:deviceLimit.removed'));
      await queryClient.invalidateQueries({ queryKey: authKeys.devices() });
    },
    onError: (error) => {
      const message = deviceRemovalMessage(toApiError(error));
      toast.error(t(message.key, message.params));
    },
    onSettled: () => setPendingId(null),
  });

  const devices = query.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader title={t('auth:devices.title')} description={t('auth:devices.subtitle')} />

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : devices.length === 0 ? (
        <EmptyState icon={Smartphone} title={t('auth:devices.empty')} />
      ) : (
        <ul className="space-y-2">
          {devices.map((device) => (
            <li key={device.deviceId}>
              <DeviceCard
                device={device}
                action={
                  device.isCurrent ? null : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-touch text-destructive"
                      onClick={() => setPendingId(device.deviceId)}
                    >
                      {t('auth:deviceLimit.remove')}
                    </Button>
                  )
                }
              />
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingId !== null}
        onOpenChange={(open) => !open && setPendingId(null)}
        title={t('auth:devices.removeTitle')}
        description={t('auth:devices.removeBody')}
        confirmLabel={t('auth:deviceLimit.remove')}
        destructive
        loading={removeMutation.isPending}
        onConfirm={() => pendingId !== null && removeMutation.mutate(pendingId)}
      />
    </div>
  );
}
