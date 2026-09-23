import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyInput } from '@/components/common/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cashApi, cashKeys } from '../api/cash-api';
import type { CashTransactionInput } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CashTransactionDialog({ open, onOpenChange }: Props) {
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
      description="Boshlang'ich kassa qoldig'i yoki kassa balansini qo'lda to'g'rilash"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1.5">
          <Label>Harakat turi</Label>
          <Select value={type} onValueChange={(v) => setType(v as 'OPENING' | 'ADJUSTMENT')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPENING">Boshlang'ich qoldiq (Opening)</SelectItem>
              <SelectItem value="ADJUSTMENT">Kassani to'g'rilash (Adjustment)</SelectItem>
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
            placeholder="Masalan: Kassa ochilishi uchun qoldiq"
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
            {mutation.isPending ? "Saqlanmoqda..." : "Kassaga kiritish"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
