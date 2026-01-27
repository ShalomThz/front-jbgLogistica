import type { LoginCredentials, LoginResponse, User } from '../../domain';
import { LoginResponseSchema, UserSchema } from '../../domain';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const tokenStorage = {
  getAccessToken: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: (): string | null => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken: string, refreshToken?: string): void => {
    localStorage.setItem(TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

const authFetch = async <T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth = false
): Promise<T> => {
  const token = tokenStorage.getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de servidor' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
};

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const data = await authFetch<unknown>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(credentials),
      },
      true // skipAuth - login no necesita token
    );

    const parsed = LoginResponseSchema.parse(data);
    tokenStorage.setTokens(parsed.tokens.accessToken, parsed.tokens.refreshToken);

    return parsed;
  },

  logout: async (): Promise<void> => {
    try {
      await authFetch('/auth/logout', { method: 'POST' });
    } finally {
      tokenStorage.clearTokens();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const data = await authFetch<unknown>('/auth/me');
    return UserSchema.parse(data);
  },

  refreshToken: async (): Promise<string> => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const data = await authFetch<{ accessToken: string }>(
      '/auth/refresh',
      {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      },
      true // skipAuth - refresh usa el refreshToken en body, no en header
    );

    tokenStorage.setTokens(data.accessToken);
    return data.accessToken;
  },
};
