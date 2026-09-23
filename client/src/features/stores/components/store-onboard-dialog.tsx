import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Store, User, Lock, CheckCircle2, Copy, Check, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { setImpersonatedStoreId } from '@/lib/api/session';
import { storesApi } from '../api/stores-api';
import type { OnboardStoreResponse } from '../api/types';

interface StoreOnboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreOnboardDialog({ open, onOpenChange }: StoreOnboardDialogProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [storeName, setStoreName] = useState('');
  const [storePhone, setStorePhone] = useState('');
  const [storeAddress, setStoreAddress] = useState('');

  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('+998');
  const [adminPassword, setAdminPassword] = useState('Admin123!');

  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [createdData, setCreatedData] = useState<OnboardStoreResponse | null>(null);

  const mutation = useMutation({
    mutationFn: storesApi.onboardStore,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
      setCreatedData(data);
      setError(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.message || 'Do‘kon yaratishda xatolik yuz berdi';
      setError(Array.isArray(msg) ? msg.join(', ') : msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      setError('Do‘kon nomini kiriting');
      return;
    }
    if (!adminName.trim()) {
      setError('Admin ismini kiriting');
      return;
    }
    if (!adminPhone.trim() || adminPhone.trim() === '+998') {
      setError('Admin telefon raqamini kiriting');
      return;
    }
    if (!adminPassword || adminPassword.length < 6) {
      setError('Parol kamida 6 ta belgidan iborat bo‘lishi kerak');
      return;
    }

    setError(null);
    mutation.mutate({
      store: {
        name: storeName.trim(),
        phone: storePhone.trim() || undefined,
        address: storeAddress.trim() || undefined,
      },
      admin: {
        fullName: adminName.trim(),
        phone: adminPhone.trim(),
        password: adminPassword,
      },
    });
  };

  const handleCopyCredentials = () => {
    if (!createdData) return;
    const text = `HisobX Do'kon Kirish Ma'lumotlari:\nDo'kon: ${createdData.store.name}\nAdmin: ${createdData.manager.fullName}\nTelefon (Login): ${createdData.manager.phone}\nParol: ${adminPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterStore = () => {
    if (!createdData) return;
    setImpersonatedStoreId(createdData.store.id);
    onOpenChange(false);
    resetForm();
    void navigate('/dashboard');
  };

  const resetForm = () => {
    setStoreName('');
    setStorePhone('');
    setStoreAddress('');
    setAdminName('');
    setAdminPhone('+998');
    setAdminPassword('Admin123!');
    setCreatedData(null);
    setError(null);
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      resetForm();
    }
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Store className="size-5 text-primary" />
            <span>{createdData ? "Do'kon Yaratildi!" : "Yangi Do'kon Ochish"}</span>
          </DialogTitle>
          <DialogDescription>
            {createdData
              ? "Do'kon va uning Bosh Admini muvaffaqiyatli ro'yxatdan o'tkazildi."
              : "SaaS tizimida yangi mijoz do'koni va uning Admin boshqaruv hisobi bir vaqtda yaratiladi."}
          </DialogDescription>
        </DialogHeader>

        {createdData ? (
          <div className="space-y-4 py-2">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span>Do&apos;kon bazada muvaffaqiyatli ishga tushirildi!</span>
              </div>
              <div className="text-xs space-y-1.5 pt-1 border-t border-emerald-500/20">
                <p>
                  <span className="text-muted-foreground">Do&apos;kon nomi:</span>{' '}
                  <strong className="font-semibold text-foreground">{createdData.store.name}</strong> (ID: #{createdData.store.id})
                </p>
                <p>
                  <span className="text-muted-foreground">Bosh Admin:</span>{' '}
                  <strong className="font-semibold text-foreground">{createdData.manager.fullName}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Telefon (Login):</span>{' '}
                  <strong className="font-mono font-semibold text-foreground">{createdData.manager.phone}</strong>
                </p>
                <p>
                  <span className="text-muted-foreground">Parol:</span>{' '}
                  <strong className="font-mono font-semibold text-foreground">{adminPassword}</strong>
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5"
                onClick={handleCopyCredentials}
              >
                {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
                <span>{copied ? "Nusxa olindi!" : "Login-parolni nusxalash"}</span>
              </Button>
              <Button
                className="flex-1 gap-1.5 bg-primary"
                onClick={handleEnterStore}
              >
                <Eye className="size-4" />
                <span>Do&apos;konga kirish</span>
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="rounded-lg bg-destructive/15 p-3 text-xs font-medium text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-3 rounded-xl border p-3.5 bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Store className="size-3.5" />
                <span>Do&apos;kon Rekvizitlari</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="storeName" className="text-xs">
                  Do&apos;kon nomi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="storeName"
                  placeholder="Masalan: Omad Market"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="storePhone" className="text-xs">Do&apos;kon telefoni</Label>
                  <Input
                    id="storePhone"
                    placeholder="+998901234567"
                    value={storePhone}
                    onChange={(e) => setStorePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="storeAddress" className="text-xs">Do&apos;kon manzili</Label>
                  <Input
                    id="storeAddress"
                    placeholder="Toshkent, Chilonzor 5"
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border p-3.5 bg-muted/30">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <User className="size-3.5" />
                <span>Do&apos;kon Bosh Admini (Menejer)</span>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="adminName" className="text-xs">
                  Admin To&apos;liq Ismi <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="adminName"
                  placeholder="Masalan: Alisher Valiyev"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="adminPhone" className="text-xs">
                    Telefon (Kirish uchun) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="adminPhone"
                    placeholder="+998901234567"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword" className="text-xs">
                    Parol <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="adminPassword"
                      type="text"
                      placeholder="Admin123!"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                    />
                    <Lock className="size-3.5 text-muted-foreground absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}>
                Bekor qilish
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Yaratilmoqda..." : "Do'konni Yaratish"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
