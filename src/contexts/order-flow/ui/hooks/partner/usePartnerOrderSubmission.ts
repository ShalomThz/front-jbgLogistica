import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { buildPartnerOrderRequest } from "@contexts/order-flow/application/buildPartnerOrderRequest";
import { buildPartnerEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";

interface UsePartnerOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<PartnerOrderFormValues, any, any>;
  initialOrderId?: string;
  storeId?: string;
  tariff: MoneyPrimitives | null;
  onSuccess: () => void;
}

export const usePartnerOrderSubmission = ({
  form,
  initialOrderId,
  storeId,
  tariff,
  onSuccess,
}: UsePartnerOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // Abonos capturados en el paso de precios; se suben al crear la orden.
  const [pendingPayments, setPendingPayments] = useState<AddPaymentRequest[]>(
    [],
  );
  const addPendingPayment = (data: AddPaymentRequest) =>
    setPendingPayments((prev) => [...prev, data]);
  const removePendingPayment = (index: number) =>
    setPendingPayments((prev) => prev.filter((_, i) => i !== index));
  const clearPendingPayments = () => setPendingPayments([]);
  const { user } = useAuth();
  const { createPartnerOrder, updateOrder, addPayment, isCreating } = useOrders({
    enabled: false,
  });

  const goToOrders = () => navigate("/orders");

  const onError = (error: unknown) => handleOrderError(error, { form });

  const submitPartnerOrder = async () => {
    if (orderId) {
      try {
        const request = buildPartnerEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, request);
        // La orden ya existe: los abonos capturados se registran directo.
        for (const payment of pendingPayments) {
          await addPayment(orderId, payment);
        }
        setIsSubmitted(true);
        onSuccess();
      } catch (error) {
        console.error("Error updating partner order:", error);
        onError(error);
      }
    } else {
      if (!user) {
        toast.error("No se pudo identificar al usuario. Inicia sesión de nuevo.", { id: "order-flow" });
        return;
      }
      if (!tariff) {
        toast.error("No se pudo obtener la tarifa. Intenta de nuevo.", { id: "order-flow" });
        return;
      }
      if (form.getValues("emptyBoxDelivery") && pendingPayments.length === 0) {
        toast.error("Registra el anticipo para dejar la caja vacía.", {
          id: "order-flow",
        });
        return;
      }
      try {
        // Los abonos se siembran al crear la orden, en el propio request.
        const request = buildPartnerOrderRequest(
          form.getValues(),
          storeId ?? user.store.id,
          tariff,
          pendingPayments,
        );
        const order = await createPartnerOrder(request);
        setOrderId(order.id);
        setIsSubmitted(true);
        onSuccess();
      } catch (error) {
        console.error("Error creating partner order:", error);
        onError(error);
      }
    }
  };

  return {
    orderId,
    isSubmitted,
    goToOrders,
    submitPartnerOrder,
    isCreating,
    pendingPayments,
    addPendingPayment,
    removePendingPayment,
    clearPendingPayments,
  };
};
