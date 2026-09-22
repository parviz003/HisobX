import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/common/page-header';
import { EmptyState } from '@/components/common/empty-state';

/**
 * 1-bosqichda barcha bo'limlar shu placeholder bilan ochiladi.
 * Keyingi bosqichlarda har biri haqiqiy sahifa bilan almashtiriladi.
 */
export function StagePlaceholder({ title, stage }: { title: string; stage: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} />
      <EmptyState
        icon={Construction}
        title={title}
        description={`Bu bo'lim ${stage} da to'ldiriladi.`}
      />
    </div>
  );
}
