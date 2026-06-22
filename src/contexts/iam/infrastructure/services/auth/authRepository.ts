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
      console.group("%c[authRepository] login: parse FAILED", "color:#dc2626;font-weight:bold");
      result.error.issues.forEach((issue) => {
        console.error(
          `• ${issue.path.join(".") || "(root)"} → ${issue.message}`,
          issue,
        );
      });
      console.error("Raw data received:", data);
      console.groupEnd();
      throw result.error;
    }

    console.info("%c[auth-debug] login OK → token recibido", "color:#16a34a");
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
    console.info("%c[auth-debug] getCurrentUser → llamando /user/current", "color:#2563eb");
    const data = await httpClient<unknown>("/user/current");
    console.info("[auth-debug] getCurrentUser → respuesta cruda:", data);

    const result = userListViewSchema.safeParse(data);
    if (!result.success) {
      console.group("%c[authRepository] getCurrentUser: parse FAILED", "color:#dc2626;font-weight:bold");
      result.error.issues.forEach((issue) => {
        const received =
          "received" in issue ? ` (recibido: ${JSON.stringify(issue.received)})` : "";
        console.error(
          `• ${issue.path.join(".") || "(root)"} → ${issue.message}${received}`,
          issue,
        );
      });
      console.error("Raw data received:", data);
      console.groupEnd();
      throw result.error;
    }

    console.info("%c[auth-debug] getCurrentUser OK", "color:#16a34a", {
      id: result.data.id,
      type: result.data.type,
      permisos: result.data.role.permissions.length,
    });
    return result.data;
  },
};
