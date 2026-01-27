import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService, tokenStorage } from '../services';
import type { LoginCredentials, User } from '../../domain';

const AUTH_QUERY_KEY = ['auth', 'user'];

export const useCurrentUser = () => {
  return useQuery<User | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const token = tokenStorage.getAccessToken();
      if (!token) return null;

      try {
        return await authService.getCurrentUser();
      } catch {
        tokenStorage.clearTokens();
        return null;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
    retry: false,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (credentials: LoginCredentials) => authService.login(credentials),
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });
};
