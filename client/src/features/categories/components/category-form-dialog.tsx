import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { isApiError } from '@/lib/api/errors';
import { categoriesApi } from '../api/categories-api';
import { categoryKeys } from '@/features/products/api/queryKeys';
import type { Category } from '@/features/products/api/types';

const schema = z.object({ name: z.string().trim().min(1, 'validation.required') });
type Values = z.infer<typeof schema>;

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Berilsa tahrirlash, aks holda yangi kategoriya. */
  category?: Category | null;
}) {
  const { t } = useTranslation(['catalog', 'common', 'auth']);
  const queryClient = useQueryClient();

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  // Oyna ochilganda tahrirlanayotgan qiymat yuklanadi.
  useEffect(() => {
    if (open) form.reset({ name: category?.name ?? '' });
  }, [open, category, form]);

  const mutation = useMutation({
    mutationFn: (values: Values) =>
      category
        ? categoriesApi.update(category.id, values.name)
        : categoriesApi.create(values.name),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      toast.success(category ? t('catalog:categories.updated') : t('catalog:categories.created'));
      onOpenChange(false);
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors?.name) {
        form.setError('name', { message: error.fieldErrors.name });
      }
    },
  });

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={category ? t('common:actions.edit') : t('catalog:categories.add')}
      footer={
        <>
          <Button
            variant="outline"
            className="min-h-touch"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('common:actions.cancel')}
          </Button>
          <Button
            form="category-form"
            type="submit"
            className="min-h-touch"
            disabled={mutation.isPending}
          >
            {t('common:actions.save')}
          </Button>
        </>
      }
    >
      <form
        id="category-form"
        noValidate
        onSubmit={(event) => void form.handleSubmit((values) => mutation.mutate(values))(event)}
        className="space-y-2 py-2"
      >
        <Label htmlFor="category-name">{t('catalog:categories.name')}</Label>
        <Input
          id="category-name"
          autoComplete="off"
          disabled={mutation.isPending}
          aria-invalid={Boolean(form.formState.errors.name)}
          {...form.register('name')}
        />
        {form.formState.errors.name ? (
          <p role="alert" className="text-destructive text-[13px]">
            {t(`auth:${form.formState.errors.name.message}`)}
          </p>
        ) : null}
      </form>
    </ResponsiveDialog>
  );
}
