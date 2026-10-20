import { useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { Button } from "@contexts/shared/shadcn";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  isBeforeSale,
  labelCreationOf,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { mapOrderToHQFormValues, mapOrderToPartnerFormValues } from "../../application/mapOrderToFormValues";
import { NewHQOrderPage } from "./NewHQOrderPage";
import { NewPartnerOrderPage } from "./NewPartnerOrderPage";

export const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const { data: order, isLoading, error } = useOrder(id);
  // Se decide una vez, con la orden como estaba al entrar: el flujo mismo pide
  // la guía, y la orden en caché pasa a "en creación" justo antes de mostrar el
  // éxito. Leerla en cada render cambiaría el flujo por el aviso de abajo.
  // Con el id: si la ruta cambia a otra orden sin desmontar, se decide de nuevo.
  const navigate = useNavigate();
  const [entry, setEntry] = useState<{
    orderId: string;
    labelPending: boolean;
    saleProcessed: boolean;
  } | null>(null);
  if (order && entry?.orderId !== order.id) {
    setEntry({
      orderId: order.id,
      labelPending:
        !!order.shipment && labelCreationOf(order.shipment) === "pending",
      saleProcessed: !!order.shipment && !isBeforeSale(order.shipment.status),
    });
  }
  const onEntry = entry?.orderId === order?.id ? entry : null;
  const labelPendingOnEntry = !!onEntry?.labelPending;

  if (isLoading) {
    return <PageLoader text="Cargando orden..." />;
  }

  if (error || !order) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          {error?.message ?? "No se encontró la orden"}
        </p>
      </div>
    );
  }

  const blocked = (message: string) => (
    <div className="flex flex-col items-center justify-center gap-4 py-20">
      <p className="max-w-md text-center text-sm text-muted-foreground">
        {message}
      </p>
      <Button variant="outline" onClick={() => navigate("/orders")}>
        Volver a órdenes
      </Button>
    </div>
  );

  // Completar la venta pide la guía otra vez: con una en creación sería un
  // segundo envío en Skydropx. Se espera su respuesta (webhook o "Actualizar
  // envío" en la orden). Tampoco se edita la del socio: la guía saldría con
  // los datos de antes.
  if (labelPendingOnEntry) {
    return blocked(
      'La paquetería está generando la guía de esta orden. Espera su respuesta o usa "Actualizar envío" desde la orden.',
    );
  }

  if (order.type === "PARTNER" && mode !== "complete") {
    // Con la paquetería elegida, el formulario del agente ya no cambia los
    // datos de la guía (el back lo rechaza).
    if (onEntry?.saleProcessed) {
      return blocked(
        'HQ ya procesó la venta de esta orden: los cambios se hacen desde "Completar venta".',
      );
    }
    return <NewPartnerOrderPage initialValues={mapOrderToPartnerFormValues(order)} orderId={order.id} storeName={order.store.name} storeId={order.store.id} initialPricing={order.pricing} />;
  }

  const isFromPartner = order.type === "PARTNER";
  const isPendingHQ = isFromPartner && order.status === "PENDING_HQ_PROCESS";

  const partnerPrice = isPendingHQ ? order.financials.totalPrice : undefined;
  const partnerCostBreakdown = isPendingHQ ? order.financials.costBreakdown : undefined;

  return (
    <NewHQOrderPage
      initialValues={mapOrderToHQFormValues(order)}
      orderId={order.id}
      partnerPrice={partnerPrice}
      partnerCostBreakdown={partnerCostBreakdown}
      storeName={isFromPartner ? order.store.name : undefined}
      partnerOrderNumber={isFromPartner ? order.references.partnerOrderNumber ?? undefined : undefined}
      storeId={order.store.id}
    />
  );
};
