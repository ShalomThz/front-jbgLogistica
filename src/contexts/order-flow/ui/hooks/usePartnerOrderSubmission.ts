import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { buildPartnerOrderRequest } from "@contexts/order-flow/application/buildPartnerOrderRequest";
import { buildEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { parseApiError } from "@contexts/shared/infrastructure/http/parseApiError";

interface UsePartnerOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<NewOrderFormValues, any, any>;
  initialOrderId?: string;
  storeId?: string;
}

export const usePartnerOrderSubmission = ({
  form,
  initialOrderId,
  storeId,
}: UsePartnerOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const { user } = useAuth();
  const { createPartnerOrder, updateOrder, isCreating } = useOrders({ enabled: false });

  const goToOrders = () => navigate("/orders");

  const submitPartnerOrder = async () => {
    if (orderId) {
      try {
        const request = buildEditOrderRequest(form.getValues());
        await updateOrder(orderId, request);
        goToOrders();
      } catch (error) {
        console.error("Error updating partner order:", error);
        toast.error(parseApiError(error), { id: "order-flow" });
      }
    } else {
      if (!user) {
        toast.error("No se pudo identificar al usuario. Inicia sesión de nuevo.", { id: "order-flow" });
        return;
      }
      try {
        const request = buildPartnerOrderRequest(form.getValues(), storeId ?? user.storeId);
        const order = await createPartnerOrder(request);
        setOrderId(order.id);
        goToOrders();
      } catch (error) {
        console.error("Error creating partner order:", error);
        toast.error(parseApiError(error), { id: "order-flow" });
      }
    }
  };

  return {
    orderId,
    goToOrders,
    submitPartnerOrder,
    isCreating,
  };
};
