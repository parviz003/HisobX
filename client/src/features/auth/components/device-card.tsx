import { Laptop, Smartphone, Tablet, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { StatusBadge } from '@/components/common/status-badge';
import { formatDateTime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Device } from '../api/types';

/**
 * Backend qurilmani bitta erkin matn sifatida beradi ("Chrome Desktop Device"),
 * shuning uchun turni shu matndan taxmin qilamiz.
 */
function DeviceIcon({ label }: { label: string }) {
  const value = label.toLowerCase();

  if (/(mobile|phone|android|iphone|smartphone)/.test(value)) {
    return <Smartphone className="size-5" aria-hidden />;
  }
  if (/tablet|ipad/.test(value)) {
    return <Tablet className="size-5" aria-hidden />;
  }
  if (/desktop|windows|mac|linux/.test(value)) {
    return <Monitor className="size-5" aria-hidden />;
  }
  return <Laptop className="size-5" aria-hidden />;
}

export function DeviceCard({
  device,
  action,
  className,
}: {
  device: Device;
  action?: React.ReactNode;
  className?: string;
}) {
  const { t } = useTranslation('auth');
  const name = device.device?.trim() || t('devices.unknown');

  return (
    <div className={cn('bg-card flex items-start gap-3 rounded-2xl border p-4', className)}>
      <div className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
        <DeviceIcon label={name} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-[15px] font-medium">{name}</p>
          {/* TODO(backend): javobda `isCurrent` yo'q — belgi faqat kelsa chiqadi. */}
          {device.isCurrent ? (
            <StatusBadge tone="success">{t('devices.current')}</StatusBadge>
          ) : null}
        </div>

        <p className="text-muted-foreground mt-1 text-[13px]">
          {t('devices.added', { value: formatDateTime(device.createdAt) })}
        </p>
        {device.lastActiveAt ? (
          <p className="text-muted-foreground text-[13px]">
            {t('devices.lastActive', { value: formatDateTime(device.lastActiveAt) })}
          </p>
        ) : null}
        {device.ip ? <p className="text-muted-foreground text-[13px]">IP: {device.ip}</p> : null}
      </div>

      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
