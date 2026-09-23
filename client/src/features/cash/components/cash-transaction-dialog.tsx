import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyInput } from '@/components/common/money-input';
import { MoneyText } from '@/components/common/money-text';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cashApi, cashKeys } from '../api/cash-api';
import type { CashTransactionInput } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance?: number;
}

export function CashTransactionDialog({ open, onOpenChange, currentBalance = 0 }: Props) {
  const queryClient = useQueryClient();
  const [type, setType] = useState<'OPENING' | 'ADJUSTMENT'>('OPENING');
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: (values: CashTransactionInput) => cashApi.create(values),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: cashKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]);
      toast.success("Kassa amaliyoti muvaffaqiyatli saqlandi");
      onOpenChange(false);
      setAmount(null);
      setNote('');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Kassa amaliyotida xatolik yuz berdi");
    },
  });

  const numAmount = amount ?? 0;
  const newBalance = type === 'OPENING' ? currentBalance + numAmount : currentBalance - numAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0) {
      toast.error("Summani to'g'ri kiriting");
      return;
    }

    mutation.mutate({
      type,
      amount,
      note: note.trim() || undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Kassa harakatini kiritish"
      description="Kassaga naqd pul kiritish (kirim) yoki kassa balansini to'g'rilash (chiqim)"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        {/* Joriy va kutilayotgan balans ma'lumotlari */}
        <div className="rounded-xl border bg-muted/40 p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Wallet className="size-3.5 text-primary" />
              <span>Joriy kassa balansi:</span>
            </span>
            <span className="font-semibold text-foreground text-sm">
              <MoneyText value={currentBalance} />
            </span>
          </div>

          {numAmount > 0 && (
            <div className="flex items-center justify-between pt-1.5 border-t border-border/60">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                {type === 'OPENING' ? (
                  <>
                    <ArrowDownRight className="size-4 text-emerald-600" />
                    <span>Kiritilgandan keyingi yangi balans (+):</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="size-4 text-amber-600" />
                    <span>To'g'rilangandan keyingi yangi balans (-):</span>
                  </>
                )}
              </span>
              <span
                className={`font-bold text-sm ${
                  newBalance < 0
                    ? 'text-destructive'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                <MoneyText value={newBalance} />
              </span>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Harakat turi</Label>
          <Select value={type} onValueChange={(v) => setType(v as 'OPENING' | 'ADJUSTMENT')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPENING">Kassaga pul kiritish (Kirim / +)</SelectItem>
              <SelectItem value="ADJUSTMENT">Kassani to'g'rilash / Pul olish (Chiqim / -)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cash-amount">Summa *</Label>
          <MoneyInput
            id="cash-amount"
            value={amount}
            onChange={setAmount}
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cash-note">Izoh</Label>
          <Input
            id="cash-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === 'OPENING'
                ? "Masalan: Kassa ochilishi / mayda pul kiritish"
                : "Masalan: Kassa tekshiruvi / kamomadni to'g'rilash"
            }
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
            {mutation.isPending
              ? "Saqlanmoqda..."
              : type === 'OPENING'
                ? "Kassaga kiritish (+)"
                : "Kassani to'g'rilash (-)"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
