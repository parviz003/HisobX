import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Store, Phone, MapPin, Send, CheckCircle2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api/client';
import { PageHeader } from '@/components/common/page-header';
import { PhoneInput } from '@/components/common/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

type StoreData = {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  telegramChatId?: string | null;
  isActive: boolean;
  createdAt: string;
};

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const botUrl = import.meta.env.VITE_TELEGRAM_BOT_URL || 'https://t.me/tgruevwdsb_bot';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');

  const { data: store, isLoading } = useQuery({
    queryKey: ['stores', 'me'],
    queryFn: async ({ signal }) => {
      const { data } = await api.get<StoreData>('/stores/me', { signal });
      return data;
    },
  });

  useEffect(() => {
    if (store) {
      setName(store.name ?? '');
      setPhone(store.phone ?? '');
      setAddress(store.address ?? '');
      setTelegramChatId(store.telegramChatId ?? '');
    }
  }, [store]);

  const mutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch<StoreData>('/stores/me', {
        name: name.trim(),
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        telegramChatId: telegramChatId.trim() || undefined,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['stores', 'me'] });
      toast.success("Do'kon sozlamalari muvaffaqiyatli saqlandi");
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Sozlamalarni saqlab bo'lmadi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Do'kon nomini kiriting");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="Do'kon Sozlamalari"
        description="Do'kon nomi, telefon raqami, manzili va Telegram bildirishnomalarini boshqarish"
      />

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Asosiy ma'lumotlar bloki */}
          <div className="bg-card rounded-2xl border p-5 space-y-4 shadow-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Store className="size-4 text-primary" />
              <span>Do'kon rekvizitlari</span>
            </h3>

            <div className="space-y-1.5">
              <Label htmlFor="store-name">Do'kon nomi *</Label>
              <Input
                id="store-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masalan: Mini Market HisobX"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-phone">Aloqa telefoni</Label>
              <PhoneInput
                id="store-phone"
                value={phone}
                onChange={setPhone}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="store-address">Do'kon manzili</Label>
              <Input
                id="store-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shahar, tuman, ko'cha, mo'ljal"
              />
            </div>
          </div>

          {/* Telegram bot xabarnomalari bloki */}
          <div className="bg-card rounded-2xl border p-5 space-y-4 shadow-xs">
            <h3 className="font-semibold text-sm flex items-center gap-2 border-b pb-2">
              <Send className="size-4 text-blue-500" />
              <span>Telegram Bot Bildirishnomalari</span>
            </h3>

            <p className="text-xs text-muted-foreground">
              Kunlik yakuniy hisobotlar (har kuni soat 22:00 da), muddati o'tgan qarzlar va kam qolgan tovarlar eslatmasi Telegram boti orqali yuboriladi.
            </p>

            <div className="space-y-1.5">
              <Label htmlFor="telegram-chat-id">Telegram Chat ID</Label>
              <Input
                id="telegram-chat-id"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
                placeholder="Masalan: 5868663866"
              />
              <p className="text-[11px] text-muted-foreground">
                Botga <a href={botUrl} target="_blank" rel="noreferrer" className="text-primary underline">@tgruevwdsb_bot</a> /start buyrug'ini yuboring.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending} className="gap-2 min-h-touch">
              <Save className="size-4" />
              <span>{mutation.isPending ? "Saqlanmoqda..." : "O'zgarishlarni saqlash"}</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
