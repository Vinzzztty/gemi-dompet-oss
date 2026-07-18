import { TransactionService } from '../../../services/transaction.service';
import type { IncomeTransaction, CreateIncomeRequest } from '@/features/income/types/income';
import { API_ENDPOINTS } from '@/lib/constants';

/**
 * Income Service
 * Specialized service for income transactions
 */
export class IncomeService extends TransactionService<
  IncomeTransaction,
  CreateIncomeRequest
> {
  constructor() {
    super(API_ENDPOINTS.INCOME);
  }

  /**
   * Get income by date range
   */
  async getByDateRange(startDate: string, endDate: string) {
    return this.getTransactions({ startDate, endDate });
  }

  /**
   * Get income by category
   */
  async getByCategory(categoryId: string) {
    return this.getTransactions({ categoryId });
  }

  /**
   * Get total income
   */
  async getTotalIncome(params?: { startDate?: string; endDate?: string }) {
    return this.getTotal(params);
  }
}

// Export singleton instance
export const incomeService = new IncomeService();
