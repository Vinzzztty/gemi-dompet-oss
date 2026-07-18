import { useState, useCallback } from 'react';
import type { BaseService } from '@/services/base.service';
import type { ApiResponse, PaginatedResponse, BaseQueryParams } from '@/types/api';

/**
 * Hook State Interface
 */
export interface UseBaseState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  } | null;
}

/**
 * Hook Actions Interface
 */
export interface UseBaseActions<T, CreateDTO = T, UpdateDTO = Partial<T>> {
  fetch: (params?: BaseQueryParams) => Promise<void>;
  fetchById: (id: string) => Promise<T | null>;
  create: (data: CreateDTO) => Promise<T | null>;
  update: (id: string, data: UpdateDTO) => Promise<T | null>;
  remove: (id: string) => Promise<boolean>;
  reset: () => void;
}

/**
 * Generic Base Hook
 * Provides CRUD operations with state management
 */
export function useBase<T, CreateDTO = T, UpdateDTO = Partial<T>>(
  service: BaseService<T, CreateDTO, UpdateDTO>
): UseBaseState<T> & UseBaseActions<T, CreateDTO, UpdateDTO> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<UseBaseState<T>['meta']>(null);

  /**
   * Fetch all items
   */
  const fetch = useCallback(
    async (params?: BaseQueryParams) => {
      setLoading(true);
      setError(null);
      try {
        const response: PaginatedResponse<T> = await service.getAll(params);
        if (response.success) {
          setData(response.data);
          setMeta(response.meta);
        } else {
          setError((response as any).error || 'Failed to fetch data');
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Fetch single item by ID
   */
  const fetchById = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response: ApiResponse<T> = await service.getById(id);
        if (response.success && response.data) {
          return response.data;
        }
        setError(response.error || 'Item not found');
        return null;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Create new item
   */
  const create = useCallback(
    async (createData: CreateDTO) => {
      setLoading(true);
      setError(null);
      try {
        const response: ApiResponse<T> = await service.create(createData);
        if (response.success && response.data) {
          // Add new item to the beginning of the list
          setData((prev) => [response.data!, ...prev]);
          return response.data;
        }
        setError(response.error || 'Failed to create item');
        return null;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Update existing item
   */
  const update = useCallback(
    async (id: string, updateData: UpdateDTO) => {
      setLoading(true);
      setError(null);
      try {
        const response: ApiResponse<T> = await service.update(id, updateData);
        
        if (response.success && response.data) {
          // Update item in the list
          setData((prev) =>
            prev.map((item: any) => (item.id === id ? response.data! : item))
          );
          return response.data;
        }
        
        setError(response.error || 'Failed to update item');
        return null;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return null;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Delete item
   */
  const remove = useCallback(
    async (id: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.delete(id);
        if (response.success) {
          // Remove item from the list
          setData((prev) => prev.filter((item: any) => item.id !== id));
          return true;
        }
        setError(response.error || 'Failed to delete item');
        return false;
      } catch (err: any) {
        setError(err.message || 'An error occurred');
        return false;
      } finally {
        setLoading(false);
      }
    },
    [service]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setData([]);
    setLoading(false);
    setError(null);
    setMeta(null);
  }, []);

  return {
    // State
    data,
    loading,
    error,
    meta,
    // Actions
    fetch,
    fetchById,
    create,
    update,
    remove,
    reset,
  };
}
