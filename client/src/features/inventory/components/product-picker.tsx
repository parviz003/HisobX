import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, ScanLine } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { BarcodeScanner } from '@/components/common/barcode-scanner';
import { productsApi } from '@/features/products/api/products-api';
import { productKeys } from '@/features/products/api/queryKeys';
import { formatQuantity } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/features/products/api/types';

/** Mahsulotni qidirib yoki skanerlab tanlash (kirim va chiqim formalarida). */
export function ProductPicker({
  value,
  onChange,
  disabled,
}: {
  value: Product | null;
  onChange: (product: Product | null) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation('catalog');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);

  const query = useQuery({
    queryKey: productKeys.list({ search: search || undefined, limit: 30 }),
    queryFn: ({ signal }) =>
      productsApi.list({ search: search || undefined, limit: 30 }, signal),
    enabled: open,
  });

  const products = query.data?.items ?? [];

  return (
    <div className="flex gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className="min-h-touch flex-1 justify-between font-normal"
          >
            <span className="truncate">{value?.name ?? t('inventory.selectProduct')}</span>
            <ChevronsUpDown className="size-4 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-[min(22rem,90vw)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={t('products.searchPlaceholder')}
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>{t('products.empty')}</CommandEmpty>
              <CommandGroup>
                {products.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={String(product.id)}
                    onSelect={() => {
                      onChange(product);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'size-4',
                        value?.id === product.id ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                    <span className="flex-1 truncate">{product.name}</span>
                    <span className="text-muted-foreground tabular text-[13px]">
                      {formatQuantity(product.stock, product.unit)}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        variant="outline"
        size="icon"
        className="min-h-touch shrink-0"
        aria-label={t('products.scan')}
        disabled={disabled}
        onClick={() => setScannerOpen(true)}
      >
        <ScanLine className="size-4" />
      </Button>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        // TODO(backend): `search` barcode bo'yicha qidirmaydi — skanerlangan
        // qiymat qidiruv maydoniga qo'yiladi, topilmasa foydalanuvchi ko'radi.
        onDetected={(code) => {
          setSearch(code);
          setOpen(true);
        }}
      />
    </div>
  );
}
