import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FindShipmentsResponse } from "../../../application/shipment/FindShipmentsResponse";
import type { SelectShipmentProviderRequest } from "../../../application/shipment/GetshipmentProviderRequest";
import type {
  OpenShipmentIncidentRequest,
  RecordShipmentEventRequest,
  ResolveShipmentIncidentRequest,
} from "../../../application/shipment/RecordShipmentEventRequest";
import type { RatePrimitives } from "../../../domain/schemas/value-objects/Rate";
import { shipmentRepository } from "../../services/shipments/shipmentRepository";
import { SHIPMENT_TRACKING_QUERY_KEY } from "./useShipment";

const SHIPMENTS_QUERY_KEY = ["shipments"];

interface UseShipmentsOptions {
  page?: number;
  limit?: number;
  filters?: unknown[];
 }

export const useShipments = ({
  page = 1,
  limit = 10,
  filters = [],
}: UseShipmentsOptions = {}) => {
  const queryClient = useQueryClient();
  const offset = (page - 1) * limit;

  const { data, isLoading, error, refetch } = useQuery<FindShipmentsResponse>({
    queryKey: [...SHIPMENTS_QUERY_KEY, { page, limit, filters }],
    queryFn: () => shipmentRepository.find({ filters, limit, offset }),
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

import type { WarehouseAddressPrimitives } from "../../../domain/schemas/value-objects/WarehouseAddress";

interface UseShipmentRatesOptions {
  shipmentId: string;
  enabled?: boolean;
  additionalData?: Record<string, string>;
  warehouseAddress: WarehouseAddressPrimitives | null;
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

  const cancelMutation = useMutation({
    mutationFn: (shipmentId: string) => shipmentRepository.cancel(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  const abortCreationMutation = useMutation({
    mutationFn: (shipmentId: string) =>
      shipmentRepository.abortCreation(shipmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });

  /** Todo lo que cambia cuando se escribe en la línea de tiempo: el envío, la
   * orden que lo embebe, su historial y lo que se puede registrar después. */
  const invalidateTimeline = () => {
    queryClient.invalidateQueries({ queryKey: SHIPMENTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: SHIPMENT_TRACKING_QUERY_KEY });
  };

  const recordEventMutation = useMutation({
    mutationFn: (request: RecordShipmentEventRequest) =>
      shipmentRepository.recordEvent(request),
    onSuccess: () => {
      invalidateTimeline();
      // El back cierra también la parada cuando el envío va en una ruta en
      // curso, así que la ruta y su avance quedaron viejos.
      queryClient.invalidateQueries({ queryKey: ["routes"] });
    },
  });

  const openIncidentMutation = useMutation({
    mutationFn: (request: OpenShipmentIncidentRequest) =>
      shipmentRepository.openIncident(request),
    onSuccess: invalidateTimeline,
  });

  const resolveIncidentMutation = useMutation({
    mutationFn: (request: ResolveShipmentIncidentRequest) =>
      shipmentRepository.resolveIncident(request),
    onSuccess: invalidateTimeline,
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

    cancelShipment: async (shipmentId: string) =>
      await cancelMutation.mutateAsync(shipmentId),
    isCancelling: cancelMutation.isPending,
    cancelError: cancelMutation.error?.message ?? null,

    abortShipmentCreation: async (shipmentId: string) =>
      await abortCreationMutation.mutateAsync(shipmentId),
    isAbortingCreation: abortCreationMutation.isPending,

    recordShipmentEvent: recordEventMutation.mutateAsync,
    isRecordingEvent: recordEventMutation.isPending,

    openShipmentIncident: openIncidentMutation.mutateAsync,
    resolveShipmentIncident: resolveIncidentMutation.mutateAsync,
    isSavingIncident:
      openIncidentMutation.isPending || resolveIncidentMutation.isPending,
  };
};

const EMPTY_RATES: RatePrimitives[] = [];

export const useShipmentRates = ({
  shipmentId,
  enabled = true,
  additionalData,
  warehouseAddress,
}: UseShipmentRatesOptions) => {
  const { data, isFetching, error, refetch } = useQuery<RatePrimitives[]>({
    queryKey: [shipmentId, "rates", additionalData, warehouseAddress],
    queryFn: () =>
      shipmentRepository.getRates({
        shipmentId,
        additionalData: additionalData ?? {},
        warehouseAddress: warehouseAddress!,
      }),
    enabled: enabled && !!shipmentId && !!warehouseAddress,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  return {
    rates: data ?? EMPTY_RATES,
    isLoading: isFetching,
    error: error?.message ?? null,
    refetch,
  };
};
