import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserCog, Plus, Phone, Pencil, Trash2, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';
import { ErrorState } from '@/components/common/error-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { useCan } from '@/hooks/use-can';
import { staffApi, staffKeys } from '../api/staff-api';
import type { StaffRole, StaffUser } from '../api/types';
import { StaffFormDialog } from '../components/staff-form-dialog';

const ROLE_BADGES: Record<StaffRole, { label: string; color: string }> = {
  MANAGER: { label: 'Bosh Menejer', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300' },
  ADMIN: { label: 'Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' },
  SELLER: { label: 'Sotuvchi', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' },
};

export default function StaffPage() {
  const queryClient = useQueryClient();
  const canManageAdmins = useCan('staff.admins.manage');
  const canManageSellers = useCan('staff.sellers.manage');

  const [formOpen, setFormOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffUser | null>(null);

  const { data: staffList = [], isLoading, isError, refetch } = useQuery({
    queryKey: staffKeys.list(),
    queryFn: ({ signal }) => staffApi.list(signal),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => staffApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast.success("Xodim o'chirildi");
      setDeletingStaff(null);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Xodimni o'chirib bo'lmadi");
    },
  });

  const canEdit = (target: StaffUser) => {
    if (target.role === 'ADMIN' || target.role === 'MANAGER') return canManageAdmins;
    return canManageSellers;
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Xodimlar boshqaruvi"
        description="Do'kon xodimlari, sotuvchilar va administratorlar ro'yxati hamda ularning rollari"
        actions={
          (canManageAdmins || canManageSellers) ? (
            <Button
              className="gap-1.5 min-h-touch"
              onClick={() => {
                setEditingStaff(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" />
              <span>Yangi xodim</span>
            </Button>
          ) : null
        }
      />

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={UserCog}
          title="Xodimlar mavjud emas"
          description="Do'konga yangi sotuvchi yoki administrator qo'shing."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="size-4 mr-1.5" />
              Xodim qo'shish
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((staff) => {
            const roleBadge = ROLE_BADGES[staff.role] ?? {
              label: staff.role,
              color: 'bg-muted text-foreground',
            };
            const editable = canEdit(staff);

            return (
              <div
                key={staff.id}
                className="bg-card rounded-2xl border p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <User className="size-4" />
                      </div>
                      <span className="font-semibold text-sm truncate">
                        {staff.fullName || 'Nomsiz xodim'}
                      </span>
                    </div>

                    <span
                      className={`text-[11px] px-2.5 py-0.5 rounded-full font-semibold shrink-0 ${roleBadge.color}`}
                    >
                      {roleBadge.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                    <Phone className="size-3.5" />
                    <span>{staff.phone}</span>
                  </div>
                </div>

                <div className="pt-2 border-t flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Qo'shilgan: {new Date(staff.createdAt).toLocaleDateString()}
                  </span>

                  {editable && (
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => {
                          setEditingStaff(staff);
                          setFormOpen(true);
                        }}
                        aria-label="Tahrirlash"
                      >
                        <Pencil className="size-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => setDeletingStaff(staff)}
                        aria-label="O'chirish"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        staffUser={editingStaff}
      />

      <ConfirmDialog
        open={deletingStaff !== null}
        onOpenChange={(op) => !op && setDeletingStaff(null)}
        title="Xodimni o'chirish"
        description={`Haqiqatan ham «${deletingStaff?.fullName ?? deletingStaff?.phone}» xodimini tizimdan o'chirmoqchimisiz?`}
        confirmLabel="O'chirish"
        destructive
        onConfirm={() => deletingStaff && deleteMutation.mutate(deletingStaff.id)}
        loading={deleteMutation.isPending}
      />
    </div>
  );
}
