import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { MoneyInput } from '@/components/common/money-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { expensesApi, expenseKeys } from '../api/expenses-api';
import { cashKeys } from '@/features/cash/api/cash-api';
import type { ExpenseInput } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseFormDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const { data: categories = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: ({ signal }) => expensesApi.listCategories(signal),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (values: ExpenseInput) => expensesApi.create(values),
    onSuccess: () => {
      void Promise.all([
        queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
        queryClient.invalidateQueries({ queryKey: cashKeys.all }),
        queryClient.invalidateQueries({ queryKey: ['reports'] }),
      ]);
      toast.success("Xarajat kiritildi va kassadan chiqim qilindi");
      onOpenChange(false);
      setAmount(null);
      setNote('');
      setCategoryId('');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Xarajatni saqlashda xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryId) {
      toast.error("Xarajat toifasini tanlang");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("Xarajat summasini to'g'ri kiriting");
      return;
    }

    mutation.mutate({
      expenseCategoryId: Number(categoryId),
      amount,
      note: note.trim() || undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Yangi xarajat kiritish"
      description="Xarajat summasi avtomatik tarzda kassa balansidan chiqim qilinadi"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1.5">
          <Label>Xarajat toifasi *</Label>
          <Select value={categoryId} onValueChange={setCategoryId} disabled={isCategoriesLoading}>
            <SelectTrigger>
              <SelectValue placeholder={isCategoriesLoading ? "Yuklanmoqda..." : "Toifani tanlang..."} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-amount">Summa *</Label>
          <MoneyInput
            id="exp-amount"
            value={amount}
            onChange={setAmount}
            placeholder="0"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="exp-note">Izoh</Label>
          <Input
            id="exp-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Masalan: 1 oylik do'kon ijarasi"
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
            {mutation.isPending ? "Kiritilmoqda..." : "Xarajatni saqlash"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
