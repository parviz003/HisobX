import { Skeleton } from '@/components/ui/skeleton';

/** Sahifa yuklanayotganda ko'rsatiladigan skeleton (spinner emas). */
export function FullPageSpinner() {
  return (
    <div className="flex min-h-dvh flex-col gap-4 p-4" aria-busy="true">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-48 w-full rounded-2xl" />
    </div>
  );
}
