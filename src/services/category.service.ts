import { BaseService } from './base.service';
import type { Category } from '@/features/income/types/income';
import type { ApiResponse } from '@/types/api';
import { API_ENDPOINTS, CategoryType } from '@/lib/constants';
import { get, post } from '@/lib/http';

/**
 * Create Category Request
 */
export interface CreateCategoryRequest {
  name: string;
  type: CategoryType;
  icon?: string;
}

/**
 * Update Category Request
 */
export interface UpdateCategoryRequest {
  name?: string;
  type?: CategoryType;
  icon?: string;
}

/**
 * Category Service
 * Handles all category-related API calls
 */
export class CategoryService extends BaseService<Category> {
  constructor() {
    super(API_ENDPOINTS.CATEGORIES);
  }

  /**
   * Get categories by type (income or expense)
   */
  async getByType(type: CategoryType): Promise<ApiResponse<Category[]>> {
    return get<ApiResponse<Category[]>>(`${this.endpoint}?type=${type.toLowerCase()}`);
  }

  /**
   * Get income categories specifically
   */
  async getIncomeCategories(): Promise<ApiResponse<Category[]>> {
    return this.getByType('INCOME');
  }

  /**
   * Get expense categories specifically
   */
  async getExpenseCategories(): Promise<ApiResponse<Category[]>> {
    return this.getByType('EXPENSE');
  }

  /**
   * Create new category
   */
  async createCategory(data: CreateCategoryRequest): Promise<ApiResponse<Category>> {
    return post<ApiResponse<Category>, CreateCategoryRequest>(this.endpoint, data);
  }

  /**
   * Update existing category
   */
  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<ApiResponse<Category>> {
    return this.update(id, data) as Promise<ApiResponse<Category>>;
  }

  /**
   * Delete category
   */
  async deleteCategory(id: string): Promise<ApiResponse<void>> {
    return this.delete(id) as Promise<ApiResponse<void>>;
  }
}

// Export singleton instance
export const categoryService = new CategoryService();
