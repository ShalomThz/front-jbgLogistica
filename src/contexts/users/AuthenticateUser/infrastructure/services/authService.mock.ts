import type { LoginCredentials, LoginResponse, User } from '../../domain';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

const MOCK_USER: User = {
  id: '1',
  email: 'admin@jbg.com',
  name: 'Admin JBG',
  role: 'ADMIN',
  storeId: null,
  createdAt: new Date(),
};

const MOCK_CREDENTIALS = {
  email: 'admin@jbg.com',
  password: '123456',
};

const FAKE_ACCESS_TOKEN = 'mock-access-token-xyz';
const FAKE_REFRESH_TOKEN = 'mock-refresh-token-xyz';

const delay = (ms = 500) => new Promise((resolve) => setTimeout(resolve, ms));

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

export const authService = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    await delay();

    if (
      credentials.email !== MOCK_CREDENTIALS.email ||
      credentials.password !== MOCK_CREDENTIALS.password
    ) {
      throw new Error('Credenciales inválidas');
    }

    const response: LoginResponse = {
      user: { ...MOCK_USER, createdAt: new Date() },
      tokens: {
        accessToken: FAKE_ACCESS_TOKEN,
        refreshToken: FAKE_REFRESH_TOKEN,
      },
    };

    tokenStorage.setTokens(response.tokens.accessToken, response.tokens.refreshToken);

    return response;
  },

  logout: async (): Promise<void> => {
    await delay(200);
    tokenStorage.clearTokens();
  },

  getCurrentUser: async (): Promise<User> => {
    await delay(300);

    const token = tokenStorage.getAccessToken();
    if (!token) {
      throw new Error('No autenticado');
    }

    return { ...MOCK_USER, createdAt: new Date() };
  },

  refreshToken: async (): Promise<string> => {
    await delay(200);

    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token');
    }

    const newToken = 'mock-access-token-refreshed';
    tokenStorage.setTokens(newToken);
    return newToken;
  },
};
