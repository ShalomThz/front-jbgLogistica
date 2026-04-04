import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useShipmentActions, useShipmentRates } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { UpdateBoxRequest } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import { buildHQOrderRequest } from "@contexts/order-flow/application/buildHQOrderRequest";
import { buildEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { buildSelectProviderRequest } from "@contexts/order-flow/application/buildSelectProviderRequest";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";
import type { HQOrderStep } from "./useHQOrderFlowForm";

interface UseHQOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<HQOrderFormValues, any, any>;
  step: HQOrderStep;
  setStep: (step: HQOrderStep) => void;
  initialOrderId?: string;
  boxes: BoxPrimitives[];
  updateBox: (id: string, data: UpdateBoxRequest) => Promise<BoxPrimitives>;
}

export const useHQOrderSubmission = ({
  form,
  step,
  setStep,
  initialOrderId,
  boxes,
  updateBox,
}: UseHQOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] = useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  const { createHQOrder, updateOrder, isCreating } = useOrders({ enabled: false });
  const { findByOrderId, fulfillShipment, selectProvider, isSelectingProvider } = useShipmentActions();
  const { data: orderData } = useOrder(step === "success" ? orderId : undefined);

  const consignmentNoteClassCode = useWatch({ control: form.control, name: "package.consignmentNoteClassCode" });
  const consignmentNotePackagingCode = useWatch({ control: form.control, name: "package.consignmentNotePackagingCode" });
  const { rates, isLoading: isLoadingRates, error: ratesError, refetch: refetchRates } = useShipmentRates({
    shipmentId: shipmentId ?? "",
    enabled: !!shipmentId && step === "rate",
    additionalData: {
      consignment_note_class_code: consignmentNoteClassCode,
      consignment_note_packaging_code: consignmentNotePackagingCode,
    },
  });

  const goToOrders = () => navigate("/orders");

  const onError = (error: unknown) => handleOrderError(error, {
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
        const request = buildEditOrderRequest(form.getValues());
        await updateOrder(orderId, request);
        const shipment = await findByOrderId(orderId);
        if (!shipment) {
          toast.error("No se encontró el envío para la orden actualizada", { id: "order-flow" });
          return;
        }
        setShipmentId(shipment.id);
        queryClient.invalidateQueries({ queryKey: ["shipments", shipment.id, "rates"] });
        form.setValue("shippingService.selectedRate", null);
        setFulfilledShipment(null);
        setStep("rate");
      } catch (error) {
        console.error("Error updating order:", error);
        onError(error);
      }
    } else {
      if (!user) {
        toast.error("No se pudo identificar al usuario. Inicia sesión de nuevo.", { id: "order-flow" });
        return;
      }
      try {
        const request = buildHQOrderRequest(form.getValues(), user.storeId);
        const order = await createHQOrder(request);
        setOrderId(order.id);
        const shipment = await findByOrderId(order.id);
        if (!shipment) {
          toast.error("No se encontró el envío para la orden creada", { id: "order-flow" });
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

    try {
      // First select provider and fulfill
      const request = buildSelectProviderRequest(shipmentId, shippingService);
      await selectProvider(request);
      const result = await fulfillShipment(shipmentId);

      // Then if we have an orderId, update the order to save the signature
      if (orderId) {
        const orderRequest = buildEditOrderRequest(form.getValues());
        await updateOrder(orderId, orderRequest);
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
            toast.success(`Se descontó 1 unidad de "${box.name}" del inventario`, { id: "order-flow" });
          } catch (error) {
            toast.error(parseApiError(error), { id: "order-flow" });
          }
        }
      }
    } catch (error) {
      console.error("Error selecting provider:", error);
      toast.error(parseApiError(error), { id: "order-flow" });
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
    fulfilledShipment,
    invoiceId: orderData?.invoiceId ?? null,
  };
};
