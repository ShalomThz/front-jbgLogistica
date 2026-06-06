import type { LoginRequestPrimitives } from "@contexts/iam/application/login/LoginRequest";
import type { LoginResponsePrimitives } from "@contexts/iam/application/login/LoginResponse";
import { loginResponseSchema } from "@contexts/iam/application/login/LoginResponse";
import type { UserListViewPrimitives } from "@contexts/iam/domain/schemas/user/User";
import { userListViewSchema } from "@contexts/iam/domain/schemas/user/User";
import { httpClient } from "@contexts/shared/infrastructure/http";
import { tokenStorage } from "@contexts/iam/infrastructure/storage/tokenStorage";

export const authRepository = {
  login: async (
    credentials: LoginRequestPrimitives,
  ): Promise<LoginResponsePrimitives> => {
    const data = await httpClient<unknown>(
      "/login",
      {
        method: "POST",
        body: JSON.stringify(credentials),
      },
      true,
    );

    const parsed = loginResponseSchema.parse(data);
    tokenStorage.setToken(parsed.token);

    return parsed;
  },

  logout: async (): Promise<void> => {
    try {
      await httpClient("/logout", { method: "POST" });
    } finally {
      tokenStorage.clearToken();
    }
  },

  getCurrentUser: async (): Promise<UserListViewPrimitives> => {
    const data = await httpClient<unknown>("/user/current");
    return userListViewSchema.parse(data);
  },
};
