import { Suspense } from 'react';
import { GroupExpenseJoinPage } from '@/features/group-expense/components';

export default function GroupExpenseJoinRoutePage() {
  return (
    <Suspense fallback={null}>
      <GroupExpenseJoinPage />
    </Suspense>
  );
}
