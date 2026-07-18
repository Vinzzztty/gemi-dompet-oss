import api from './api';
import { AxiosRequestConfig } from 'axios';

/**
 * Generic HTTP GET request
 */
export async function get<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.get<T>(url, config);
  return response.data;
}

/**
 * Generic HTTP POST request
 */
export async function post<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.post<T>(url, data, config);
  return response.data;
}

/**
 * Generic HTTP PUT request
 */
export async function put<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.put<T>(url, data, config);
  return response.data;
}

/**
 * Generic HTTP PATCH request
 */
export async function patch<T, D = any>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.patch<T>(url, data, config);
  return response.data;
}

/**
 * Generic HTTP DELETE request
 */
export async function del<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await api.delete<T>(url, config);
  return response.data;
}

/**
 * Build query string from params object
 */
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value));
    }
  });
  
  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

/**
 * Generic request wrapper with error handling
 */
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  try {
    switch (method) {
      case 'GET':
        return await get<T>(url, config);
      case 'POST':
        return await post<T>(url, data, config);
      case 'PUT':
        return await put<T>(url, data, config);
      case 'PATCH':
        return await patch<T>(url, data, config);
      case 'DELETE':
        return await del<T>(url, config);
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  } catch (error: any) {
    // Re-throw with formatted error
    throw {
      message: error.message || 'Request failed',
      status: error.status,
      data: error.data,
    };
  }
}
