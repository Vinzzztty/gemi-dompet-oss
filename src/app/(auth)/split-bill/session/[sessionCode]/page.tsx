import { Suspense } from 'react';
import { SplitBillSessionPage } from '@/features/split-bill/components';

interface SplitBillSessionRoutePageProps {
  params: Promise<{ sessionCode: string }>;
}

export default async function SplitBillSessionRoutePage({
  params,
}: SplitBillSessionRoutePageProps) {
  const { sessionCode } = await params;

  return (
    <Suspense fallback={null}>
      <SplitBillSessionPage sessionCode={sessionCode} />
    </Suspense>
  );
}
