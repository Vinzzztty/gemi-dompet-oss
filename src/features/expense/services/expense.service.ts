import { TransactionService } from '@/services';
import type { ExpenseTransaction, CreateExpenseRequest, UpdateExpenseRequest } from '@/features/expense/types/expense';
import { API_ENDPOINTS } from '@/lib/constants';

/**
 * Expense Service
 * Specialized service for expense transactions
 */
export class ExpenseService extends TransactionService<
  ExpenseTransaction,
  CreateExpenseRequest
> {
  constructor() {
    super(API_ENDPOINTS.EXPENSE);
  }

  /**
   * Get expenses by date range
   */
  async getByDateRange(startDate: string, endDate: string) {
    return this.getTransactions({ startDate, endDate });
  }

  /**
   * Get expenses by category
   */
  async getByCategory(categoryId: string) {
    return this.getTransactions({ categoryId });
  }

  /**
   * Get total expense
   */
  async getTotalExpense(params?: { startDate?: string; endDate?: string }) {
    return this.getTotal(params);
  }

  /**
   * Update expense
   */
  async update(id: string, data: UpdateExpenseRequest) {
    return super.update(id, data);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
