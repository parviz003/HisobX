import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { UserCheck, UserPlus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { customersApi, customerKeys } from '@/features/customers/api/customers-api';
import { CustomerFormDialog } from '@/features/customers/components/customer-form-dialog';
import type { Customer } from '@/features/customers/api/types';

interface Props {
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  required?: boolean;
}

export function PosCustomerSelect({ selectedCustomer, onSelectCustomer, required }: Props) {
  const [createOpen, setCreateOpen] = useState(false);

  const { data: customersData, isLoading } = useQuery({
    queryKey: customerKeys.list({ limit: 100 }),
    queryFn: () => customersApi.list({ limit: 100 }),
  });

  const customers = customersData?.items ?? [];

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label className="text-xs flex items-center gap-1">
          <UserCheck className="size-3.5 text-muted-foreground" />
          <span>Mijoz {required ? <span className="text-destructive font-bold">* (Nasiyaga shart)</span> : '(Ixtiyoriy)'}</span>
        </Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-auto p-0 text-xs text-primary underline flex items-center gap-0.5"
          onClick={() => setCreateOpen(true)}
        >
          <UserPlus className="size-3" />
          <span>Yangi</span>
        </Button>
      </div>

      <div className="flex gap-1.5 items-center">
        <Select
          value={selectedCustomer ? String(selectedCustomer.id) : ''}
          onValueChange={(val) => {
            const found = customers.find((c) => String(c.id) === val);
            onSelectCustomer(found ?? null);
          }}
          disabled={isLoading}
        >
          <SelectTrigger className="flex-1 h-9 text-xs">
            <SelectValue placeholder={isLoading ? "Yuklanmoqda..." : "Mijozni tanlang..."} />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={String(c.id)} className="text-xs">
                {c.name} {c.phone ? `(${c.phone})` : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedCustomer && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => onSelectCustomer(null)}
            aria-label="Mijozni tozalash"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={(newCust) => onSelectCustomer(newCust)}
      />
    </div>
  );
}
