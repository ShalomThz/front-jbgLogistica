import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
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
  const [markAsPaid, setMarkAsPaid] = useState(false);
  const { user } = useAuth();
  const { createPartnerOrder, updateOrder, isCreating } = useOrders({ enabled: false });

  const goToOrders = () => navigate("/orders");

  const onError = (error: unknown) => handleOrderError(error, { form });

  const submitPartnerOrder = async () => {
    if (orderId) {
      try {
        const request = buildPartnerEditOrderRequest(form.getValues(), storeId);
        await updateOrder(orderId, request);
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
      try {
        const request = buildPartnerOrderRequest(form.getValues(), storeId ?? user.storeId, tariff);
        const order = await createPartnerOrder(request);
        setOrderId(order.id);
        if (markAsPaid) {
          await updateOrder(order.id, { markAsPaid: true });
        }
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
    markAsPaid,
    setMarkAsPaid,
  };
};
