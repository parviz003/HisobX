import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import {
  Store,
  Plus,
  Search,
  Users,
  Package,
  Receipt,
  Eye,
  Trash2,
  CheckCircle2,
  Building2,
  Phone,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { setImpersonatedStoreId } from '@/lib/api/session';
import { storesApi } from '../api/stores-api';
import { StoreOnboardDialog } from '../components/store-onboard-dialog';
import type { StoreItem } from '../api/types';

export default function StoresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [onboardOpen, setOnboardOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [storeToDelete, setStoreToDelete] = useState<StoreItem | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['stores', search],
    queryFn: () => storesApi.getStores({ search: search.trim() || undefined }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => storesApi.removeStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setStoreToDelete(null);
    },
  });

  const stores = data?.items ?? [];
  const totalStores = data?.meta?.total ?? stores.length;
  const activeStores = stores.filter((s) => s.isActive).length;

  const handleEnterStore = (storeId: number) => {
    setImpersonatedStoreId(storeId);
    void navigate('/dashboard');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="SaaS Do'konlar Boshqaruvi"
        description="Platforma Superadmin paneli: Ro'yxatdan o'tgan mijoz do'konlari va yangi do'konlarni ochish"
        actions={
          <Button onClick={() => setOnboardOpen(true)} className="gap-1.5 shadow-sm">
            <Plus className="size-4" />
            <span>Yangi do&apos;kon ochish</span>
          </Button>
        }
      />

      {/* Platform KPI / Status Kartalari */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Jami mijoz do&apos;konlar</span>
          <div className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Building2 className="size-5 text-primary" />
            <span>{totalStores}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Faol do&apos;konlar</span>
          <div className="text-2xl font-bold tracking-tight text-emerald-600 flex items-center gap-2">
            <CheckCircle2 className="size-5" />
            <span>{activeStores}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border p-4 space-y-1">
          <span className="text-xs text-muted-foreground">Platforma holati</span>
          <div className="text-sm font-semibold text-foreground flex items-center gap-2 pt-1">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>PostgreSQL Multi-tenant</span>
          </div>
        </div>
      </div>

      {/* Qidiruv va filtr */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="size-4 text-muted-foreground absolute left-3 top-3 pointer-events-none" />
          <Input
            placeholder="Do'kon nomi bo'yicha qidirish..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Do'konlar ro'yxati */}
      {isLoading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          Do&apos;konlar ro&apos;yxati yuklanmoqda...
        </div>
      ) : stores.length === 0 ? (
        <div className="bg-card rounded-2xl border p-12 text-center space-y-4">
          <div className="size-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Store className="size-7" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-semibold text-base">Hozircha hech qanday do&apos;kon ochilmagan</h3>
            <p className="text-xs text-muted-foreground">
              Tizimda birinchi mijoz do&apos;koni va uning Admin boshqaruv hisobini yaratish uchun quyidagi tugmani bosing.
            </p>
          </div>
          <Button onClick={() => setOnboardOpen(true)} className="gap-1.5">
            <Plus className="size-4" />
            <span>Birinchi do&apos;konni ochish</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stores.map((store) => (
            <div
              key={store.id}
              className="bg-card rounded-2xl border p-5 space-y-4 hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-foreground">{store.name}</h3>
                    <Badge variant={store.isActive ? 'default' : 'secondary'} className="text-[11px]">
                      {store.isActive ? 'Faol' : 'Nofaol'}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">ID: #{store.id}</span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => setStoreToDelete(store)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Aloqa ma'lumotlari */}
              <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
                {store.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="size-3.5" />
                    <span>{store.phone}</span>
                  </div>
                )}
                {store.address && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    <span>{store.address}</span>
                  </div>
                )}
              </div>

              {/* Statistika ko'rsatkichlari */}
              <div className="grid grid-cols-3 gap-2 border-t pt-3 text-center">
                <div className="bg-muted/40 rounded-xl p-2 space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <Users className="size-3" />
                    <span>Xodimlar</span>
                  </div>
                  <div className="font-semibold text-sm">{store._count?.users ?? 0}</div>
                </div>

                <div className="bg-muted/40 rounded-xl p-2 space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <Package className="size-3" />
                    <span>Mahsulotlar</span>
                  </div>
                  <div className="font-semibold text-sm">{store._count?.products ?? 0}</div>
                </div>

                <div className="bg-muted/40 rounded-xl p-2 space-y-0.5">
                  <div className="flex items-center justify-center gap-1 text-muted-foreground text-[11px]">
                    <Receipt className="size-3" />
                    <span>Savdolar</span>
                  </div>
                  <div className="font-semibold text-sm">{store._count?.sales ?? 0}</div>
                </div>
              </div>

              {/* Do'konga kirish tugmasi */}
              <div className="pt-1">
                <Button
                  variant="outline"
                  className="w-full gap-1.5 text-xs font-medium border-primary/20 hover:bg-primary/5 text-primary"
                  onClick={() => handleEnterStore(store.id)}
                >
                  <Eye className="size-3.5" />
                  <span>Do&apos;konga kirish (Ko&apos;rish rejimida)</span>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Onboard Modal Dialog */}
      <StoreOnboardDialog open={onboardOpen} onOpenChange={setOnboardOpen} />

      {/* O'chirish tasdiqlash dialogi */}
      <ConfirmDialog
        open={Boolean(storeToDelete)}
        onOpenChange={(open) => !open && setStoreToDelete(null)}
        title="Do'konni o'chirish"
        description={`Haqiqatan ham "${storeToDelete?.name}" do'konini o'chirib tashlamoqchimisiz? Ushbu do'kondagi barcha ma'lumotlar o'chib ketadi.`}
        destructive
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (storeToDelete) deleteMutation.mutate(storeToDelete.id);
        }}
      />
    </div>
  );
}
