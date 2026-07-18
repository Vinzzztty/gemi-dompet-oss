import { Suspense } from 'react';
import { GroupExpenseSessionPage } from '@/features/group-expense/components';

interface GroupExpenseSessionRoutePageProps {
  params: Promise<{ sessionCode: string }>;
}

export default async function GroupExpenseSessionRoutePage({
  params,
}: GroupExpenseSessionRoutePageProps) {
  const { sessionCode } = await params;

  return (
    <Suspense fallback={null}>
      <GroupExpenseSessionPage sessionCode={sessionCode} />
    </Suspense>
  );
}
