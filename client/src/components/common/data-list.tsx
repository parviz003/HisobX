import { useIsDesktop } from '@/hooks/use-media-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type DataListColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Telefon kartasida bu ustun ko'rsatilmaydi. */
  hideOnMobile?: boolean;
};

type DataListProps<T> = {
  rows: readonly T[];
  columns: readonly DataListColumn<T>[];
  rowKey: (row: T) => string | number;
  /** Telefon'da har bir yozuv shu ko'rinishda chiziladi. */
  renderCard: (row: T) => React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  empty?: React.ReactNode;
  className?: string;
};

/**
 * Telefon'da kartalar ro'yxati, kompyuterda jadval (4-bo'lim, 5-qoida).
 */
export function DataList<T>({
  rows,
  columns,
  rowKey,
  renderCard,
  onRowClick,
  loading = false,
  skeletonRows = 5,
  empty,
  className,
}: DataListProps<T>) {
  const isDesktop = useIsDesktop();

  if (loading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: skeletonRows }).map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{empty}</>;

  if (!isDesktop) {
    return (
      <ul className={cn('space-y-2', className)}>
        {rows.map((row) => (
          <li key={rowKey(row)}>
            {onRowClick ? (
              <button
                type="button"
                onClick={() => onRowClick(row)}
                className="focus-visible:ring-ring w-full rounded-2xl text-left focus-visible:ring-2 focus-visible:outline-none"
              >
                {renderCard(row)}
              </button>
            ) : (
              renderCard(row)
            )}
          </li>
        ))}
      </ul>
    );
  }

  const visibleColumns = columns.filter((column) => !column.hideOnMobile || isDesktop);

  return (
    <div className={cn('bg-card overflow-hidden rounded-2xl border', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            {visibleColumns.map((column) => (
              <TableHead key={column.key} className={column.className}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer' : undefined}
            >
              {visibleColumns.map((column) => (
                <TableCell key={column.key} className={column.className}>
                  {column.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
