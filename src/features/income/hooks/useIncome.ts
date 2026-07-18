import { useBase, UseBaseActions, UseBaseState } from '@/hooks/useBase';
import { incomeService, IncomeService } from '@/features/income/services/income.service';
import type { IncomeTransaction, CreateIncomeRequest } from '@/features/income/types/income';
import { useState, useCallback, useEffect } from 'react';

/**
 * Income Hook Return Type
 */
export interface UseIncome extends UseBaseState<IncomeTransaction>, UseBaseActions<IncomeTransaction, CreateIncomeRequest> {
  fetchByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchByCategory: (categoryId: string) => Promise<void>;
  totalIncome: number;
}

/**
 * useIncome Hook
 * Manages income transactions state and operations
 */
export function useIncome(
  service: IncomeService = incomeService
): UseIncome {
  const baseHook = useBase<IncomeTransaction, CreateIncomeRequest>(service as any);
  const [totalIncome, setTotalIncome] = useState(0);

  /**
   * Fetch income by date range
   */
  const fetchByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      await baseHook.fetch({ startDate, endDate });
    },
    [baseHook]
  );

  /**
   * Fetch income by category
   */
  const fetchByCategory = useCallback(
    async (categoryId: string) => {
      await baseHook.fetch({ categoryId } as any);
    },
    [baseHook]
  );

  /**
   * Calculate total when data changes
   */
  useEffect(() => {
    const total = baseHook.data.reduce((sum, transaction) => {
      return sum + Number(transaction.nominal || 0);
    }, 0);
    setTotalIncome(total);
  }, [baseHook.data]);

  return {
    ...baseHook,
    fetchByDateRange,
    fetchByCategory,
    totalIncome,
  };
}
