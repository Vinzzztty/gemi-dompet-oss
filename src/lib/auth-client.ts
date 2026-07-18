const USER_KEY = 'user';
const LEGACY_TOKEN_KEYS = ['token', 'auth_token', 'refresh_token'];

type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
};

export function setCurrentUser(user: CurrentUser): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(USER_KEY);
  LEGACY_TOKEN_KEYS.forEach((key) => localStorage.removeItem(key));
}

export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } finally {
    clearAuthData();
    if ('caches' in window) {
      await caches.delete('apis');
    }
  }
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;

  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? (JSON.parse(user) as CurrentUser) : null;
  } catch {
    clearAuthData();
    return null;
  }
}

export function isAuthenticated(): boolean {
  return getCurrentUser() !== null;
}
