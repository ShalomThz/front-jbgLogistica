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
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";
import type { HQOrderStep } from "./useHQOrderFlowForm";

// The carrier generates the label asynchronously; poll the fulfill until it is
// FULFILLED or a real error occurs (cap ~3 min so it never loops forever).
const FULFILL_POLL_INTERVAL_MS = 4_000;
const MAX_FULFILL_POLLS = 45;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    setShipmentPhase("selecting");
    try {
      // First select the provider.
      const request = buildSelectProviderRequest(shipmentId, shippingService);
      await selectProvider(request);

      // Then poll the fulfill until the carrier finishes the label. A real
      // error throws (-> caught below); `in_progress` just returns the shipment
      // still not FULFILLED, so we wait and try again.
      setShipmentPhase("fulfilling");
      let result = await fulfillShipment(shipmentId);
      let attempts = 0;
      while (result.status !== "FULFILLED" && attempts < MAX_FULFILL_POLLS) {
        await sleep(FULFILL_POLL_INTERVAL_MS);
        result = await fulfillShipment(shipmentId);
        attempts += 1;
      }

      if (result.status !== "FULFILLED") {
        setShipmentError(
          "La guía está tardando más de lo normal. Vuelve a intentarlo en unos minutos.",
        );
        return;
      }

      // Then if we have an orderId, update the order to save the signature
      if (orderId) {
        const orderRequest = buildEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, orderRequest);
        if (markAsPaid) {
          await updateOrder(orderId, { markAsPaid: true });
        }
      }

      setFulfilledShipment(result);
      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });

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
