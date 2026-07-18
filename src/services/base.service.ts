import { get, post, put, del } from '@/lib/http';
import type { ApiResponse, PaginatedResponse, BaseQueryParams } from '@/types/api';

/**
 * Generic Base Service Class
 * Provides CRUD operations for any entity
 */
export class BaseService<T, CreateDTO = T, UpdateDTO = Partial<T>> {
  constructor(protected endpoint: string) {}

  /**
   * Get all items
   */
  async getAll(params?: BaseQueryParams): Promise<PaginatedResponse<T>> {
    const queryString = params 
      ? '?' + new URLSearchParams(params as any).toString()
      : '';
    return get<PaginatedResponse<T>>(`${this.endpoint}${queryString}`);
  }

  /**
   * Get single item by ID
   */
  async getById(id: string): Promise<ApiResponse<T>> {
    return get<ApiResponse<T>>(`${this.endpoint}/${id}`);
  }

  /**
   * Create new item
   */
  async create(data: CreateDTO): Promise<ApiResponse<T>> {
    return post<ApiResponse<T>, CreateDTO>(this.endpoint, data);
  }

  /**
   * Update existing item
   */
  async update(id: string, data: UpdateDTO): Promise<ApiResponse<T>> {
    return put<ApiResponse<T>, UpdateDTO>(`${this.endpoint}/${id}`, data);
  }

  /**
   * Delete item
   */
  async delete(id: string): Promise<ApiResponse<void>> {
    return del<ApiResponse<void>>(`${this.endpoint}/${id}`);
  }
}
