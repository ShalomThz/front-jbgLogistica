import { userRepository } from "@contexts/iam/infrastructure/services/users/userRepository";
import { useQuery } from "@tanstack/react-query";
import type { UserListViewPrimitives } from "../../../domain/schemas/user/User";
import { USERS_QUERY_KEY } from "./useUsers";

export const useFindUserById = (userId:string) => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<UserListViewPrimitives >({
    queryKey: [...USERS_QUERY_KEY, userId],
    queryFn: async() =>  await userRepository.findById(userId),
  });

  return {
    user: data,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
};
