import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type {
  ServiceLevel,
  ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { buildPartnerOrderRequest } from "@contexts/order-flow/application/buildPartnerOrderRequest";
import { buildPartnerEditOrderRequest } from "@contexts/order-flow/application/buildEditOrderRequest";
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";

interface UsePartnerOrderSubmissionOptions {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<PartnerOrderFormValues, any, any>;
  initialOrderId?: string;
  storeId?: string;
  tariff: MoneyPrimitives | null;
  /** Viaja al backend para que calcule la sugerencia contra la que se
   * contrasta el precio cobrado. */
  serviceLevel: ServiceLevel;
  shippingMode: ShippingMode;
  destinationCountry: string;
  onSuccess: () => void;
}

export const usePartnerOrderSubmission = ({
  form,
  initialOrderId,
  storeId,
  tariff,
  serviceLevel,
  shippingMode,
  destinationCountry,
  onSuccess,
}: UsePartnerOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [isSubmitted, setIsSubmitted] = useState(false);
  // El id de la orden que se va a crear, fijo mientras esta pantalla viva: si la
  // respuesta del alta se pierde y se reintenta, el back devuelve la misma
  // orden —con sus abonos— en vez de crear otra.
  const draftOrderIdRef = useRef(crypto.randomUUID());
  // Abonos capturados en el paso de precios; se suben al crear la orden.
  const [pendingPayments, setPendingPayments] = useState<AddPaymentRequest[]>(
    [],
  );
  const addPendingPayment = (data: AddPaymentRequest) =>
    setPendingPayments((prev) => [...prev, data]);
  const removePendingPayment = (index: number) =>
    setPendingPayments((prev) => prev.filter((_, i) => i !== index));
  const clearPendingPayments = () => setPendingPayments([]);

  // El libro del socio con su cliente, aparte del de JBG. Se captura en el paso
  // de cobro y viaja dentro de `partnerSale` al crear la orden.
  const [partnerSalePayments, setPartnerSalePayments] = useState<
    AddPaymentRequest[]
  >([]);
  // `Pending` en el nombre, igual que los de JBG: éstos viven en el paso hasta
  // que se envía. Los que persisten contra la API son `addPayment` y
  // `addPartnerSalePayment` de `useOrders`, y confundirlos es lo que dejaba el
  // libro del socio sin subir al editar.
  const addPendingPartnerSalePayment = (data: AddPaymentRequest) =>
    setPartnerSalePayments((prev) => [...prev, data]);
  const removePendingPartnerSalePayment = (index: number) =>
    setPartnerSalePayments((prev) => prev.filter((_, i) => i !== index));
  const clearPendingPartnerSalePayments = () => setPartnerSalePayments([]);
  const { user } = useAuth();
  // La orden como está guardada, al editar: su modo y los abonos que ya tiene.
  const { data: existingOrder } = useOrder(initialOrderId);
  const {
    createPartnerOrder,
    updateOrder,
    addPayment,
    addPartnerSalePayment,
    isCreating,
  } = useOrders({
    enabled: false,
  });

  const goToOrders = () => navigate("/orders");

  const onError = (error: unknown) => handleOrderError(error, { form });

  const submitPartnerOrder = async () => {
    if (orderId) {
      // Pasar a caja vacía al editar pide el anticipo, igual que en el alta (el
      // back también lo exige). Cuentan los abonos ya guardados y los
      // capturados en esta edición.
      const turnsOnEmptyBox =
        form.getValues("emptyBoxDelivery") && !existingOrder?.emptyBoxDelivery;
      if (turnsOnEmptyBox) {
        const hasPartnerSale =
          (parseFloat(form.getValues("partnerSale.amount")) || 0) > 0;
        const recorded =
          existingOrder?.financials.partnerSale?.payments.length ?? 0;
        if (!hasPartnerSale || recorded + partnerSalePayments.length === 0) {
          toast.error(
            "Registra cuánto le cobras a tu cliente y el anticipo que te pagó para dejar la caja vacía.",
            { id: "order-flow" },
          );
          return;
        }
      }
      try {
        const request = buildPartnerEditOrderRequest(form.getValues(), storeId);
        // Los abonos se suben después de guardar la orden, y el back pide el
        // anticipo ya registrado para pasar a caja vacía: el cambio de modo va
        // al final, en su propio request.
        await updateOrder(
          orderId,
          turnsOnEmptyBox
            ? { ...request, emptyBoxDelivery: undefined, homePickup: undefined }
            : request,
        );
        // La orden ya existe: los abonos capturados se registran directo, cada
        // libro por su ruta. El del socio con su cliente **no** viaja en el
        // request —`buildPartnerEditOrderRequest` lo omite a propósito para no
        // pisar el libro con lo que tenga el formulario abierto—, así que sin
        // esta subida se quedaba en el estado del paso y se perdía al salir.
        //
        // Cada abono sale de pendientes en cuanto el back lo registra: si falla
        // uno a la mitad, el reintento sube solo los que faltan, y la pantalla
        // no lo cuenta dos veces —ya lo lee de la orden—.
        for (const payment of pendingPayments) {
          await addPayment(orderId, payment);
          setPendingPayments((prev) => prev.filter((p) => p !== payment));
        }
        for (const payment of partnerSalePayments) {
          await addPartnerSalePayment(orderId, payment);
          setPartnerSalePayments((prev) => prev.filter((p) => p !== payment));
        }
        if (turnsOnEmptyBox) {
          await updateOrder(orderId, {
            emptyBoxDelivery: request.emptyBoxDelivery,
            homePickup: request.homePickup,
          });
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
      // El anticipo lo paga el cliente del socio: cubre el viaje del chofer que
      // le lleva la caja vacía. Se exige contra el libro del socio con su
      // cliente, no contra lo que él le abona a JBG.
      //
      // Se mira también el monto, y no solo los abonos: el libro cuelga de
      // `partnerSale`, así que sin total los abonos no viajan en el request y el
      // backend rechazaría con un error que no explica nada. Pasa si se carga un
      // monto, se abona y después se borra el monto.
      const hasPartnerSale =
        (parseFloat(form.getValues("partnerSale.amount")) || 0) > 0;
      if (
        form.getValues("emptyBoxDelivery") &&
        (!hasPartnerSale || partnerSalePayments.length === 0)
      ) {
        toast.error(
          "Registra cuánto le cobras a tu cliente y el anticipo que te pagó para dejar la caja vacía.",
          { id: "order-flow" },
        );
        return;
      }
      try {
        // Los abonos se siembran al crear la orden, en el propio request.
        const request = buildPartnerOrderRequest(
          form.getValues(),
          storeId ?? user.store.id,
          tariff,
          pendingPayments,
          serviceLevel,
          shippingMode,
          destinationCountry,
          partnerSalePayments,
        );
        const order = await createPartnerOrder({
          ...request,
          id: draftOrderIdRef.current,
        });
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
    partnerSalePayments,
    addPendingPartnerSalePayment,
    removePendingPartnerSalePayment,
    clearPendingPartnerSalePayments,
  };
};
