import type { LucideIcon } from 'lucide-react';
import { MoneyText } from '@/components/common/money-text';
import { Skeleton } from '@/components/ui/skeleton';

interface Props {
  title: string;
  value: number;
  isMoney?: boolean;
  unit?: string;
  icon: LucideIcon;
  colorClass?: string;
  subtext?: string;
  isLoading?: boolean;
}

export function KpiCard({
  title,
  value,
  isMoney = true,
  unit,
  icon: Icon,
  colorClass = 'text-primary bg-primary/10',
  subtext,
  isLoading,
}: Props) {
  return (
    <div className="bg-card rounded-2xl border p-4 flex flex-col justify-between space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{title}</span>
        <div className={`size-8 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="size-4" />
        </div>
      </div>

      <div>
        {isLoading ? (
          <Skeleton className="h-8 w-28 rounded-lg" />
        ) : (
          <div className="text-2xl font-bold tracking-tight">
            {isMoney ? <MoneyText value={value} /> : `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`}
          </div>
        )}
        {subtext && <p className="text-[11px] text-muted-foreground mt-0.5">{subtext}</p>}
      </div>
    </div>
  );
}
