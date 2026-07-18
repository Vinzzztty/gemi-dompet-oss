import { useBase, UseBaseActions, UseBaseState } from '../../../hooks/useBase';
import { expenseService, ExpenseService } from '../services/expense.service';
import type { ExpenseTransaction, CreateExpenseRequest } from '@/features/expense/types/expense';
import { useState, useCallback, useEffect } from 'react';

/**
 * Expense Hook Return Type
 */
export interface UseExpense extends UseBaseState<ExpenseTransaction>, UseBaseActions<ExpenseTransaction, CreateExpenseRequest> {
  fetchByDateRange: (startDate: string, endDate: string) => Promise<void>;
  fetchByCategory: (categoryId: string) => Promise<void>;
  totalExpense:number;
}

/**
 * useExpense Hook
 * Manages expense transactions state and operations
 */
export function useExpense(
  service: ExpenseService = expenseService
): UseExpense {
  const baseHook = useBase<ExpenseTransaction, CreateExpenseRequest>(service as any);
  const [totalExpense, setTotalExpense] = useState(0);

  /**
   * Fetch expenses by date range
   */
  const fetchByDateRange = useCallback(
    async (startDate: string, endDate: string) => {
      await baseHook.fetch({ startDate, endDate });
    },
    [baseHook]
  );

  /**
   * Fetch expenses by category
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
    setTotalExpense(total);
  }, [baseHook.data]);

  return {
    ...baseHook,
    fetchByDateRange,
    fetchByCategory,
    totalExpense,
  };
}
