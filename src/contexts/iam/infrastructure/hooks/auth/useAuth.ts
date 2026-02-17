import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@contexts/iam/infrastructure/services/auth/authRepository";
import { tokenStorage } from "@contexts/iam/infrastructure/storage/tokenStorage";
import type { LoginRequestPrimitives } from "@contexts/iam/application/login/LoginRequest";
import type { UserPrimitives } from "@contexts/iam/domain/schemas/user/User";

const AUTH_QUERY_KEY = ["auth", "user"];

export const useAuth = () => {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery<UserPrimitives | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const token = tokenStorage.getToken();
      if (!token) return null;

      try {
        return await authRepository.getCurrentUser();
      } catch {
        tokenStorage.clearToken();
        return null;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginRequestPrimitives) => {
      return await authRepository.login(credentials);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await authRepository.logout();
    },
    onSuccess: () => {
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
      queryClient.clear();
    },
  });

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login: (credentials: LoginRequestPrimitives) =>
      loginMutation.mutateAsync(credentials).then(() => {}),
    logout: () => logoutMutation.mutateAsync().then(() => {}),
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    resetLoginError: () => loginMutation.reset(),
  };
};
