import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authRepository } from "@contexts/iam/infrastructure/services/auth/authRepository";
import { ApiError } from "@contexts/shared/infrastructure/http";
import { tokenStorage, TOKEN_KEY } from "@contexts/iam/infrastructure/storage/tokenStorage";
import type { LoginRequestPrimitives } from "@contexts/iam/application/login/LoginRequest";
import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";

const AUTH_QUERY_KEY = ["auth", "user"];

export const useAuth = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== TOKEN_KEY) return;

      if (e.newValue === null) {
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
        queryClient.clear();
      } else {
        // Another tab logged in — re-fetch the current user
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [queryClient]);

  const { data: user, isLoading, error: sessionError } = useQuery<UserListViewPrimitives | null>({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const token = tokenStorage.getToken();
      if (!token) return null;

      try {
        return await authRepository.getCurrentUser();
      } catch (error) {
        // Solo un 401 (token inválido/expirado) cierra sesión. httpClient ya
        // limpia el token en el 401; lo reforzamos aquí por claridad.
        if (error instanceof ApiError && error.status === 401) {
          tokenStorage.clearToken();
          return null;
        }
        // Cualquier otro error (parse Zod por un schema desactualizado, red
        // caída) NO debe expulsar al usuario en silencio: conservamos el token
        // y propagamos el error.
        throw error;
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

  const userType = user?.type ?? "EMPLOYEE";
  const isCustomer = userType === "CUSTOMER";

  return {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    sessionError: sessionError ?? null,
    userType,
    isCustomer,
    login: (credentials: LoginRequestPrimitives) =>
      loginMutation.mutateAsync(credentials).then(() => {}),
    logout: () => logoutMutation.mutateAsync().then(() => {}),
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    resetLoginError: () => loginMutation.reset(),
  };
};
