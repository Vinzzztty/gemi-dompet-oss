import { Suspense } from 'react';
import { SplitBillJoinPage } from '@/features/split-bill/components';

export default function SplitBillJoinRoutePage() {
  return (
    <Suspense fallback={null}>
      <SplitBillJoinPage />
    </Suspense>
  );
}
