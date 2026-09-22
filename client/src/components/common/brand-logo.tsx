import { cn } from '@/lib/utils';

/**
 * HisobX brendi: emerald fonli "H" ikonkasi + matnli logotip.
 * PWA ikonkalari ham shu shakldan olingan.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        'bg-primary text-primary-foreground flex size-8 shrink-0 items-center justify-center rounded-xl text-lg leading-none font-bold',
        className,
      )}
    >
      H
    </span>
  );
}

export function BrandLogo({
  className,
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2', className)}>
      <BrandMark />
      {showText ? (
        <span className="text-lg font-semibold tracking-tight">
          Hisob<span className="text-primary">X</span>
        </span>
      ) : null}
    </span>
  );
}
