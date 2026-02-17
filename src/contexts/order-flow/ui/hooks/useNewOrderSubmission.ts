import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
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
}

export const useNewOrderSubmission = ({
  form,
  shipmentId,
  step,
  setShipmentId,
  setStep,
}: UseNewOrderSubmissionParams) => {
  const navigate = useNavigate();
  const [fulfilledShipment, setFulfilledShipment] = useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  const { createHQOrder, createPartnerOrder, isCreating } = useOrders();
  const { findByOrderId, fulfillShipment, selectProvider, isSelectingProvider } = useShipmentActions();

  const consignmentNoteClassCode = useWatch({ control: form.control, name: "package.consignmentNoteClassCode" });
  const consignmentNotePackagingCode = useWatch({ control: form.control, name: "package.consignmentNotePackagingCode" });

  const { rates, isLoading: isLoadingRates, error: ratesError } = useShipmentRates({
    shipmentId: shipmentId ?? "",
    enabled: !!shipmentId && step === "rate",
    additionalData: {
      consignment_note_class_code: consignmentNoteClassCode,
      consignment_note_packaging_code: consignmentNotePackagingCode,
    },
  });

  const handleCreateOrderAndQuote = async () => {
    try {
      const request = buildHQOrderRequest(form.getValues(), user!.storeId);
      const order = await createHQOrder(request);
      const shipment = await findByOrderId(order.id);
      if (!shipment) {
        console.error("No se encontró el shipment para la orden:", order.id);
        return;
      }
      setShipmentId(shipment.id);
      setStep("rate");
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const handleCreatePartnerOrder = async () => {
    try {
      const request = buildPartnerOrderRequest(form.getValues(), user!.storeId);
      await createPartnerOrder(request);
      navigate("/orders");
    } catch (error) {
      console.error("Error creating partner order:", error);
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
    } catch (error) {
      console.error("Error selecting provider:", error);
    }
  };

  return {
    navigate,
    rates,
    isLoadingRates,
    ratesError,
    isCreating,
    isSelectingProvider,
    fulfilledShipment,
    handleCreateOrderAndQuote,
    handleCreatePartnerOrder,
    handleSelectProviderAndFulfill,
  };
};
