import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FindRoutesRequest } from "../../../application/route/FindRoutesRequest";
import type { CreateRouteRequest } from "../../../application/route/CreateRouteRequest";
import type { AssignDriverToRouteRequest } from "../../../application/route/AssignDriverToRouteRequest";
import type { RecordDeliveryAttemptRequest } from "../../../application/route/RecordDeliveryAttemptRequest";
import type { FindRoutesResponse } from "../../../application/route/FindRoutesResponse";
import { routeRepository } from "../../services/routes/routeRepository";

const ROUTES_QUERY_KEY = ["routes"];

interface UseRoutesOptions extends Omit<FindRoutesRequest, "limit" | "offset"> {
  page?: number;
  limit?: number;
}

export const useRoutes = ({
  page = 1,
  limit = 10,
  filters = [],
  order,
}: UseRoutesOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindRoutesResponse>({
    queryKey: [...ROUTES_QUERY_KEY, { page, limit, filters, order }],
    queryFn: () => routeRepository.find({ filters, order, limit, offset }),
  });

  const createMutation = useMutation({
    mutationFn: (request: CreateRouteRequest) => routeRepository.create(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const assignDriverMutation = useMutation({
    mutationFn: (request: AssignDriverToRouteRequest) =>
      routeRepository.assignDriver(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: (routeId: string) => routeRepository.optimize(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (routeId: string) => routeRepository.cancel(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const routes = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  return {
    routes,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    createRoute: async (request: CreateRouteRequest) =>
      await createMutation.mutateAsync(request),
    isCreatingRoute: createMutation.isPending,
    createRouteError: createMutation.error?.message ?? null,

    assignDriverToRoute: async (request: AssignDriverToRouteRequest) =>
      await assignDriverMutation.mutateAsync(request),
    isAssigningDriver: assignDriverMutation.isPending,
    assignDriverError: assignDriverMutation.error?.message ?? null,

    optimizeRoute: async (routeId: string) =>
      await optimizeMutation.mutateAsync(routeId),
    isOptimizingRoute: optimizeMutation.isPending,
    optimizeRouteError: optimizeMutation.error?.message ?? null,

    cancelRoute: async (routeId: string) =>
      await cancelMutation.mutateAsync(routeId),
    isCancellingRoute: cancelMutation.isPending,
    cancelRouteError: cancelMutation.error?.message ?? null,
  };
};

export const useRoute = (routeId: string | undefined) =>
  useQuery({
    queryKey: [...ROUTES_QUERY_KEY, routeId],
    queryFn: () => routeRepository.getById(routeId!),
    enabled: !!routeId,
  });

export const useDriverActiveRoute = () =>
  useQuery({
    queryKey: [...ROUTES_QUERY_KEY, "active", "me"],
    queryFn: () => routeRepository.getActiveForDriver(),
  });

export const useRouteActions = () => {
  const queryClient = useQueryClient();

  const startMutation = useMutation({
    mutationFn: (routeId: string) => routeRepository.start(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const attemptMutation = useMutation({
    mutationFn: (request: RecordDeliveryAttemptRequest) =>
      routeRepository.recordDeliveryAttempt(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  const completeMutation = useMutation({
    mutationFn: (routeId: string) => routeRepository.complete(routeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ROUTES_QUERY_KEY });
    },
  });

  return {
    startRoute: async (routeId: string) =>
      await startMutation.mutateAsync(routeId),
    isStartingRoute: startMutation.isPending,
    startRouteError: startMutation.error?.message ?? null,

    recordDeliveryAttempt: async (request: RecordDeliveryAttemptRequest) =>
      await attemptMutation.mutateAsync(request),
    isRecordingDeliveryAttempt: attemptMutation.isPending,
    recordDeliveryAttemptError: attemptMutation.error?.message ?? null,

    completeRoute: async (routeId: string) =>
      await completeMutation.mutateAsync(routeId),
    isCompletingRoute: completeMutation.isPending,
    completeRouteError: completeMutation.error?.message ?? null,
  };
};
