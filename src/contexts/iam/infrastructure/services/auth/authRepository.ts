import type {
  LoginRequestPrimitives,
  LoginResponsePrimitives,
  UserPrimitives,
} from "../../../domain";
import { loginResponseSchema, userSchema } from "../../../domain";
import { httpClient } from "@/shared/infrastructure/http";
import { tokenStorage } from "../../storage";

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

  getCurrentUser: async (): Promise<UserPrimitives> => {
    const data = await httpClient<unknown>("/user/current");
    return userSchema.parse(data);
  },
};
