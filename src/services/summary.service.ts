import { get } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';
import type { Summary } from '@/types';

/**
 * Summary Service
 * Handles financial summary operations
 */
export class SummaryService {
    /**
     * Get financial summary (balance, income, expense)
     */
    async getSummary(startDate?: string, endDate?: string): Promise<ApiResponse<Summary>> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const queryString = params.toString();
        const url = queryString
            ? `${API_ENDPOINTS.SUMMARY}?${queryString}`
            : API_ENDPOINTS.SUMMARY;

        return await get<ApiResponse<Summary>>(url);
    }
}

// Export singleton instance
export const summaryService = new SummaryService();
