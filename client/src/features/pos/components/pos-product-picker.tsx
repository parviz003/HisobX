import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package, ScanLine, Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MoneyText } from '@/components/common/money-text';
import { BarcodeScanner } from '@/components/common/barcode-scanner';
import { productsApi } from '@/features/products/api/products-api';
import { useCategories } from '@/features/categories/api/use-categories';
import type { Product } from '@/features/products/api/types';

interface Props {
  onAddToCart: (product: Product) => void;
}

export function PosProductPicker({ onAddToCart }: Props) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  const { categories } = useCategories();

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['pos', 'products', search, selectedCategory],
    queryFn: () =>
      productsApi.list({
        search: search || undefined,
        categoryId: selectedCategory || undefined,
        isActive: true,
        limit: 50,
      }),
  });

  const products = productsData?.items ?? [];

  const handleBarcodeScan = (code: string) => {
    setSearch(code);
    setScannerOpen(false);
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Qidiruv va skaner */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Mahsulot nomi yoki shtrix-kod..."
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setScannerOpen(true)}
          aria-label="Shtrix-kod skanerlash"
        >
          <ScanLine className="size-5" />
        </Button>
      </div>

      {/* Kategoriya pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <Button
          size="sm"
          variant={selectedCategory === null ? 'default' : 'outline'}
          className="rounded-full text-xs shrink-0 h-7"
          onClick={() => setSelectedCategory(null)}
        >
          Barchasi
        </Button>
        {categories.map((cat) => (
          <Button
            key={cat.id}
            size="sm"
            variant={selectedCategory === cat.id ? 'default' : 'outline'}
            className="rounded-full text-xs shrink-0 h-7"
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </Button>
        ))}
      </div>

      {/* Mahsulotlar ro'yxati/grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <Package className="size-10 mb-2 stroke-1 text-muted-foreground/60" />
            <p className="text-sm font-medium">Mahsulot topilmadi</p>
            <p className="text-xs">Qidiruv so'zini o'zgartirib ko'ring</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {products.map((prod) => {
              const outOfStock = prod.stock <= 0;
              return (
                <button
                  type="button"
                  key={prod.id}
                  disabled={outOfStock}
                  onClick={() => onAddToCart(prod)}
                  className={`bg-card text-left rounded-xl border p-2.5 flex flex-col justify-between transition-all hover:border-primary/60 hover:shadow-xs active:scale-[0.98] ${
                    outOfStock ? 'opacity-50 cursor-not-allowed bg-muted/40' : 'cursor-pointer'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-1">
                      <span className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug">
                        {prod.name}
                      </span>
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {outOfStock ? (
                        <span className="text-destructive font-medium">Tugagan</span>
                      ) : (
                        <span>Qoldiq: {prod.stock} {prod.unit ?? 'dona'}</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t flex items-center justify-between">
                    <span className="font-bold text-xs sm:text-sm text-primary">
                      <MoneyText value={prod.sellingPrice} />
                    </span>
                    <span className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <Plus className="size-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onDetected={handleBarcodeScan}
      />
    </div>
  );
}
