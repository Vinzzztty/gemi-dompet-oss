import { get } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';
import type { ReportData } from '@/data/reportData';

/**
 * Reports Service
 * Handles report data operations
 */
export class ReportsService {
    /**
     * Get comprehensive report data for a specific month
     * @param month - Month (0-11, where 0 is January)
     * @param year - Year (e.g., 2026)
     */
    async getReportData(month: number, year: number): Promise<ApiResponse<ReportData>> {
        const params = new URLSearchParams();
        params.append('month', month.toString());
        params.append('year', year.toString());

        const url = `${API_ENDPOINTS.REPORTS}?${params.toString()}`;
        return await get<ApiResponse<ReportData>>(url);
    }
}

// Export singleton instance
export const reportsService = new ReportsService();
