import type {
  UserPrimitives,
  RegisterUserRequestPrimitives,
  FindUsersRequestPrimitives,
  FindUsersResponsePrimitives,
} from "../../../domain/schemas/user";
import {
  userSchema,
  findUsersResponseSchema,
} from "../../../domain/schemas/user";
import { httpClient } from "@/shared/infrastructure/http";

export type UpdateUserRequest = Partial<
  Omit<RegisterUserRequestPrimitives, "password">
> & {
  password?: string;
};

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

  getById: async (id: string): Promise<UserPrimitives> => {
    const data = await httpClient<unknown>(`/user/${id}`);
    return userSchema.parse(data);
  },

  create: async (
    user: RegisterUserRequestPrimitives,
  ): Promise<UserPrimitives> => {
    const data = await httpClient<unknown>("/user", {
      method: "POST",
      body: JSON.stringify(user),
    });
    return userSchema.parse(data);
  },

  update: async (
    id: string,
    user: UpdateUserRequest,
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
