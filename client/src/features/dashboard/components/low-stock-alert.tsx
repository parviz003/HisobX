import { useNavigate } from 'react-router';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  count: number;
}

export function LowStockAlert({ count }: Props) {
  const navigate = useNavigate();
  if (count <= 0) return null;

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between gap-3 text-amber-900 dark:text-amber-200">
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <AlertTriangle className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="font-semibold text-sm">Omborda kam qolgan tovarlar</h4>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
            {count} ta mahsulot zaxirasi minimal chegaraga yetdi yoki tugadi.
          </p>
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="shrink-0 gap-1 border-amber-500/30 text-amber-900 dark:text-amber-100 hover:bg-amber-500/20 text-xs"
        onClick={() => navigate('/inventory')}
      >
        <span>Omborga o'tish</span>
        <ArrowRight className="size-3.5" />
      </Button>
    </div>
  );
}
