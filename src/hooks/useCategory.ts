import { useState, useCallback, useEffect } from 'react';
import { categoryService, CategoryService, CreateCategoryRequest, UpdateCategoryRequest } from '@/services/category.service';
import type { Category } from '@/features/income/types/income';
import type { CategoryType } from '@/lib/constants';

/**
 * Category Hook State
 */
interface UseCategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
}

/**
 * Category Hook Return Type
 */
interface UseCategory extends UseCategoryState {
  fetchCategories: (type?: CategoryType) => Promise<void>;
  fetchIncomeCategories: () => Promise<void>;
  fetchExpenseCategories: () => Promise<void>;
  createCategory: (data: CreateCategoryRequest) => Promise<Category | null>;
  updateCategory: (id: string, data: UpdateCategoryRequest) => Promise<Category | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

/**
 * useCategory Hook
 * Manages category state and operations
 */
export function useCategory(
  initialType?: CategoryType,
  service: CategoryService = categoryService
): UseCategory {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastType, setLastType] = useState<CategoryType | undefined>(initialType);

  /**
   * Fetch categories by type
   */
  const fetchCategories = useCallback(
    async (type?: CategoryType) => {
      setLoading(true);
      setError(null);
      try {
        const response = type
          ? await service.getByType(type)
          : await service.getAll();

        if (response.success) {
          const data = Array.isArray(response.data) 
            ? response.data 
            : response.data || [];
          setCategories(data);
          setLastType(type);
        } else {
          setError((response as any).error || 'Failed to fetch categories');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setCategories([]);
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Fetch income categories
   */
  const fetchIncomeCategories = useCallback(async () => {
    return fetchCategories('INCOME');
  }, [fetchCategories]);

  /**
   * Fetch expense categories
   */
  const fetchExpenseCategories = useCallback(async () => {
    return fetchCategories('EXPENSE');
  }, [fetchCategories]);

  /**
   * Create new category
   */
  const createCategory = useCallback(
    async (data: CreateCategoryRequest): Promise<Category | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.createCategory(data);
        if (response.success && response.data) {
          // Refresh categories list after creating
          await fetchCategories(lastType);
          return response.data;
        }
        setError((response as any).error || 'Failed to create category');
        return null;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service, fetchCategories, lastType]
  );

  /**
   * Update existing category
   */
  const updateCategory = useCallback(
    async (id: string, data: UpdateCategoryRequest): Promise<Category | null> => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.updateCategory(id, data);
        if (response.success && response.data) {
          // Refresh categories list after updating
          await fetchCategories(lastType);
          return response.data;
        }
        setError((response as any).error || 'Failed to update category');
        return null;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service, fetchCategories, lastType]
  );

  /**
   * Delete category
   */
  const deleteCategory = useCallback(
    async (id: string): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.deleteCategory(id);
        if (response.success) {
          // Refresh categories list after deleting
          await fetchCategories(lastType);
          return true;
        }
        setError((response as any).error || (response as any).message || 'Failed to delete category');
        return false;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [service, fetchCategories, lastType]
  );

  /**
   * Refresh with last used type
   */
  const refresh = useCallback(async () => {
    return fetchCategories(lastType);
  }, [fetchCategories, lastType]);

  // Auto-fetch on mount if initialType is provided
  useEffect(() => {
    if (initialType) {
      fetchCategories(initialType);
    }
  }, []); // Only run on mount

  return {
    categories,
    loading,
    error,
    fetchCategories,
    fetchIncomeCategories,
    fetchExpenseCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    refresh,
  };
}
