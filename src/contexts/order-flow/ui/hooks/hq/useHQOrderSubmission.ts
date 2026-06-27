import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useTariffPrice } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffPrice";
import {
  useShipmentActions,
  useShipmentRates,
} from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { UpdateBoxRequest } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import type { WarehouseAddressPrimitives } from "@contexts/shipping/domain/schemas/value-objects/WarehouseAddress";
import { buildHQOrderRequest } from "@contexts/order-flow/application/buildHQOrderRequest";
import { buildEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { buildSelectProviderRequest } from "@contexts/order-flow/application/buildSelectProviderRequest";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { waitForShipmentFulfillment } from "@contexts/shipping/infrastructure/websocket/waitForShipmentFulfillment";
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";
import type { HQOrderStep } from "./useHQOrderFlowForm";

// The carrier generates the label asynchronously and completes it via webhook,
// which the backend broadcasts as a domain event over socket.io. We trigger the
// fulfill once and wait for that push (cap ~3 min so it never waits forever),
// with an infrequent read as a backstop if the event is missed.
const FULFILL_TIMEOUT_MS = 180_000;
const FULFILL_BACKSTOP_INTERVAL_MS = 15_000;

export type ShipmentPhase = "selecting" | "fulfilling";

interface UseHQOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<HQOrderFormValues, any, any>;
  step: HQOrderStep;
  setStep: (step: HQOrderStep) => void;
  initialOrderId?: string;
  boxes: BoxPrimitives[];
  updateBox: (id: string, data: UpdateBoxRequest) => Promise<BoxPrimitives>;
  storeId?: string;
  warehouseAddress: WarehouseAddressPrimitives | null;
}

