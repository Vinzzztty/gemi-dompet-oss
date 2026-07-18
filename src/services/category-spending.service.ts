import { get } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';
import type { CategorySpending } from '@/types';

/**
 * Category Spending Service
 * Handles category spending data operations
 */
export class CategorySpendingService {
    /**
     * Get expense spending grouped by category
     */
    async getCategorySpending(startDate?: string, endDate?: string, type: 'income' | 'expense' = 'expense'): Promise<ApiResponse<CategorySpending[]>> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        params.append('type', type);

        const queryString = params.toString();
        const url = queryString
            ? `${API_ENDPOINTS.CATEGORY_SPENDING}?${queryString}`
            : API_ENDPOINTS.CATEGORY_SPENDING;

        return await get<ApiResponse<CategorySpending[]>>(url);
    }
}

// Export singleton instance
export const categorySpendingService = new CategorySpendingService();
