import { useState } from 'react';
import { ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MoneyText } from '@/components/common/money-text';
import { PosCustomerSelect } from './pos-customer-select';
import type { CartItem } from '../types';
import type { Customer } from '@/features/customers/api/types';

interface Props {
  cart: CartItem[];
  onUpdateQuantity: (productId: number, delta: number) => void;
  onRemoveItem: (productId: number) => void;
  onClearCart: () => void;
  selectedCustomer: Customer | null;
  onSelectCustomer: (cust: Customer | null) => void;
  paymentType: 'CASH' | 'CREDIT';
  onChangePaymentType: (type: 'CASH' | 'CREDIT') => void;
  discountPercent: number;
  onChangeDiscountPercent: (percent: number) => void;
  onCheckout: () => void;
  isSubmitting: boolean;
}

export function PosCart({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  selectedCustomer,
  onSelectCustomer,
  paymentType,
  onChangePaymentType,
  discountPercent,
  onChangeDiscountPercent,
  onCheckout,
  isSubmitting,
}: Props) {
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0,
  );

  const discountAmount = Math.round((subtotal * discountPercent) / 100);
  const total = Math.max(0, subtotal - discountAmount);

  const isCredit = paymentType === 'CREDIT';

  return (
    <div className="bg-card border rounded-2xl flex flex-col h-full shadow-xs">
      {/* Header */}
      <div className="p-3.5 border-b flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="size-4 text-primary" />
          <h2 className="font-semibold text-sm">Savat ({cart.length})</h2>
        </div>
        {cart.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground hover:text-destructive px-2"
            onClick={onClearCart}
          >
            Tozalash
          </Button>
        )}
      </div>

      {/* Cart items list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
            <ShoppingCart className="size-10 mb-2 stroke-1 text-muted-foreground/40" />
            <p className="text-sm font-medium">Savat bo'sh</p>
            <p className="text-xs">Mahsulotlarni tanlab savatga qo'shing</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemTotal = item.product.sellingPrice * item.quantity;
            return (
              <div
                key={item.product.id}
                className="bg-muted/30 border rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm truncate">{item.product.name}</div>
                  <div className="text-muted-foreground flex items-center gap-1 mt-0.5">
                    <MoneyText value={item.product.sellingPrice} />
                    <span>x {item.quantity} {item.product.unit ?? 'dona'}</span>
                  </div>
                </div>

                {/* Soni boshqaruvi */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 rounded-lg"
                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                    aria-label="Kamaytirish"
                  >
                    <Minus className="size-3" />
                  </Button>
                  <span className="w-7 text-center font-bold text-xs">{item.quantity}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-7 rounded-lg"
                    disabled={item.quantity >= item.product.stock}
                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                    aria-label="Oshirish"
                  >
                    <Plus className="size-3" />
                  </Button>
                </div>

                <div className="text-right min-w-[65px] shrink-0 font-bold text-sm">
                  <MoneyText value={itemTotal} />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                  onClick={() => onRemoveItem(item.product.id)}
                  aria-label="O'chirish"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary & Controls */}
      <div className="p-3.5 border-t bg-muted/20 space-y-3">
        {/* Mijoz tanlash */}
        <PosCustomerSelect
          selectedCustomer={selectedCustomer}
          onSelectCustomer={onSelectCustomer}
          required={isCredit}
        />

        {/* To'lov turi (Naqd / Nasiya) */}
        <div className="space-y-1.5">
          <Label className="text-xs">To'lov turi</Label>
          <div className="grid grid-cols-2 gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={paymentType === 'CASH' ? 'default' : 'outline'}
              className="text-xs h-9 gap-1.5"
              onClick={() => onChangePaymentType('CASH')}
            >
              <Banknote className="size-3.5" />
              <span>Naqd pul</span>
            </Button>
            <Button
              type="button"
              size="sm"
              variant={paymentType === 'CREDIT' ? 'default' : 'outline'}
              className={`text-xs h-9 gap-1.5 ${paymentType === 'CREDIT' ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''}`}
              onClick={() => onChangePaymentType('CREDIT')}
            >
              <CreditCard className="size-3.5" />
              <span>Nasiya / Qarz</span>
            </Button>
          </div>
        </div>

        {/* Chegirma foizi */}
        <div className="flex items-center justify-between text-xs pt-1">
          <span className="text-muted-foreground">Chegirma (%):</span>
          <div className="flex items-center gap-1.5 w-28">
            <Input
              type="number"
              min={0}
              max={100}
              value={discountPercent || ''}
              placeholder="0"
              onChange={(e) => {
                const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                onChangeDiscountPercent(val);
              }}
              className="h-7 text-xs text-right"
            />
            <span className="text-muted-foreground font-semibold">%</span>
          </div>
        </div>

        {/* Hisob-kitob qatorlari */}
        <div className="space-y-1 text-xs pt-1 border-t">
          <div className="flex justify-between text-muted-foreground">
            <span>Oraliq summa:</span>
            <span><MoneyText value={subtotal} /></span>
          </div>
          {discountAmount > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Chegirma:</span>
              <span>-<MoneyText value={discountAmount} /></span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-1 border-t">
            <span>Jami to'lov:</span>
            <span className="text-primary font-extrabold"><MoneyText value={total} /></span>
          </div>
        </div>

        {/* Savdoni yakunlash tugmasi */}
        <Button
          type="button"
          size="lg"
          className="w-full font-bold h-12 text-sm shadow-md"
          disabled={cart.length === 0 || isSubmitting || (isCredit && !selectedCustomer)}
          onClick={onCheckout}
        >
          {isSubmitting ? (
            "Rasmiylashtirilmoqda..."
          ) : isCredit && !selectedCustomer ? (
            "Mijozni tanlang (Nasiya)"
          ) : (
            `Savdoni yakunlash (${total.toLocaleString()} so'm)`
          )}
        </Button>
      </div>
    </div>
  );
}
