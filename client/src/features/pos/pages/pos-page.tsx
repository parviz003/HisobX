import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { api } from '@/lib/api/client';
import { productKeys } from '@/features/products/api/queryKeys';
import { customerKeys } from '@/features/customers/api/customers-api';
import { debtKeys } from '@/features/debts/api/debts-api';
import type { Product } from '@/features/products/api/types';
import type { Customer } from '@/features/customers/api/types';
import { PosProductPicker } from '../components/pos-product-picker';
import { PosCart } from '../components/pos-cart';
import { PosReceiptModal } from '../components/pos-receipt-modal';
import type { CartItem, CompletedSale } from '../types';

export default function PosPage() {
  const queryClient = useQueryClient();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentType, setPaymentType] = useState<'CASH' | 'CREDIT'>('CASH');
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);

  // Savatga qo'shish
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.warning(`Omborda faqat ${product.stock} ta mavjud`);
          return prev;
        }
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    toast.success(`«${product.name}» savatga qo'shildi`, { duration: 1500 });
  };

  // Miqdor o'zgartirish
  const handleUpdateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  // O'chirish
  const handleRemoveItem = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  // Tozalash
  const handleClearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountPercent(0);
    setPaymentType('CASH');
  };

  // Savdo yaratish mutatsiyasi
  const saleMutation = useMutation({
    mutationFn: async () => {
      const subtotal = cart.reduce(
        (sum, item) => sum + item.product.sellingPrice * item.quantity,
        0,
      );
      const discountAmount = Math.round((subtotal * discountPercent) / 100);

      const payload = {
        paymentType,
        customerId: selectedCustomer?.id,
        discountPercent: discountPercent > 0 ? discountPercent : undefined,
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      };

      const { data } = await api.post('/sales', payload);
      return data as {
        id: number;
        saleNumber: number;
        subtotal: number;
        discountPercent?: number;
        discountAmount?: number;
        totalAmount: number;
        paymentType: 'CASH' | 'CREDIT';
        createdAt: string;
      };
    },
    onSuccess: (savedSale) => {
      // Keshni yangilash
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['pos'] }),
        queryClient.invalidateQueries({ queryKey: ['sales'] }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
        queryClient.invalidateQueries({ queryKey: debtKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
      ]);

      const receipt: CompletedSale = {
        id: savedSale.id,
        saleNumber: savedSale.saleNumber,
        subtotal: savedSale.subtotal,
        discountPercent: savedSale.discountPercent,
        discountAmount: savedSale.discountAmount,
        totalAmount: savedSale.totalAmount,
        paymentType: savedSale.paymentType,
        customerName: selectedCustomer?.name,
        items: cart.map((i) => ({
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.sellingPrice,
          total: i.product.sellingPrice * i.quantity,
        })),
        createdAt: savedSale.createdAt,
      };

      setCompletedSale(receipt);
      setReceiptOpen(true);
      setMobileCartOpen(false);
      handleClearCart();
      toast.success("Savdo muvaffaqiyatli yakunlandi!");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Savdoni yakunlashda xatolik yuz berdi");
    },
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col lg:flex-row gap-4">
      {/* Chap tomon: Mahsulotlar katalogi (desktopda 60%) */}
      <div className="flex-1 flex flex-col min-h-0 bg-card/50 rounded-2xl border p-4">
        <div className="flex items-center justify-between pb-3 border-b mb-3">
          <div>
            <h1 className="font-bold text-lg leading-tight">Savdo Terminali (POS)</h1>
            <p className="text-xs text-muted-foreground">Mahsulotlarni tanlang va savatga qo'shing</p>
          </div>

          {/* Mobilda savatni ochish tugmasi */}
          <div className="lg:hidden">
            <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
              <SheetTrigger asChild>
                <Button className="relative gap-2">
                  <ShoppingCart className="size-4" />
                  <span>Savat</span>
                  {cartTotalItems > 0 && (
                    <span className="size-5 rounded-full bg-background text-foreground text-xs font-bold flex items-center justify-center">
                      {cartTotalItems}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="p-0 sm:max-w-md w-full">
                <SheetHeader className="sr-only">
                  <SheetTitle>Savat</SheetTitle>
                </SheetHeader>
                <PosCart
                  cart={cart}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveItem}
                  onClearCart={handleClearCart}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  paymentType={paymentType}
                  onChangePaymentType={setPaymentType}
                  discountPercent={discountPercent}
                  onChangeDiscountPercent={setDiscountPercent}
                  onCheckout={() => saleMutation.mutate()}
                  isSubmitting={saleMutation.isPending}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          <PosProductPicker onAddToCart={handleAddToCart} />
        </div>
      </div>

      {/* O'ng tomon: Desktop savat (40%, keng ekranlarda) */}
      <div className="hidden lg:block w-96 xl:w-[420px] shrink-0 h-full">
        <PosCart
          cart={cart}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={setSelectedCustomer}
          paymentType={paymentType}
          onChangePaymentType={setPaymentType}
          discountPercent={discountPercent}
          onChangeDiscountPercent={setDiscountPercent}
          onCheckout={() => saleMutation.mutate()}
          isSubmitting={saleMutation.isPending}
        />
      </div>

      {/* Chek modali */}
      <PosReceiptModal
        sale={completedSale}
        open={receiptOpen}
        onOpenChange={setReceiptOpen}
        onNewSale={() => setReceiptOpen(false)}
      />
    </div>
  );
}
