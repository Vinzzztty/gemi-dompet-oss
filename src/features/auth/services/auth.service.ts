import { post } from '@/lib/http';
import { clearAuthData, setCurrentUser } from '@/lib/auth-client';
import { API_ENDPOINTS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
}

/**
 * Auth Response
 */
export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
}

/**
 * Auth Service
 * Handles authentication operations
 */
export class AuthService {
  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await post<ApiResponse<AuthResponse>, LoginRequest>(
      API_ENDPOINTS.LOGIN,
      credentials
    );

    if (response.success && response.data) {
      setCurrentUser(response.data.user);
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    const response = await post<ApiResponse<AuthResponse>, RegisterRequest>(
      API_ENDPOINTS.REGISTER,
      data
    );

    if (response.success && response.data) {
      setCurrentUser(response.data.user);
    }

    return response;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await post(API_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout error:', error);
    } finally {
      clearAuthData();
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
