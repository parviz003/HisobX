import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { toApiError } from '@/lib/api/errors';
import { deviceRemovalMessage } from '../api/device-limit';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { ErrorState } from '@/components/common/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { authApi } from '../api/auth-api';
import { authKeys } from '../api/queryKeys';
import type { Device } from '../api/types';
import { DeviceCard } from './device-card';

type DeviceLimitDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Xato bilan kelgan ro'yxat; bo'sh bo'lsa alohida so'rov yuboriladi. */
  devices: Device[];
  /** Qurilma chiqarilgach login avtomatik qayta uriniladi. */
  onFreed: () => void;
  retrying?: boolean;
};

/**
 * Qurilma limiti to'lganda ochiladi (topshiriq 2.6).
 * Bittasini chiqarib yuborgach, kirish avtomatik qayta uriniladi.
 */
export function DeviceLimitDialog({
  open,
  onOpenChange,
  devices,
  onFreed,
  retrying = false,
}: DeviceLimitDialogProps) {
  const { t } = useTranslation(['auth', 'common']);
  const queryClient = useQueryClient();
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Backend xato tanasida ro'yxat bermagan bo'lsa, o'zimiz so'raymiz.
  const needsFetch = open && devices.length === 0;
  const query = useQuery({
    queryKey: authKeys.devices(),
    queryFn: ({ signal }) => authApi.devices(signal),
    enabled: needsFetch,
  });

  const list = devices.length > 0 ? devices : (query.data ?? []);

  const removeMutation = useMutation({
    mutationFn: (id: number) => authApi.removeDevice(id),
    onSuccess: async () => {
      toast.success(t('auth:deviceLimit.removed'));
      await queryClient.invalidateQueries({ queryKey: authKeys.devices() });
      onFreed();
    },
    onError: (error) => {
      const message = deviceRemovalMessage(toApiError(error));
      toast.error(t(message.key, message.params));
    },
    onSettled: () => setRemovingId(null),
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('auth:deviceLimit.title')}
      description={t('auth:deviceLimit.body')}
      footer={
        <Button
          variant="outline"
          className="min-h-touch w-full sm:w-auto"
          onClick={() => onOpenChange(false)}
          disabled={retrying}
        >
          {t('common:actions.cancel')}
        </Button>
      }
    >
      {needsFetch && query.isLoading ? (
        <div className="space-y-2 py-2">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      ) : needsFetch && query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : (
        <ul className="space-y-2 py-2">
          {list.map((device) => {
            // Backend 24 soat qoidasini qo'llaydi; `isCurrent` ni ham chiqarib
            // yubormaymiz, aks holda foydalanuvchi o'zini uzib qo'yadi.
            const disabled =
              retrying || device.isCurrent === true || removingId !== null;

            return (
              <li key={device.deviceId}>
                <DeviceCard
                  device={device}
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-h-touch text-destructive"
                      disabled={disabled}
                      onClick={() => {
                        setRemovingId(device.deviceId);
                        removeMutation.mutate(device.deviceId);
                      }}
                    >
                      {removingId === device.deviceId
                        ? t('common:state.loading')
                        : t('auth:deviceLimit.remove')}
                    </Button>
                  }
                />
              </li>
            );
          })}
        </ul>
      )}

      {retrying ? (
        <p className="text-muted-foreground py-2 text-center text-[13px]">
          {t('auth:deviceLimit.retrying')}
        </p>
      ) : null}
    </ResponsiveDialog>
  );
}
