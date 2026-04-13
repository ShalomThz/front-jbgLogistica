import type { FindUsersRequestPrimitives } from "@contexts/iam/application/user/FindUsersRequest";
import type { FindUsersResponsePrimitives } from "@contexts/iam/application/user/FindUsersResponse";
import { findUsersResponseSchema } from "@contexts/iam/application/user/FindUsersResponse";
import type { RegisterUserRequestPrimitives } from "@contexts/iam/application/user/RegisterUserRequest";
import type { UserListViewPrimitives, UserPrimitives } from "@contexts/iam/domain/schemas/user/User";
import { userListViewSchema, userSchema } from "@contexts/iam/domain/schemas/user/User";
import { httpClient } from "@contexts/shared/infrastructure/http";
import z from "zod";
import type { EditUserRequest } from "../../../application/user/EditUserRequest";

export const userRepository = {
  find: async (
    request: FindUsersRequestPrimitives,
  ): Promise<FindUsersResponsePrimitives> => {
    const data = await httpClient<unknown>("/user/find", {
      method: "POST",
      body: JSON.stringify(request),
    });
    return findUsersResponseSchema.parse(data);
  },

  findById: async (id: string): Promise<UserListViewPrimitives> => {
    const data = await httpClient<unknown>(`/user/${id}`);
    return userListViewSchema.parse(data);
  },

  create: async (
    user: RegisterUserRequestPrimitives,
  ): Promise<{ id: string; token: string }> => {
    const data = await httpClient<unknown>("/user", {
      method: "POST",
      body: JSON.stringify(user),
    });

    return z.object({ id: z.string(), token: z.string() }).parse(data);
  },

  update: async (
    id: string,
    user: EditUserRequest,
  ): Promise<UserPrimitives> => {
    const data = await httpClient<unknown>(`/user/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
    return userSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/user/${id}`, {
      method: "DELETE",
    });
  },
};
