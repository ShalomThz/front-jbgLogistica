import { useEffect, useMemo, useRef, useState } from "react";
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
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
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
// How long the fulfillment wait may run before we offer a manual "Cancelar"
// in the dialog (escape hatch for a creation stalled at the carrier). 90s
// covers the carrier's normal async creation plus the webhook's fast retries
// (5s/30s), so users don't abort creations that are about to succeed.
const CREATION_WAITING_CANCEL_DELAY_MS = 90_000;

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
  /** Zona elegida por el vendedor; undefined = la zona de la tienda. */
  zoneOverrideId?: string;
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
  zoneOverrideId,
}: UseHQOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] =
    useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  const { createHQOrder, updateOrder, addPayment, isCreating } = useOrders({
    enabled: false,
  });
  // Abonos capturados en el paso de cobro: NO se suben al agregarlos, solo al
  // finalizar la orden. Un ref evita reenviarlos si el completado se reintenta.
  const [pendingPayments, setPendingPayments] = useState<AddPaymentRequest[]>(
    [],
  );
  const paymentsAppliedRef = useRef(false);
  const addPendingPayment = (data: AddPaymentRequest) =>
    setPendingPayments((prev) => [...prev, data]);
  const removePendingPayment = (index: number) =>
    setPendingPayments((prev) => prev.filter((_, i) => i !== index));
  const clearPendingPayments = () => setPendingPayments([]);
  const {
    findByOrderId,
    fulfillShipment,
    selectProvider,
    abortShipmentCreation,
    isSelectingProvider,
    isFulfilling,
  } = useShipmentActions();
  const [isProcessingShipment, setIsProcessingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  const [shipmentPhase, setShipmentPhase] =
    useState<ShipmentPhase>("selecting");
  // Carrier creation sub-status (e.g. "Generando la guía…"), surfaced live.
  // Becomes true after the carrier sits too long in `creation_waiting`, so the
  // dialog can offer a manual cancel.
  const [canCancelCreation, setCanCancelCreation] = useState(false);
  // True once the user aborted the creation, so the dialog shows a "cancelled"
  // state instead of the generic error.
  const [creationCancelled, setCreationCancelled] = useState(false);
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStallTimer = () => {
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
  };

  // Arm the manual-cancel offer once the fulfillment wait has run for a while
  // without resolving; disarmed when the wait settles.
  const armCancelOffer = () => {
    if (!stallTimerRef.current) {
      stallTimerRef.current = setTimeout(
        () => setCanCancelCreation(true),
        CREATION_WAITING_CANCEL_DELAY_MS,
      );
    }
  };

  useEffect(() => clearStallTimer, []);
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
  const zoneId = zoneOverrideId ?? store?.zone?.id ?? "";
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
    setCanCancelCreation(false);
    setCreationCancelled(false);
    clearStallTimer();

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
          armCancelOffer();
          const outcome = await waitForShipmentFulfillment(shipmentId, {
            timeoutMs: FULFILL_TIMEOUT_MS,
            pollIntervalMs: FULFILL_BACKSTOP_INTERVAL_MS,
            read: () =>
              orderId ? findByOrderId(orderId) : Promise.resolve(null),
          });
          clearStallTimer();
          setCanCancelCreation(false);
          if (outcome === "failed") {
            // Don't overwrite a more specific message (e.g. a manual cancel).
            setShipmentError(
              (prev) =>
                prev ??
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

      // Save the signature. A failure here surfaces the retry dialog, but the
      // resume guard above prevents it from re-generating the guide. El estado
      // de pago (abonos) se sube aquí, al finalizar, no al agregarlo en el paso.
      if (orderId) {
        const orderRequest = buildEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, orderRequest);
        // La orden ya está tasada: recién ahora se registran los abonos.
        if (!paymentsAppliedRef.current) {
          for (const payment of pendingPayments) {
            await addPayment(orderId, payment);
          }
          paymentsAppliedRef.current = true;
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
      clearStallTimer();
      setCanCancelCreation(false);
    }
  };

  const clearShipmentError = () => {
    setShipmentError(null);
    setCreationCancelled(false);
  };

  /** Manual cancel for a shipment stuck in `creation_waiting`: cancels at the
   * carrier and reverts server-side; the in-flight wait then resolves to the
   * retry state. */
  const cancelCreation = async () => {
    if (!shipmentId) return;
    setCanCancelCreation(false);
    clearStallTimer();
    // Mark cancelled BEFORE awaiting: the abort reverts the shipment, which makes
    // the in-flight wait resolve "failed". Setting this synchronously ensures the
    // dialog shows the "cancelled" state, not a flash of the generic error.
    setCreationCancelled(true);
    setShipmentError("Creación cancelada. Reintenta o elige otra paquetería.");
    try {
      await abortShipmentCreation(shipmentId);
    } catch (error) {
      // Abort itself failed — undo the optimistic cancelled state, show the error.
      setCreationCancelled(false);
      setShipmentError(parseApiError(error));
    }
  };

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
    canCancelCreation,
    cancelCreation,
    creationCancelled,
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
    pendingPayments,
    addPendingPayment,
    removePendingPayment,
    clearPendingPayments,
  };
};
