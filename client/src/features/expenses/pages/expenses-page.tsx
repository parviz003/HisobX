import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingDown, Plus, Tags, Filter, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { MoneyText } from '@/components/common/money-text';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePaginatedQuery } from '@/hooks/use-paginated-query';
import { useCan } from '@/hooks/use-can';
import { expensesApi, expenseKeys } from '../api/expenses-api';
import { ExpenseFormDialog } from '../components/expense-form-dialog';
import { ExpenseCategoriesDialog } from '../components/expense-categories-dialog';

export default function ExpensesPage() {
  const canManage = useCan('expenses.manage');
  const [formOpen, setFormOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: categories = [] } = useQuery({
    queryKey: expenseKeys.categories(),
    queryFn: ({ signal }) => expensesApi.listCategories(signal),
  });

  const query = usePaginatedQuery({
    queryKey: expenseKeys.list({
      expenseCategoryId: selectedCategory !== 'ALL' ? Number(selectedCategory) : undefined,
    }),
    fetchPage: ({ page, limit, signal }) =>
      expensesApi.list(
        {
          page,
          limit,
          expenseCategoryId: selectedCategory !== 'ALL' ? Number(selectedCategory) : undefined,
        },
        signal,
      ),
  });

  const totalExpenseSum = query.items.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Magazin Xarajatlari"
        description="Do'kon operatsion xarajatlari, toifalar va chiqimlar monitoringi"
        actions={
          canManage ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-1.5 min-h-touch"
                onClick={() => setCategoriesOpen(true)}
              >
                <Tags className="size-4" />
                <span className="hidden sm:inline">Toifalar</span>
              </Button>
              <Button
                className="gap-1.5 min-h-touch"
                onClick={() => setFormOpen(true)}
              >
                <Plus className="size-4" />
                <span>Yangi xarajat</span>
              </Button>
            </div>
          ) : null
        }
      />

      {/* Xarajatlar umumiy kartasi va filtr */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-4 rounded-2xl border">
        <div>
          <span className="text-xs text-muted-foreground font-medium">Jami xarajatlar summasi:</span>
          <div className="text-2xl font-bold text-destructive">
            <MoneyText value={totalExpenseSum} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-9 text-xs w-44">
              <SelectValue placeholder="Barcha toifalar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="text-xs">Barcha toifalar</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Xarajatlar ro'yxati */}
      {query.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.items.length === 0 ? (
        <EmptyState
          icon={TrendingDown}
          title="Xarajatlar mavjud emas"
          description="Ushbu toifa bo'yicha hech qanday xarajat kiritilmagan."
          action={
            canManage ? (
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="size-4" aria-hidden />
                Xarajat kiritish
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="space-y-2">
          {query.items.map((exp) => (
            <div
              key={exp.id}
              className="bg-card rounded-2xl border p-3.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {exp.expenseCategory?.name ?? "Noma'lum toifa"}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-medium">
                    Chiqim
                  </span>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <span>{new Date(exp.createdAt).toLocaleDateString()} {new Date(exp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {exp.note && <span>• {exp.note}</span>}
                </div>
              </div>

              <div className="font-bold text-sm sm:text-base text-destructive shrink-0">
                -<MoneyText value={exp.amount} />
              </div>
            </div>
          ))}
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

      <ExpenseFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
      />

      <ExpenseCategoriesDialog
        open={categoriesOpen}
        onOpenChange={setCategoriesOpen}
      />
    </div>
  );
}
