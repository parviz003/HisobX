import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Plus, Phone, MapPin, Pencil, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { SearchInput } from '@/components/common/search-input';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { MoneyText } from '@/components/common/money-text';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { useCan } from '@/hooks/use-can';
import { customersApi, customerKeys } from '../api/customers-api';
import type { Customer } from '../api/types';
import { CustomerFormDialog } from '../components/customer-form-dialog';
import { CustomerDetailDialog } from '../components/customer-detail-dialog';

const DEFAULTS = { search: '' };

export default function CustomersPage() {
  const queryClient = useQueryClient();
  const canManage = useCan('customer.manage');
  const { filters, setFilter } = useUrlFilters(DEFAULTS);

  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);

  const query = usePaginatedQuery({
    queryKey: customerKeys.list({ search: filters.search || undefined }),
    fetchPage: ({ page, limit, signal }) =>
      customersApi.list({ page, limit, search: filters.search || undefined }, signal),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => customersApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success("Mijoz o'chirildi");
      setDeletingCustomer(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Mijozni o'chirib bo'lmadi");
    },
  });

  const openCreate = () => {
    setEditingCustomer(null);
    setFormOpen(true);
  };

  const openEdit = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCustomer(customer);
    setFormOpen(true);
  };

  const openDelete = (customer: Customer, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingCustomer(customer);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mijozlar bazasi"
        description="Mijozlar ro'yxati, aloqa ma'lumotlari va umumiy qarzdorlik"
        actions={
          canManage ? (
            <Button className="min-h-touch" onClick={openCreate}>
              <Plus className="size-4" aria-hidden />
              <span>Yangi mijoz</span>
            </Button>
          ) : null
        }
      />

      <div className="flex gap-2">
        <SearchInput
          className="flex-1"
          value={filters.search}
          onDebouncedChange={(value) => setFilter('search', value)}
          placeholder="Ism yoki telefon bo'yicha qidirish..."
        />
      </div>

      {query.isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.items.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Mijozlar topilmadi"
          description={filters.search ? "Qidiruv bo'yicha hech qanday mijoz topilmadi." : "Hozircha tizimda mijozlar ro'yxati mavjud emas."}
          action={
            canManage ? (
              <Button onClick={openCreate}>
                <Plus className="size-4" aria-hidden />
                Yangi mijoz qo'shish
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {query.items.map((cust) => {
            const hasDebt = (cust.totalDebt ?? 0) > 0;
            return (
              <div
                key={cust.id}
                onClick={() => setSelectedCustomerId(cust.id)}
                className="bg-card hover:border-primary/50 cursor-pointer rounded-2xl border p-4 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base leading-tight truncate">
                      {cust.name}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(cust.id);
                        }}
                        aria-label="Tafsilotlar"
                      >
                        <Eye className="size-4 text-muted-foreground" />
                      </Button>
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={(e) => openEdit(cust, e)}
                            aria-label="Tahrirlash"
                          >
                            <Pencil className="size-3.5 text-muted-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-destructive hover:text-destructive"
                            onClick={(e) => openDelete(cust, e)}
                            aria-label="O'chirish"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {cust.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="size-3.5 shrink-0" />
                        <span>{cust.phone}</span>
                      </div>
                    )}
                    {cust.address && (
                      <div className="flex items-center gap-1.5 truncate">
                        <MapPin className="size-3.5 shrink-0" />
                        <span className="truncate">{cust.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Qarzdorlik:</span>
                  <span className={`font-semibold text-sm ${hasDebt ? 'text-destructive' : 'text-emerald-600'}`}>
                    <MoneyText value={cust.totalDebt ?? 0} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {query.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
          >
            {query.isFetchingNextPage ? "Yuklanmoqda..." : "Ko'proq yuklash"}
          </Button>
        </div>
      )}

      <CustomerFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        customer={editingCustomer}
      />

      <CustomerDetailDialog
        open={selectedCustomerId !== null}
        onOpenChange={(open) => !open && setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />

      <ConfirmDialog
        open={deletingCustomer !== null}
        onOpenChange={(open) => !open && setDeletingCustomer(null)}
        title="Mijozni o'chirish"
        description={`Haqiqatan ham «${deletingCustomer?.name}» mijozini o'chirmoqchimisiz?`}
        confirmLabel="O'chirish"
        destructive
        onConfirm={() => {
          if (deletingCustomer) {
            deleteMutation.mutate(deletingCustomer.id);
          }
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
