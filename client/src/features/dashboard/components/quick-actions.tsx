import { useNavigate } from 'react-router';
import { ShoppingCart, PackagePlus, Wallet, TrendingDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Tezkor Amallar
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-16 flex-col gap-1.5 rounded-2xl justify-center bg-card hover:bg-accent border hover:border-primary/50"
          onClick={() => navigate('/pos')}
        >
          <ShoppingCart className="size-5 text-primary" />
          <span className="text-xs font-semibold">Yangi savdo (POS)</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-16 flex-col gap-1.5 rounded-2xl justify-center bg-card hover:bg-accent border hover:border-primary/50"
          onClick={() => navigate('/products')}
        >
          <PackagePlus className="size-5 text-emerald-600" />
          <span className="text-xs font-semibold">Tovarlar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-16 flex-col gap-1.5 rounded-2xl justify-center bg-card hover:bg-accent border hover:border-primary/50"
          onClick={() => navigate('/debts')}
        >
          <Users className="size-5 text-amber-600" />
          <span className="text-xs font-semibold">Qarzlar</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-16 flex-col gap-1.5 rounded-2xl justify-center bg-card hover:bg-accent border hover:border-primary/50"
          onClick={() => navigate('/cash')}
        >
          <Wallet className="size-5 text-blue-600" />
          <span className="text-xs font-semibold">Kassa</span>
        </Button>
      </div>
    </div>
  );
}
