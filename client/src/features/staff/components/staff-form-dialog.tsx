import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { PhoneInput } from '@/components/common/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { staffApi, staffKeys } from '../api/staff-api';
import type { StaffRole, StaffUser } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffUser?: StaffUser | null;
}

export function StaffFormDialog({ open, onOpenChange, staffUser }: Props) {
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StaffRole>('SELLER');

  useEffect(() => {
    if (staffUser) {
      setFullName(staffUser.fullName ?? '');
      setPhone(staffUser.phone);
      setRole(staffUser.role);
      setPassword('');
    } else {
      setFullName('');
      setPhone('');
      setPassword('');
      setRole('SELLER');
    }
  }, [staffUser, open]);

  const mutation = useMutation({
    mutationFn: () => {
      if (staffUser) {
        return staffApi.update(staffUser.id, {
          fullName: fullName.trim() || undefined,
          phone: phone.trim() || undefined,
          role,
        });
      }
      return staffApi.create({
        fullName: fullName.trim(),
        phone: phone.trim(),
        password: password.trim(),
        role,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      toast.success(staffUser ? "Xodim ma'lumotlari yangilandi" : "Yangi xodim qo'shildi");
      onOpenChange(false);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Xodim ismini kiriting");
      return;
    }
    if (!phone.trim()) {
      toast.error("Telefon raqamini kiriting");
      return;
    }
    if (!staffUser && (!password || password.length < 6)) {
      toast.error("Parol kamida 6 belgidan iborat bo'lishi kerak");
      return;
    }
    mutation.mutate();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={staffUser ? "Xodimni tahrirlash" : "Yangi xodim qo'shish"}
      description="Do'kon xodimi ma'lumotlari va tizimdagi roli"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <div className="space-y-1.5">
          <Label htmlFor="staff-name">Ism-familiya *</Label>
          <Input
            id="staff-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Masalan: Bekzod Aliyev"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="staff-phone">Telefon raqam *</Label>
          <PhoneInput
            id="staff-phone"
            value={phone}
            onChange={setPhone}
          />
        </div>

        {!staffUser && (
          <div className="space-y-1.5">
            <Label htmlFor="staff-password">Boshlang'ich parol *</Label>
            <Input
              id="staff-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Kamida 6 belgi"
              required
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Tizimdagi roli *</Label>
          <Select value={role} onValueChange={(v) => setRole(v as StaffRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="SELLER">Sotuvchi (Faqat POS savdo va qarzlar)</SelectItem>
              <SelectItem value="ADMIN">Administrator (Ombor, tovarlar, hisobotlar)</SelectItem>
              <SelectItem value="MANAGER">Bosh Menejer (To'liq do'kon nazorati)</SelectItem>
            </SelectContent>
          </Select>
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
            {mutation.isPending ? "Saqlanmoqda..." : "Saqlash"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}
