import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Tags, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useCan } from '@/hooks/use-can';
import { categoriesApi } from '../api/categories-api';
import { useCategories } from '../api/use-categories';
import { categoryKeys, productKeys } from '@/features/products/api/queryKeys';
import type { Category } from '@/features/products/api/types';
import { CategoryFormDialog } from '../components/category-form-dialog';

/** Kategoriyalar CRUD (MANAGER va ADMIN). */
export default function CategoriesPage() {
  const { t } = useTranslation(['catalog', 'common']);
  const queryClient = useQueryClient();
  const canManage = useCan('catalog.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const query = useCategories();

  const removeMutation = useMutation({
    mutationFn: (id: number) => categoriesApi.remove(id),
    onSuccess: async () => {
      // Kategoriya o'chsa, mahsulotlar ham kategoriyasiz qoladi.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
        queryClient.invalidateQueries({ queryKey: productKeys.all }),
      ]);
      toast.success(t('catalog:categories.deleted'));
      setDeleting(null);
    },
  });

  const { categories } = query;

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('catalog:categories.title')}
        description={t('catalog:categories.subtitle')}
        actions={
          canManage ? (
            <Button className="min-h-touch" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              <span className="hidden sm:inline">{t('catalog:categories.add')}</span>
            </Button>
          ) : null
        }
      />

      {query.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : categories.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={t('catalog:categories.empty')}
          description={t('catalog:categories.emptyHint')}
          action={
            canManage ? (
              <Button className="min-h-touch" onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                {t('catalog:categories.add')}
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => (
            <li
              key={category.id}
              className="bg-card flex items-center gap-3 rounded-2xl border p-4"
            >
              <div className="bg-accent text-accent-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                <Tags className="size-5" aria-hidden />
              </div>
              <p className="min-w-0 flex-1 truncate text-[15px] font-medium">{category.name}</p>

              {canManage ? (
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-touch"
                    aria-label={t('common:actions.edit')}
                    onClick={() => {
                      setEditing(category);
                      setFormOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="min-h-touch text-destructive"
                    aria-label={t('common:actions.delete')}
                    onClick={() => setDeleting(category)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <CategoryFormDialog open={formOpen} onOpenChange={setFormOpen} category={editing} />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t('catalog:categories.deleteTitle')}
        description={t('catalog:categories.deleteBody')}
        confirmLabel={t('common:actions.delete')}
        destructive
        loading={removeMutation.isPending}
        onConfirm={() => deleting && removeMutation.mutate(deleting.id)}
      />
    </div>
  );
}
