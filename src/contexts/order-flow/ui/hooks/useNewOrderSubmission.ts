import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useShipmentActions, useShipmentRates } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { buildHQOrderRequest } from "@contexts/order-flow/application/buildHQOrderRequest";
import { buildPartnerOrderRequest } from "@contexts/order-flow/application/buildPartnerOrderRequest";
import { buildSelectProviderRequest } from "@contexts/order-flow/application/buildSelectProviderRequest";
import type { OrderStep } from "./useNewOrderForm";

interface UseNewOrderSubmissionParams {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<NewOrderFormValues, any, any>;
  shipmentId: string | null;
  step: OrderStep;
  setShipmentId: (id: string) => void;
  setStep: (step: OrderStep) => void;
  orderId?: string;
}

export const useNewOrderSubmission = ({
  form,
  shipmentId,
  step,
  setShipmentId,
  setStep,
  orderId,
}: UseNewOrderSubmissionParams) => {
  const navigate = useNavigate();
  const [fulfilledShipment, setFulfilledShipment] = useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  const { boxes, updateBox } = useBoxes({ limit: 100 });
  const { createHQOrder, updateHQOrder, createPartnerOrder, updatePartnerOrder, isCreating } = useOrders();
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

  const notifySavedContacts = () => {
    const { sender, recipient } = form.getValues();
    if (sender.save) toast.success(`Remitente "${sender.name}" guardado`);
    if (recipient.save) toast.success(`Destinatario "${recipient.name}" guardado`);
  };

  const handleCreateOrderAndQuote = async () => {
    try {
      const request = buildHQOrderRequest(form.getValues(), user!.storeId);
      const order = await createHQOrder(request);
      const shipment = await findByOrderId(order.id);
      if (!shipment) {
        console.error("No se encontró el shipment para la orden:", order.id);
        return;
      }
      notifySavedContacts();
      setShipmentId(shipment.id);
      setStep("rate");
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleUpdateOrderAndQuote = async () => {
    if (!orderId) return;
    try {
      const request = buildHQOrderRequest(form.getValues(), user!.storeId);
      await updateHQOrder(orderId, request);
      const shipment = await findByOrderId(orderId);
      if (!shipment) {
        console.error("No se encontró el shipment para la orden:", orderId);
        return;
      }
      setShipmentId(shipment.id);
      setStep("rate");
    } catch (error) {
      console.error("Error updating order:", error);
    }
  };

  const handleCreatePartnerOrder = async () => {
    try {
      const request = buildPartnerOrderRequest(form.getValues(), user!.storeId);
      await createPartnerOrder(request);
      notifySavedContacts();
      navigate("/orders");
    } catch (error) {
      console.error("Error creating partner order:", error);
    }
  };

  const handleUpdatePartnerOrder = async () => {
    if (!orderId) return;
    try {
      const request = buildPartnerOrderRequest(form.getValues(), user!.storeId);
      await updatePartnerOrder(orderId, request);
      navigate("/orders");
    } catch (error) {
      console.error("Error updating partner order:", error);
    }
  };

  const handleSelectProviderAndFulfill = async () => {
    const shippingService = form.getValues("shippingService");
    if (!shipmentId || !shippingService.selectedRate) return;

    try {
      const request = buildSelectProviderRequest(shipmentId, shippingService);
      await selectProvider(request);
      const result = await fulfillShipment(shipmentId);
      setFulfilledShipment(result);

      const pkg = form.getValues("package");
      if (pkg.ownership === "STORE" && pkg.boxId) {
        const box = boxes.find((b) => b.id === pkg.boxId);
        if (box && box.stock > 0) {
          await updateBox(pkg.boxId, { stock: box.stock - 1 })
            .then(() => {
              toast.success(`Se descontó 1 unidad de "${box.name}" del inventario`);
            })
            .catch(() => {
              toast.error("No se pudo descontar el stock de la caja");
            });
        }
      }
    } catch (error) {
      console.error("Error selecting provider:", error);
    }
  };

  return {
    navigate,
    rates,
    isLoadingRates,
    ratesError,
    refetchRates,
    isCreating,
    isSelectingProvider,
    fulfilledShipment,
    handleCreateOrderAndQuote,
    handleUpdateOrderAndQuote,
    handleCreatePartnerOrder,
    handleUpdatePartnerOrder,
    handleSelectProviderAndFulfill,
  };
};
