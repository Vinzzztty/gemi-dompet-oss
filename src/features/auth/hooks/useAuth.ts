import { useState, useCallback } from 'react';
import { authService, AuthService, LoginRequest, RegisterRequest } from '@/features/auth/services/auth.service';
import { clearAuthData, isAuthenticated } from '@/lib/auth-client';
import type { ApiResponse } from '@/types/api';

/**
 * Auth User Type
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Auth Hook State
 */
interface UseAuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

/**
 * Auth Hook Return Type
 */
interface UseAuth extends UseAuthState {
  login: (credentials: LoginRequest) => Promise<boolean>;
  register: (data: RegisterRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => boolean;
}

/**
 * useAuth Hook
 * Manages authentication state and operations
 */
export function useAuth(service: AuthService = authService): UseAuth {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authenticated, setAuthenticated] = useState(isAuthenticated());

  /**
   * Login user
   */
  const login = useCallback(
    async (credentials: LoginRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.login(credentials);
        if (response.success && response.data) {
          setUser(response.data.user);
          setAuthenticated(true);
          return true;
        }
        setError(response.error || 'Login failed');
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
   * Register new user
   */
  const register = useCallback(
    async (data: RegisterRequest): Promise<boolean> => {
      setLoading(true);
      setError(null);
      try {
        const response = await service.register(data);
        if (response.success && response.data) {
          setUser(response.data.user);
          setAuthenticated(true);
          return true;
        }
        setError(response.error || 'Registration failed');
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
   * Logout user
   */
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await service.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAuthenticated(false);
      setLoading(false);
      clearAuthData();
    }
  }, [service]);

  /**
   * Check authentication status
   */
  const checkAuth = useCallback((): boolean => {
    const isAuth = isAuthenticated();
    setAuthenticated(isAuth);
    return isAuth;
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: authenticated,
    login,
    register,
    logout,
    checkAuth,
  };
}
