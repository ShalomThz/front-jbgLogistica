import type { ReactNode } from 'react';
import { useCurrentUser, useLogin, useLogout, AuthContext } from '../infrastructure/hooks';
import type { LoginCredentials } from '../domain';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { data: user, isLoading } = useCurrentUser();
  const loginMutation = useLogin();
  const logoutMutation = useLogout();

  const login = async (credentials: LoginCredentials) => {
    await loginMutation.mutateAsync(credentials);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const resetLoginError = () => {
    loginMutation.reset();
  };

  const value = {
    user: user ?? null,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    loginError: loginMutation.error?.message ?? null,
    isLoggingIn: loginMutation.isPending,
    resetLoginError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
