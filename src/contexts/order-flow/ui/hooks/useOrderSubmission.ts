import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useShipmentActions, useShipmentRates } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";
import type { UpdateBoxRequest } from "@contexts/inventory/infrastructure/services/boxes/boxRepository";
import { buildHQOrderRequest } from "@contexts/order-flow/application/buildHQOrderRequest";
import { buildPartnerOrderRequest } from "@contexts/order-flow/application/buildPartnerOrderRequest";
import { buildEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { buildSelectProviderRequest } from "@contexts/order-flow/application/buildSelectProviderRequest";
import type { OrderStep } from "./useOrderFlowForm";

interface UseOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<NewOrderFormValues, any, any>;
  step: OrderStep;
  setStep: (step: OrderStep) => void;
  initialOrderId?: string;
  boxes: BoxPrimitives[];
  updateBox: (id: string, data: UpdateBoxRequest) => Promise<BoxPrimitives>;
}

export const useOrderSubmission = ({
  form,
  step,
  setStep,
  initialOrderId,
  boxes,
  updateBox,
}: UseOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] = useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  const { createHQOrder, createPartnerOrder, updateOrder, isCreating } = useOrders();
  const { findByOrderId, fulfillShipment, selectProvider, isSelectingProvider } = useShipmentActions();

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
        toast.error("Error al actualizar la orden. Intenta de nuevo.", { id: "order-flow" });
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
        toast.error("Error al crear la orden. Intenta de nuevo.", { id: "order-flow" });
      }
    }
  };

  const submitPartnerOrder = async () => {
    if (orderId) {
      try {
        const request = buildEditOrderRequest(form.getValues());
        await updateOrder(orderId, request);
        goToOrders();
      } catch (error) {
        console.error("Error updating partner order:", error);
        toast.error("Error al actualizar la orden. Intenta de nuevo.", { id: "order-flow" });
      }
    } else {
      if (!user) {
        toast.error("No se pudo identificar al usuario. Inicia sesión de nuevo.", { id: "order-flow" });
        return;
      }
      try {
        const request = buildPartnerOrderRequest(form.getValues(), user.storeId);
        const order = await createPartnerOrder(request);
        setOrderId(order.id);
        goToOrders();
      } catch (error) {
        console.error("Error creating partner order:", error);
        toast.error("Error al crear la orden. Intenta de nuevo.", { id: "order-flow" });
      }
    }
  };

  const selectAndFulfill = async () => {
    const shippingService = form.getValues("shippingService");
    if (!shipmentId || !shippingService.selectedRate) return;

    try {
      const request = buildSelectProviderRequest(shipmentId, shippingService);
      await selectProvider(request);
      const result = await fulfillShipment(shipmentId);
      setFulfilledShipment(result);
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      const pkg = form.getValues("package");
      if (pkg.ownership === "STORE" && pkg.boxId) {
        const box = boxes.find((b) => b.id === pkg.boxId);
        if (box && box.stock > 0) {
          try {
            await updateBox(pkg.boxId, { stock: box.stock - 1 });
            toast.success(`Se descontó 1 unidad de "${box.name}" del inventario`, { id: "order-flow" });
          } catch {
            toast.error("No se pudo descontar el stock de la caja", { id: "order-flow" });
          }
        }
      }
    } catch (error) {
      console.error("Error selecting provider:", error);
      toast.error("Error al crear el envío. Intenta de nuevo.", { id: "order-flow" });
    }
  };

  return {
    orderId,
    goToOrders,
    clearRateData,
    submitHQOrder,
    submitPartnerOrder,
    selectAndFulfill,
    rates,
    isLoadingRates,
    ratesError,
    refetchRates,
    isCreating,
    isSelectingProvider,
    fulfilledShipment,
  };
};
