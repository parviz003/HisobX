import { Printer, CheckCircle, ArrowRight } from 'lucide-react';
import { ResponsiveDialog } from '@/components/common/responsive-dialog';
import { Button } from '@/components/ui/button';
import { MoneyText } from '@/components/common/money-text';
import type { CompletedSale } from '../types';

interface Props {
  sale: CompletedSale | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNewSale: () => void;
}

export function PosReceiptModal({ sale, open, onOpenChange, onNewSale }: Props) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Savdo muvaffaqiyatli yakunlandi!"
      description={`Chek № ${sale.saleNumber}`}
    >
      <div className="space-y-4 py-2">
        <div className="bg-card border rounded-2xl p-4 space-y-3 font-mono text-xs print:border-none print:shadow-none">
          <div className="text-center border-b pb-2">
            <h3 className="font-bold text-base font-sans tracking-wide">HisobX Do'koni</h3>
            <p className="text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
            <p className="text-muted-foreground font-semibold mt-1">Chek № {sale.saleNumber}</p>
          </div>

          {sale.customerName && (
            <div className="flex justify-between border-b pb-1.5 text-muted-foreground">
              <span>Mijoz:</span>
              <span className="font-bold text-foreground">{sale.customerName}</span>
            </div>
          )}

          <div className="space-y-1.5 border-b pb-2">
            {sale.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="truncate max-w-[180px]">
                  <span>{item.name}</span>
                  <div className="text-[11px] text-muted-foreground">
                    {item.quantity} x {item.price.toLocaleString()}
                  </div>
                </div>
                <div className="font-semibold">
                  <MoneyText value={item.total} />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Oraliq summa:</span>
              <span><MoneyText value={sale.subtotal} /></span>
            </div>

            {!!sale.discountAmount && sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>Chegirma:</span>
                <span>-<MoneyText value={sale.discountAmount} /></span>
              </div>
            )}

            <div className="flex justify-between text-base font-bold font-sans pt-1 border-t">
              <span>Jami:</span>
              <span className="text-primary"><MoneyText value={sale.totalAmount} /></span>
            </div>

            <div className="flex justify-between text-muted-foreground pt-1 text-[11px]">
              <span>To'lov turi:</span>
              <span className="font-semibold uppercase">
                {sale.paymentType === 'CASH' ? 'Naqd pul' : 'Nasiya / Qarz'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 gap-1.5"
            onClick={handlePrint}
          >
            <Printer className="size-4" />
            <span>Chop etish</span>
          </Button>
          <Button
            type="button"
            className="flex-1 gap-1.5"
            onClick={() => {
              onOpenChange(false);
              onNewSale();
            }}
          >
            <span>Yangi savdo</span>
            <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
}
