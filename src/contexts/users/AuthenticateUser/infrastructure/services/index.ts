const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export const { authService, tokenStorage } = useMock
  ? await import('./authService.mock')
  : await import('./authService');
