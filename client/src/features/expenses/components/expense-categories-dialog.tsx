import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { toast } from 'sonner';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { expensesApi, expenseKeys } from '../api/expenses-api';
import type { ExpenseCategory } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExpenseCategoriesDialog({ open, onOpenChange }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<ExpenseCategory | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: ({ signal }) => expensesApi.listCategories(signal),
    enabled: open,
  });

  const saveMutation = useMutation({
    mutationFn: (catName: string) => {
      if (editingCategory) {
        return expensesApi.updateCategory(editingCategory.id, { name: catName });
      }
      return expensesApi.createCategory({ name: catName });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      toast.success(editingCategory ? 'Toifa yangilandi' : "Yangi toifa qo'shildi");
      setName('');
      setEditingCategory(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Xatolik yuz berdi');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.removeCategory(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: expenseKeys.categories() });
      toast.success("Toifa o'chirildi");
      setDeletingCategory(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Toifani o'chirib bo'lmadi");
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveMutation.mutate(name.trim());
  };

  const handleStartEdit = (cat: ExpenseCategory) => {
    setEditingCategory(cat);
    setName(cat.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Xarajat toifalari"
      description="Do'kon xarajatlari toifalari (Ijara, Oylik, Kommunal va boshqalar)"
    >
      <div className="space-y-4 py-1">
        {/* Yangi toifa qo'shish / tahrirlash formasi */}
        <form onSubmit={handleSave} className="flex gap-2 items-end">
          <div className="flex-1 space-y-1">
            <Label htmlFor="cat-input" className="text-xs">
              {editingCategory ? "Toifani tahrirlash" : "Yangi toifa nomi"}
            </Label>
            <Input
              id="cat-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masalan: Kommunal to'lovlar"
              className="h-9 text-xs"
              autoFocus
            />
          </div>
          {editingCategory && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-xs"
              onClick={handleCancelEdit}
            >
              Bekor
            </Button>
          )}
          <Button
            type="submit"
            size="sm"
            className="h-9 text-xs"
            disabled={!name.trim() || saveMutation.isPending}
          >
            {editingCategory ? 'Saqlash' : "Qo'shish"}
          </Button>
        </form>

        {/* Toifalar ro'yxati */}
        <div className="border rounded-xl divide-y max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 space-y-2">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-full" />
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              Hozircha xarajat toifalari mavjud emas
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat.id} className="p-2.5 flex items-center justify-between text-xs">
                <span className="font-medium">{cat.name}</span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => handleStartEdit(cat)}
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 text-destructive hover:text-destructive"
                    onClick={() => setDeletingCategory(cat)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deletingCategory !== null}
        onOpenChange={(op) => !op && setDeletingCategory(null)}
        title="Toifani o'chirish"
        description={`«${deletingCategory?.name}» toifasini o'chirmoqchimisiz?`}
        confirmLabel="O'chirish"
        destructive
        onConfirm={() => deletingCategory && deleteMutation.mutate(deletingCategory.id)}
        loading={deleteMutation.isPending}
      />
    </ResponsiveDialog>
  );
}