export const useHQOrderSubmission = ({
  form,
  step,
  setStep,
  initialOrderId,
  boxes,
  updateBox,
  storeId,
  warehouseAddress,
}: UseHQOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] =
    useState<ShipmentPrimitives | null>(null);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const { user } = useAuth();
  const { createHQOrder, updateOrder, isCreating } = useOrders({
    enabled: false,
  });
  const {
    findByOrderId,
    fulfillShipment,
    selectProvider,
    isSelectingProvider,
    isFulfilling,
  } = useShipmentActions();
  const [isProcessingShipment, setIsProcessingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [shipmentPhase, setShipmentPhase] =
    useState<ShipmentPhase>("selecting");
  // Carrier creation sub-status (e.g. "Generando la guía…"), surfaced live.
  const [providerStatus, setProviderStatus] = useState<string | null>(null);
  const { data: orderData } = useOrder(orderId);

  const activeStoreId = storeId ?? user?.store.id;
  const { data: store } = useQuery({
    queryKey: ["stores", activeStoreId],
    queryFn: () => storeRepository.getById(activeStoreId!),
    enabled: !!activeStoreId,
  });

  const destinationCountry = useWatch({
    control: form.control,
    name: "recipient.address.country",
  });
  const boxId = useWatch({ control: form.control, name: "package.boxId" });
  const zoneId = store?.zone?.id ?? "";
  const {
    tariffPrice,
    isLoadingPrice: isLoadingTariff,
    priceError: tariffError,
  } = useTariffPrice({
    zoneId,
    destinationCountry: destinationCountry ?? "",
    boxId: boxId ?? "",
    enabled: step === "rate" && !!zoneId && !!destinationCountry && !!boxId,
  });
  const tariff = tariffPrice;

  const consignmentNoteClassCode = useWatch({
    control: form.control,
    name: "package.consignmentNoteClassCode",
  });
  const consignmentNotePackagingCode = useWatch({
    control: form.control,
    name: "package.consignmentNotePackagingCode",
  });

  const additionalData = useMemo(
    () => ({
      consignment_note_class_code: consignmentNoteClassCode ?? "",
      consignment_note_packaging_code: consignmentNotePackagingCode ?? "",
    }),
    [consignmentNoteClassCode, consignmentNotePackagingCode],
  );

  const {
    rates,
    isLoading: isLoadingRates,
    error: ratesError,
    refetch: refetchRates,
  } = useShipmentRates({
    shipmentId: shipmentId ?? "",
    enabled: !!shipmentId && step === "rate" && !!warehouseAddress,
    additionalData,
    warehouseAddress,
  });

  const selectedRate = useWatch({
    control: form.control,
    name: "shippingService.selectedRate",
  });

  useEffect(() => {
    if (isLoadingRates || selectedRate || rates.length === 0) return;
    const jbg = rates.find((r) => r.id === "JBG_RATE");
    if (jbg) form.setValue("shippingService.selectedRate", jbg);
  }, [rates, isLoadingRates, selectedRate, form]);

  useEffect(() => {
    if (tariff) form.setValue("shippingService.tariff", tariff);
  }, [tariff, form]);

  const goToOrders = () =>
    navigate("/orders", {
      state: orderId ? { highlightOrderId: orderId } : undefined,
    });

  const onError = (error: unknown) =>
    handleOrderError(error, {
      form,
      setStep: (step) => setStep(step as HQOrderStep),
    });

  const clearRateData = () => {
    form.setValue("shippingService.selectedRate", null);
    setFulfilledShipment(null);
  };

  const submitHQOrder = async () => {
    if (orderId) {
      try {
        setShipmentId(null);
        const request = buildEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, request);
        const shipment = await findByOrderId(orderId);
        if (!shipment) {
          toast.error("No se encontró el envío para la orden actualizada", {
            id: "order-flow",
          });
          return;
        }
        setShipmentId(shipment.id);
        form.setValue("shippingService.selectedRate", null);
        setFulfilledShipment(null);
        setStep("rate");
      } catch (error) {
        console.error("Error updating order:", error);
        onError(error);
      }
    } else {
      if (!user) {
        toast.error(
          "No se pudo identificar al usuario. Inicia sesión de nuevo.",
          { id: "order-flow" },
        );
        return;
      }
      try {
        const request = buildHQOrderRequest(
          form.getValues(),
          storeId ?? user.store.id,
        );
        const order = await createHQOrder(request);
        setOrderId(order.id);
        const shipment = await findByOrderId(order.id);
        if (!shipment) {
          toast.error("No se encontró el envío para la orden creada", {
            id: "order-flow",
          });
          return;
        }
        setShipmentId(shipment.id);
        setStep("rate");
      } catch (error) {
        console.error("Error creating order:", error);
        onError(error);
      }
    }
  };

  const selectAndFulfill = async () => {
    const shippingService = form.getValues("shippingService");
    if (!shipmentId || !shippingService.selectedRate) return;
    if (!shippingService.tariff) {
      toast.error(
        "No se pudo obtener la tarifa de la zona. Revisa la configuración de tarifas.",
        { id: "order-flow" },
      );
      return;
    }

    setIsProcessingShipment(true);
    setShipmentError(null);
    setProviderStatus(null);

    const creationFailed = (s: ShipmentPrimitives) =>
      s.status === "PROVIDER_SELECTED" && !s.providerShipmentId;

    try {
      // Resume guard: if a prior attempt already fulfilled THIS shipment (a later
      // step failed and the user retried), do NOT re-fulfill — that would cancel
      // the valid label and mint a new tracking number. Skip to the post steps.
      let result: ShipmentPrimitives | null =
        fulfilledShipment?.status === "FULFILLED" &&
        fulfilledShipment.id === shipmentId
          ? fulfilledShipment
          : null;

      if (!result) {
        // First select the provider.
        setShipmentPhase("selecting");
        const request = buildSelectProviderRequest(shipmentId, shippingService);
        await selectProvider(request);

        // Trigger the async label creation once. The carrier completes it via
        // webhook; we wait for the resulting domain event pushed over socket.io
        // (with a read backstop), then confirm with an authoritative read.
        setShipmentPhase("fulfilling");
        let current = await fulfillShipment(shipmentId);

        if (current.status !== "FULFILLED") {
          const outcome = await waitForShipmentFulfillment(shipmentId, {
            timeoutMs: FULFILL_TIMEOUT_MS,
            pollIntervalMs: FULFILL_BACKSTOP_INTERVAL_MS,
            read: () =>
              orderId ? findByOrderId(orderId) : Promise.resolve(null),
            onStatus: setProviderStatus,
          });
          if (outcome === "failed") {
            setShipmentError(
              "La paquetería no pudo crear la guía. Revisa los datos e intenta de nuevo.",
            );
            return;
          }
          const latest = orderId ? await findByOrderId(orderId) : null;
          if (latest) current = latest;
        }

        if (creationFailed(current)) {
          setShipmentError(
            "La paquetería no pudo crear la guía. Revisa los datos e intenta de nuevo.",
          );
          return;
        }

        if (current.status !== "FULFILLED") {
          setShipmentError(
            "La guía está tardando más de lo normal. Vuelve a intentarlo en unos minutos.",
          );
          return;
        }

        result = current;
        // Persist now so a failure in the steps below resumes WITHOUT re-fulfilling.
        setFulfilledShipment(result);
      }

      // Save the signature / mark-as-paid. A failure here surfaces the retry
      // dialog, but the resume guard above prevents it from re-generating the guide.
      if (orderId) {
        const orderRequest = buildEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, orderRequest);
        if (markAsPaid) {
          await updateOrder(orderId, { markAsPaid: true });
        }
      }

      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Best-effort inventory decrement: never blocks or fails the flow.
      const pkg = form.getValues("package");
      if (pkg.ownership === "STORE" && pkg.boxId) {
        const box = boxes.find((b) => b.id === pkg.boxId);
        if (box && box.stock > 0) {
          try {
            await updateBox(pkg.boxId, { stock: box.stock - 1 });
            toast.success(
              `Se descontó 1 unidad de "${box.name}" del inventario`,
              { id: "order-flow" },
            );
          } catch (error) {
            toast.error(parseApiError(error), { id: "order-flow" });
          }
        }
      }
    } catch (error) {
      console.error("Error selecting provider:", error);
      // Surfaced in the fulfillment dialog (retry / change carrier), not a toast.
      setShipmentError(parseApiError(error));
    } finally {
      setIsProcessingShipment(false);
    }
  };

  const clearShipmentError = () => setShipmentError(null);

  return {
    orderId,
    goToOrders,
    clearRateData,
    submitHQOrder,
    selectAndFulfill,
    rates,
    isLoadingRates,
    ratesError,
    refetchRates,
    isCreating,
    isSelectingProvider,
    isFulfilling,
    isProcessingShipment,
    shipmentPhase,
    providerStatus,
    shipmentError,
    clearShipmentError,
    fulfilledShipment,
    totalBilled: orderData?.financials.totalBilled ?? null,
    tariff,
    isLoadingTariff,
    tariffError,
    tariffZoneId: zoneId,
    tariffDestinationCountry: destinationCountry ?? "",
    tariffBoxId: boxId ?? "",
    markAsPaid,
    setMarkAsPaid,
  };
};
