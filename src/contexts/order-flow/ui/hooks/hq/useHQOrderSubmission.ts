import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useWatch, type UseFormReturn } from "react-hook-form";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { storeRepository } from "@contexts/iam/infrastructure/services/stores/storeRepository";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useQuotePrice } from "@contexts/pricing/infrastructure/hooks/tariffs/useQuotePrice";
import { PickupPoints } from "@contexts/pricing/application/QuotePrice";
import type { PriceType, ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
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
import { waitForOrderShipment } from "@contexts/shipping/infrastructure/websocket/waitForOrderShipment";
import { isLabelRejected } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { handleOrderError } from "@contexts/order-flow/application/errors/handleOrderError";
import type { HQOrderStep } from "./useHQOrderFlowForm";

// The shipment of a new order is created by the backend queue right after the
// order: it usually exists within milliseconds. The queue retries a failed
// creation with backoff (1s, 2s, 4s…), hence the 15s cap.
const SHIPMENT_WAIT_TIMEOUT_MS = 15_000;
const SHIPMENT_WAIT_INTERVAL_MS = 1_000;

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
  /** Zona elegida por el vendedor; undefined = la zona de la tienda. */
  zoneOverrideId?: string;
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
  zoneOverrideId,
}: UseHQOrderSubmissionOptions) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orderId, setOrderId] = useState<string | undefined>(initialOrderId);
  const [shipmentId, setShipmentId] = useState<string | null>(null);
  const [fulfilledShipment, setFulfilledShipment] =
    useState<ShipmentPrimitives | null>(null);
  const { user } = useAuth();
  // Los abonos no van en la venta: se registran en la pantalla de éxito, ya
  // con la venta guardada y la respuesta de la paquetería, uno por uno.
  const { createHQOrder, updateOrder, isCreating } = useOrders({
    enabled: false,
  });
  // Se pidió la guía en esta sesión: un reintento primero mira si salió.
  const labelRequestedRef = useRef(false);
  // El id de la orden que se va a crear, fijo mientras esta pantalla viva: si la
  // respuesta del alta se pierde, o hay doble clic en "Cotizar", el back
  // devuelve la misma orden en vez de crear otra.
  const draftOrderIdRef = useRef(crypto.randomUUID());
  const {
    findByOrderId,
    fulfillShipment,
    selectProvider,
    isSelectingProvider,
    isFulfilling,
  } = useShipmentActions();
  const [isProcessingShipment, setIsProcessingShipment] = useState(false);
  const [shipmentError, setShipmentError] = useState<string | null>(null);
  // El error es un rechazo de la paquetería (ver `isLabelRejected`).
  const [labelRejected, setLabelRejected] = useState(false);
  const [shipmentPhase, setShipmentPhase] =
    useState<ShipmentPhase>("selecting");
  const { data: orderData } = useOrder(orderId);

  const activeStoreId = storeId ?? user?.store.id;
  const { data: store } = useQuery({
    queryKey: ["stores", activeStoreId],
    queryFn: () => storeRepository.getById(activeStoreId!),
    enabled: !!activeStoreId,
  });

  const boxId = useWatch({ control: form.control, name: "package.boxId" });
  const zoneId = zoneOverrideId ?? store?.zone?.id ?? "";

  // Una orden HQ se le vende al público. La caja llega al mostrador de la
  // tienda JBG salvo que el operador haya elegido otra zona, que es el caso de
  // la recolección a domicilio.
  const [serviceLevel, setServiceLevel] = useState<ServiceLevel>("STANDARD");
  // Elegible: por el mostrador de una tienda JBG también pasa una tienda socia,
  // y en ese caso se le cobra precio de socio. Arranca en público, que es el
  // caso normal de una orden HQ.
  const [priceType, setPriceType] = useState<PriceType>("PUBLIC");

  // País con el que se cotiza. Arranca en el del destinatario y sigue sus
  // cambios mientras el usuario no elija otro.
  const recipientCountry = useWatch<
    HQOrderFormValues,
    "recipient.address.country"
  >({ control: form.control, name: "recipient.address.country" });

  const [destinationCountry, setDestinationCountry] = useState(recipientCountry);
  const [lastRecipientCountry, setLastRecipientCountry] =
    useState(recipientCountry);
  if (recipientCountry !== lastRecipientCountry) {
    setLastRecipientCountry(recipientCountry);
    setDestinationCountry(recipientCountry);
  }

  // Al reabrir una orden ya cotizada, los selectores arrancan en lo que se
  // usó, no en los defaults: si no, la venta se recotiza a ciegas contra otra
  // combinación y el vendedor tiene que reconstruirla de memoria.
  //
  // Se hace en render y no en un effect para no pintar un paso con los valores
  // equivocados. `shippingMode` no está acá: ya lo rehidrata
  // mapOrderToFormValues desde el envío.
  // Se sincroniza por orden y no por tarifa: dos órdenes distintas pueden
  // haberse cotizado con el mismo renglón, y la segunda no se rehidrataría.
  const savedPricing = orderData?.pricing ?? null;
  const [rehydratedOrderId, setRehydratedOrderId] = useState<string | null>(
    null,
  );
  if (orderData && savedPricing && orderData.id !== rehydratedOrderId) {
    setRehydratedOrderId(orderData.id);
    setServiceLevel(savedPricing.serviceLevel);
    setPriceType(savedPricing.priceType);
    setDestinationCountry(savedPricing.destinationCountry);
  }

  const shippingMode = useWatch<HQOrderFormValues, "shippingService.shippingMode">(
    { control: form.control, name: "shippingService.shippingMode" },
  );

  const pickup = zoneOverrideId
    ? PickupPoints.atCustomerAddress(zoneOverrideId)
    : activeStoreId
      ? PickupPoints.atCounter(activeStoreId)
      : undefined;

  // El bulto, para que el servidor pueda cotizar los servicios que cobran por
  // peso. Solo HQ los ve, y no por una regla escrita en ningún lado: es el
  // único flujo donde hay dónde cargar el peso.
  //
  // Se suscribe a los seis campos y no al objeto `package` entero: éste incluye
  // las fotos, y mirarlo haría re-renderizar todo el flujo cada vez que se sube
  // una imagen.
  const [
    rawWeight,
    weightUnit,
    rawLength,
    rawWidth,
    rawHeight,
    dimensionUnit,
  ] = useWatch<HQOrderFormValues>({
    control: form.control,
    name: [
      "package.weight",
      "package.weightUnit",
      "package.length",
      "package.width",
      "package.height",
      "package.dimensionUnit",
    ],
  }) as [
    string | undefined,
    "kg" | "lb" | undefined,
    string | undefined,
    string | undefined,
    string | undefined,
    "cm" | "in" | undefined,
  ];

  const parsedWeight = parseFloat(rawWeight ?? "");
  const parsedLength = parseFloat(rawLength ?? "");
  const parsedWidth = parseFloat(rawWidth ?? "");
  const parsedHeight = parseFloat(rawHeight ?? "");

  // Se mandan solo si están completos: media medida daría un peso volumétrico
  // equivocado, y el resultado seguiría pareciendo un precio válido.
  const quoteWeight =
    parsedWeight > 0 && weightUnit
      ? { value: parsedWeight, unit: weightUnit }
      : undefined;

  const quoteDimensions =
    parsedLength > 0 && parsedWidth > 0 && parsedHeight > 0 && dimensionUnit
      ? {
          length: parsedLength,
          width: parsedWidth,
          height: parsedHeight,
          unit: dimensionUnit,
        }
      : undefined;

  const {
    quote,
    tariffPrice,
    isLoadingPrice: isLoadingTariff,
    priceError: tariffError,
  } = useQuotePrice({
    pickup,
    destinationCountry,
    boxId: boxId ?? "",
    serviceLevel,
    // El modo sale del envío que se está armando, no de un selector aparte:
    // cotizar aéreo algo que va por tierra daría una sugerencia que no
    // corresponde a nada. Es el mismo criterio que aplica el servidor al
    // recotizar en SelectShipmentProviderUseCase.
    shippingMode,
    priceType,
    weight: quoteWeight,
    dimensions: quoteDimensions,
    // Se cotiza en el paso de cobro: ahí viven los selectores y ahí se ve el
    // efecto de cambiarlos sobre lo que se va a cobrar.
    enabled: step === "cobro" && !!pickup && !!boxId,
  });
  // El sistema sugiere, el usuario decide: la tarifa se puede reescribir a mano
  // (o escribir de cero cuando no hay ninguna para la combinación). Se resetea
  // cuando cambian los insumos, porque un precio tecleado para otra zona o
  // servicio ya no aplica. Se ajusta en render y no en un efecto para evitar
  // el pase de render extra.
  const tariffLookupKey = `${zoneId}|${serviceLevel}|${priceType}|${boxId ?? ""}`;
  const [tariffOverride, setTariffOverride] = useState<MoneyPrimitives | null>(null);
  const [lastTariffLookupKey, setLastTariffLookupKey] = useState(tariffLookupKey);
  if (tariffLookupKey !== lastTariffLookupKey) {
    setLastTariffLookupKey(tariffLookupKey);
    setTariffOverride(null);
  }

  const tariff = tariffOverride ?? tariffPrice;

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
        const order = await createHQOrder({
          ...request,
          id: draftOrderIdRef.current,
        });
        setOrderId(order.id);
        // El envío lo crea el back en la cola, justo después de la orden.
        const shipment = await waitForOrderShipment(order.id, {
          timeoutMs: SHIPMENT_WAIT_TIMEOUT_MS,
          pollIntervalMs: SHIPMENT_WAIT_INTERVAL_MS,
          read: () => findByOrderId(order.id),
        });
        if (!shipment) {
          toast.error(
            "La orden se creó, pero su envío no está listo todavía. Ábrela desde la lista en un momento para continuar.",
            { id: "order-flow" },
          );
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

    try {
      // Este intento ya pidió la guía y se cortó la respuesta: si el back la
      // emitió o la paquetería la está creando, no se repite nada. Pedirla de
      // nuevo cancelaría una guía válida, y elegir paquetería con una creación
      // en curso lo rechaza el back. Solo dentro de esta sesión: quien vuelve
      // a la orden más tarde elige tarifa de nuevo.
      const latest =
        labelRequestedRef.current && orderId
          ? await findByOrderId(orderId)
          : null;

      if (latest && (latest.label || latest.providerShipmentId)) {
        // Se eligió otra tarifa después del corte: la guía pedida es de la
        // anterior, y darla por buena vendería con una paquetería que la
        // persona ya cambió.
        if (latest.rate?.id !== shippingService.selectedRate.id) {
          throw new Error(
            `La guía con ${latest.provider?.providerName ?? "la paquetería anterior"} ya se pidió. ` +
              "Espera su respuesta en la orden: si la rechaza, podrás elegir otra.",
          );
        }
        setFulfilledShipment(latest);
      } else {
        // La venta se registra completa antes de pedir la guía, para que no
        // dependa de esperar a la paquetería: tarifa y datos de la orden
        // (firma, notas). Los abonos, después, en la pantalla de éxito.
        setShipmentPhase("selecting");
        await selectProvider(
          buildSelectProviderRequest(
            shipmentId,
            shippingService,
            pickup
              ? { pickup, destinationCountry, serviceLevel, priceType }
              : undefined,
          ),
        );
        if (orderId) {
          await updateOrder(
            orderId,
            buildEditOrderRequest(form.getValues(), storeId),
          );
        }

        // Se pide la guía y no se espera: la de la flota JBG sale en la misma
        // respuesta; la de una paquetería la completa su webhook, y la orden
        // queda "esperando guía" hasta entonces. Si la paquetería la rechaza en
        // el momento, esto lanza y se ofrece elegir otra.
        setShipmentPhase("fulfilling");
        labelRequestedRef.current = true;
        setFulfilledShipment(await fulfillShipment(shipmentId));
      }

      setStep("success");
      queryClient.invalidateQueries({ queryKey: ["orders"] });

      // Best-effort inventory decrement: never blocks or fails the flow.
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
      // Si ya se pidió la guía, se mira si la paquetería la rechazó: con la
      // misma tarifa daría lo mismo, y el diálogo solo ofrece cambiarla.
      if (labelRequestedRef.current && orderId) {
        const latest = await findByOrderId(orderId).catch(() => null);
        setLabelRejected(!!latest && isLabelRejected(latest));
      }
      // Surfaced in the fulfillment dialog (retry / change carrier), not a toast.
      setShipmentError(parseApiError(error));
    } finally {
      setIsProcessingShipment(false);
    }
  };

  const clearShipmentError = () => {
    setShipmentError(null);
    setLabelRejected(false);
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
    isFulfilling,
    isProcessingShipment,
    shipmentPhase,
    shipmentError,
    labelRejected,
    clearShipmentError,
    fulfilledShipment,
    totalBilled: orderData?.financials.totalBilled ?? null,
    /** Esta orden viene de una orden partner: HQ la está completando. */
    isPartnerOrder: orderData?.type === "PARTNER",
    /** Cotización de la etapa del socio. Es `null` cuando no había tarifa para
     * la combinación y el socio puso el precio a mano — hoy, el caso normal. */
    partnerPricing:
      orderData?.type === "PARTNER" ? (orderData.pricing ?? null) : null,
    /** Lo que el socio efectivamente cobró, haya habido tarifa o no. */
    partnerTariff: orderData?.financials.tariff ?? null,
    tariff,
    isLoadingTariff,
    tariffError,
    tariffZoneId: quote?.zoneId ?? zoneId,
    tariffBoxId: boxId ?? "",
    tariffServiceLevel: serviceLevel,
    tariffShippingMode: shippingMode,
    tariffDestinationCountry: destinationCountry,
    setDestinationCountry,
    recipientCountry,
    setServiceLevel,
    tariffPriceType: priceType,
    setPriceType,
    /** Lo que sugirió la tabla, para contrastarlo con lo que se va a cobrar. */
    suggestedTariff: tariffPrice,
    /** Cómo se llegó al monto cuando el servicio cobra por peso. `null` en las
     * tarifas planas, que son la mayoría. */
    weightBreakdown: quote?.weightBreakdown ?? null,
    onTariffChange: setTariffOverride,
  };
};
