import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userRepository, type UpdateUserRequest } from "@contexts/iam/infrastructure/services/users/userRepository";
import type { RegisterUserRequestPrimitives } from "@contexts/iam/application/user/RegisterUserRequest";
import type { FindUsersResponsePrimitives } from "@contexts/iam/application/user/FindUsersResponse";

const USERS_QUERY_KEY = ["users"];

interface UseUsersOptions {
  page?: number;
  limit?: number;
}

export const useUsers = ({ page = 1, limit = 10 }: UseUsersOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery<FindUsersResponsePrimitives>({
    queryKey: [...USERS_QUERY_KEY, { page, limit }],
    queryFn: () => userRepository.find({ filters: [], limit, offset }),
  });

  const users = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const createMutation = useMutation({
    mutationFn: (data: RegisterUserRequestPrimitives) => userRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) =>
      userRepository.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userRepository.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    },
  });

  return {
    users,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createUser: (data: RegisterUserRequestPrimitives) =>
      createMutation.mutateAsync(data),
    isCreating: createMutation.isPending,
    createError: createMutation.error?.message ?? null,

    updateUser: (id: string, data: UpdateUserRequest) =>
      updateMutation.mutateAsync({ id, data }),
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message ?? null,

    deleteUser: (id: string) => deleteMutation.mutateAsync(id),
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error?.message ?? null,
  };
};
