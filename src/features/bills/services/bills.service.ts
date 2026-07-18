import { get, post, put, patch, del, buildQueryString } from '@/lib/http';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse, PaginatedResponse } from '@/types/api';

/** Bentuk data dari API — selaras dengan model Prisma + relasi `series` opsional */
export type BillDto = {
  id: string;
  userId: string;
  seriesId: string | null;
  expenseTransactionId?: string | null;
  categoryId?: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  } | null;
  name: string;
  amount: string | number;
  dueDate: string;
  status: 'UNPAID' | 'PAID';
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  series?: {
    id: string;
    name: string;
    dayOfMonth: number;
    isActive: boolean;
  } | null;
};

export type RecurringSeriesDto = {
  id: string;
  name: string;
  amount: string | number;
  dayOfMonth: number;
  isActive: boolean;
  notes: string | null;
  categoryId: string | null;
  category?: {
    id: string;
    name: string;
    icon: string | null;
    type: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type BillRemindersResponse = {
  overdue: BillDto[];
  upcoming: BillDto[];
  totalUnpaid: number;
  withinDays: number;
};

export const billsService = {
  async list(params?: Record<string, string | number | undefined>) {
    const q = params ? buildQueryString(params as Record<string, any>) : '';
    return get<PaginatedResponse<BillDto>>(`${API_ENDPOINTS.BILLS}${q}`);
  },

  async getById(id: string) {
    return get<ApiResponse<BillDto>>(`${API_ENDPOINTS.BILLS}/${id}`);
  },

  async createOneTime(body: {
    name: string;
    amount: number;
    dueDate: string;
    categoryId: string;
    notes?: string | null;
  }) {
    return post<ApiResponse<BillDto>>(API_ENDPOINTS.BILLS, body);
  },

  async update(id: string, body: Partial<{
    name: string;
    amount: number;
    dueDate: string;
    notes: string | null;
    categoryId: string | null;
    status: 'UNPAID' | 'PAID';
  }>) {
    return put<ApiResponse<BillDto>>(`${API_ENDPOINTS.BILLS}/${id}`, body);
  },

  async patch(id: string, body: Partial<{
    name: string;
    amount: number;
    dueDate: string;
    notes: string | null;
    categoryId: string | null;
    status: 'UNPAID' | 'PAID';
  }>) {
    return patch<ApiResponse<BillDto>>(`${API_ENDPOINTS.BILLS}/${id}`, body);
  },

  async delete(id: string) {
    return del<ApiResponse<void>>(`${API_ENDPOINTS.BILLS}/${id}`);
  },

  async reminders(withinDays = 7) {
    const q = buildQueryString({ withinDays });
    return get<ApiResponse<BillRemindersResponse>>(
      `${API_ENDPOINTS.BILLS_REMINDERS}${q}`
    );
  },

  async listRecurringSeries() {
    return get<ApiResponse<RecurringSeriesDto[]>>(
      API_ENDPOINTS.BILLS_RECURRING_SERIES
    );
  },

  async createRecurringSeries(body: {
    name: string;
    amount: number;
    dayOfMonth: number;
    categoryId: string;
    notes?: string | null;
    isActive?: boolean;
  }) {
    return post<ApiResponse<RecurringSeriesDto>>(
      API_ENDPOINTS.BILLS_RECURRING_SERIES,
      body
    );
  },

  async updateRecurringSeries(
    id: string,
    body: Partial<{
      name: string;
      amount: number;
      dayOfMonth: number;
      categoryId: string;
      notes: string | null;
      isActive: boolean;
    }>
  ) {
    return put<ApiResponse<RecurringSeriesDto>>(
      `${API_ENDPOINTS.BILLS_RECURRING_SERIES}/${id}`,
      body
    );
  },

  async deleteRecurringSeries(id: string) {
    return del<ApiResponse<void>>(
      `${API_ENDPOINTS.BILLS_RECURRING_SERIES}/${id}`
    );
  },
};
