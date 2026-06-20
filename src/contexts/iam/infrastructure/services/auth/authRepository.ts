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

    const result = loginResponseSchema.safeParse(data);
    if (!result.success) {
      console.error("[authRepository] Parse error in login:", result.error.issues);
      console.error("[authRepository] Raw data received:", data);
      throw result.error;
    }

    tokenStorage.setToken(result.data.token);

    return result.data;
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

    const result = userListViewSchema.safeParse(data);
    if (!result.success) {
      console.error("[authRepository] Parse error in getCurrentUser:", result.error.issues);
      console.error("[authRepository] Raw data received:", data);
      throw result.error;
    }

    return result.data;
  },
};
