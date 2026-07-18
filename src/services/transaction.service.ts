import { BaseService } from './base.service';
import type { BaseQueryParams } from '@/types/api';

/**
 * Transaction Query Parameters
 */
export interface TransactionQueryParams extends BaseQueryParams {
  categoryId?: string;
}

/**
 * Generic Transaction Service
 * Can be used for income, expense, or any transaction type
 */
export class TransactionService<
  T,
  CreateDTO = Omit<T, 'id' | 'userId' | 'createdAt'>,
  UpdateDTO = Partial<CreateDTO>
> extends BaseService<T, CreateDTO, UpdateDTO> {
  /**
   * Get transactions with filters
   */
  async getTransactions(params?: TransactionQueryParams) {
    return this.getAll(params);
  }

  /**
   * Get total amount
   */
  async getTotal(params?: TransactionQueryParams) {
    // This would call a dedicated endpoint if available
    // For now, we calculate from getAll
    const result = await this.getTransactions(params);
    if (!result.success || !result.data) return 0;
    
    return result.data.reduce((sum: number, transaction: any) => {
      return sum + Number(transaction.nominal || 0);
    }, 0);
  }
}
