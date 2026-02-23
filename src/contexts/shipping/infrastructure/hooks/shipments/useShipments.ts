import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FindShipmentsResponse } from "../../../application/shipment/FindShipmentsResponse";
import type { SelectShipmentProviderRequest } from "../../../application/shipment/GetshipmentProviderRequest";
import type { RatePrimitives } from "../../../domain/schemas/value-objects/Rate";
import { shipmentRepository } from "../../services/shipments/shipmentRepository";

const SHIPMENTS_QUERY_KEY = ["shipments"];

interface UseShipmentsOptions {
  page?: number;
  limit?: number;
}

export const useShipments = ({
  page = 1,
  limit = 10,
}: UseShipmentsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindShipmentsResponse>({
    queryKey: [...SHIPMENTS_QUERY_KEY, { page, limit }],
    queryFn: () => shipmentRepository.find({ filters: [], limit, offset }),
  });

  const shipments = data?.data ?? [];
  const pagination = data?.pagination ?? null;
  const totalPages = pagination ? Math.ceil(pagination.total / limit) : 1;

  const fulfillMutation = useMutation({
    mutationFn: (shipmentId: string) => shipmentRepository.fulfill(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
    },
  });

  const selectProviderMutation = useMutation({
    mutationFn: (data: SelectShipmentProviderRequest) =>
      shipmentRepository.selectProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
    },
  });

  return {
    shipments,
    pagination,
    totalPages,
    isLoading,
    error: error?.message ?? null,
    refetch,

    fulfillShipment: async (shipmentId: string) =>
      await fulfillMutation.mutateAsync(shipmentId),
    isFulfilling: fulfillMutation.isPending,
    fulfillError: fulfillMutation.error?.message ?? null,

    selectProvider: async (data: SelectShipmentProviderRequest) =>
      await selectProviderMutation.mutateAsync(data),
    isSelectingProvider: selectProviderMutation.isPending,
    selectProviderError: selectProviderMutation.error?.message ?? null,
  };
};

interface UseShipmentRatesOptions {
  shipmentId: string;
  enabled?: boolean;
  additionalData?: Record<string, string>;
}

export const useShipmentActions = () => {
  const queryClient = useQueryClient();

  const fulfillMutation = useMutation({
    mutationFn: (shipmentId: string) => shipmentRepository.fulfill(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
    },
  });

  const selectProviderMutation = useMutation({
    mutationFn: (data: SelectShipmentProviderRequest) =>
      shipmentRepository.selectProvider(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
    },
  });

  return {
    findByOrderId: shipmentRepository.findByOrderId,

    fulfillShipment: async (shipmentId: string) =>
      await fulfillMutation.mutateAsync(shipmentId),
    isFulfilling: fulfillMutation.isPending,
    fulfillError: fulfillMutation.error?.message ?? null,

    selectProvider: async (data: SelectShipmentProviderRequest) =>
      await selectProviderMutation.mutateAsync(data),
    isSelectingProvider: selectProviderMutation.isPending,
    selectProviderError: selectProviderMutation.error?.message ?? null,
  };
};

export const useShipmentRates = ({
  shipmentId,
  enabled = true,
  additionalData,
}: UseShipmentRatesOptions) => {
  const { data, isFetching, error, refetch } = useQuery<RatePrimitives[]>({
    queryKey: [...SHIPMENTS_QUERY_KEY, shipmentId, "rates", additionalData],
    queryFn: () => shipmentRepository.getRates({ shipmentId, additionalData }),
    enabled: enabled && !!shipmentId,
  });

  return {
    rates: data ?? [],
    isLoading: isFetching,
    error: error?.message ?? null,
    refetch,
  };
};
