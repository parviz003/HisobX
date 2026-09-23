import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { PhoneInput } from '@/components/common/phone-input';
import { customersApi, customerKeys } from '../api/customers-api';
import type { Customer, CustomerInput } from '../api/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess?: (customer: Customer) => void;
}

export function CustomerFormDialog({ open, onOpenChange, customer, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (customer) {
      setName(customer.name);
      setPhone(customer.phone ?? '');
      setAddress(customer.address ?? '');
      setNotes(customer.notes ?? '');
    } else {
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
    }
  }, [customer, open]);

  const mutation = useMutation({
    mutationFn: (values: CustomerInput) => {
      if (customer) {
        return customersApi.update(customer.id, values);
      }
      return customersApi.create(values);
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success(customer ? "Mijoz ma'lumotlari yangilandi" : "Yangi mijoz qo'shildi");
      onOpenChange(false);
      onSuccess?.(saved);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || "Xatolik yuz berdi");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Mijoz ismini kiriting");
      return;
    }
    mutation.mutate({
      name: name.trim(),
      phone: phone.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title={customer ? "Mijozni tahrirlash" : "Yangi mijoz qo'shish"}
      description="Mijoz ismi, telefon raqami va manzili"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="cust-name">Ism-familiya *</Label>
          <Input
            id="cust-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Masalan: Sardor Rahimov"
            required
            autoFocus
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-phone">Telefon raqam</Label>
          <PhoneInput
            id="cust-phone"
            value={phone}
            onChange={setPhone}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-address">Manzil</Label>
          <Input
            id="cust-address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Shahar, tuman, ko'cha"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cust-notes">Izoh</Label>
          <Textarea
            id="cust-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Qo'shimcha eslatmalar..."
            rows={2}
          />
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
