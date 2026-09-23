import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyInput } from '@/components/common/money-input';
import { MoneyText } from '@/components/common/money-text';
import { debtsApi, debtKeys } from '../api/debts-api';
import { customerKeys } from '@/features/customers/api/customers-api';
import type { Debt } from '../api/types';

interface Props {
  debt: Debt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DebtPaymentDialog({ debt, open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (debt) {
      setAmount(debt.remainingAmount);
      setNote('');
    }
  }, [debt, open]);

  const mutation = useMutation({
    mutationFn: (values: { amount: number; note?: string }) =>
      debtsApi.makePayment(debt!.id, values),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: debtKeys.all }),
        queryClient.invalidateQueries({ queryKey: customerKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['cash'] }),
      ]);
      toast.success("To'lov qabul qilindi va kassa balansiga qo'shildi");
      onOpenChange(false);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "To'lovni amalga oshirib bo'lmadi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("To'lov summasini to'g'ri kiriting");
      return;
    }
    if (debt && amount > debt.remainingAmount) {
      toast.error("To'lov summasi qarz qoldig'idan katta bo'lishi mumkin emas");
      return;
    }

    mutation.mutate({
      amount,
      note: note.trim() || undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Qarz to'lovini qabul qilish"
      description={debt?.customer?.name ? `Mijoz: ${debt.customer.name}` : undefined}
    >
      {debt && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/40 rounded-xl p-3.5 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jami qarz:</span>
              <span className="font-medium"><MoneyText value={debt.amount} /></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qarz qoldig'i:</span>
              <span className="font-bold text-destructive"><MoneyText value={debt.remainingAmount} /></span>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pay-amount">To'lov summasi *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-primary underline"
                onClick={() => setAmount(debt.remainingAmount)}
              >
                To'liq to'lash
              </Button>
            </div>
            <MoneyInput
              id="pay-amount"
              value={amount}
              onChange={setAmount}
              placeholder="0"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pay-note">Izoh</Label>
            <Input
              id="pay-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Masalan: Naqd pulda berdi"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Bekor qilish
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Qabul qilinmoqda..." : "To'lovni tasdiqlash"}
            </Button>
          </div>
        </form>
      )}
    </ResponsiveDialog>
  );
}
