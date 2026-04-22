import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useTariffPrice } from "@contexts/pricing/infrastructure/hooks/tariffs/useTariffPrice";
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
  storeId?: string;
}

export const useHQOrderSubmission = ({
  form,
  step,
  setStep,
  initialOrderId,
  boxes,
  updateBox,
  storeId,
}: UseHQOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] = useState<ShipmentPrimitives | null>(null);
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const { user } = useAuth();
  const { createHQOrder, updateOrder, isCreating } = useOrders({ enabled: false });
  const { findByOrderId, fulfillShipment, selectProvider, isSelectingProvider } = useShipmentActions();
  const { data: orderData } = useOrder(orderId);

  const activeStoreId = storeId ?? user?.storeId;
  const { data: store } = useQuery({
    queryKey: ["stores", activeStoreId],
    queryFn: () => storeRepository.getById(activeStoreId!),
    enabled: !!activeStoreId,
  });

  const destinationCountry = useWatch({ control: form.control, name: "recipient.address.country" });
  const boxId = useWatch({ control: form.control, name: "package.boxId" });
  const zoneId = store?.zone?.id ?? "";
  const { tariffPrice, isLoadingPrice: isLoadingTariff, priceError: tariffError, refetchPrice: refetchTariff } = useTariffPrice({
    zoneId,
    destinationCountry: destinationCountry ?? "",
    boxId: boxId ?? "",
    enabled: step === "rate" && !!zoneId && !!destinationCountry && !!boxId,
  });
  const tariff = tariffPrice;

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

  const selectedRate = useWatch({ control: form.control, name: "shippingService.selectedRate" });

  useEffect(() => {
    if (isLoadingRates || selectedRate || rates.length === 0 || !tariff) return;
    const jbg = rates.find((r) => r.id === "JBG_RATE");
    if (jbg) form.setValue("shippingService.selectedRate", { ...jbg, price: tariff });
  }, [rates, isLoadingRates, selectedRate, form, tariff]);

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
        const request = buildEditOrderRequest(form.getValues(), storeId);
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
        const request = buildHQOrderRequest(form.getValues(), storeId ?? user.storeId);
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
    if (!tariff) {
      toast.error("No se pudo obtener la tarifa de la zona. Revisa la configuración de tarifas.", { id: "order-flow" });
      return;
    }

    try {
      // First select provider and fulfill
      const request = buildSelectProviderRequest(shipmentId, shippingService, tariff);
      await selectProvider(request);
      const result = await fulfillShipment(shipmentId);

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
    tariff,
    isLoadingTariff,
    tariffError,
    refetchTariff,
    tariffZoneId: zoneId,
    tariffDestinationCountry: destinationCountry ?? "",
    tariffBoxId: boxId ?? "",
    markAsPaid,
    setMarkAsPaid,
  };
};
