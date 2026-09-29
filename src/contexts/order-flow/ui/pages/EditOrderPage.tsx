import { useParams, useSearchParams } from "react-router-dom";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  AWAITING_ARRIVAL_REASON,
  isAwaitingArrival,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { mapOrderToHQFormValues, mapOrderToPartnerFormValues } from "../../application/mapOrderToFormValues";
import { NewHQOrderPage } from "./NewHQOrderPage";
import { NewPartnerOrderPage } from "./NewPartnerOrderPage";

export const EditOrderPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode");
  const { data: order, isLoading, error } = useOrder(id);

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

  if (order.type === "PARTNER" && mode !== "complete") {
    return <NewPartnerOrderPage initialValues={mapOrderToPartnerFormValues(order)} orderId={order.id} storeName={order.store.name} storeId={order.store.id} initialPricing={order.pricing} />;
  }

  // Entrar pegando la URL también tiene que frenarse: sin el paquete en bodega
  // no hay qué pesar, y el back rechazaría el procesamiento al final del flujo.
  if (isAwaitingArrival(order.shipment?.status)) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="max-w-md text-center text-sm text-muted-foreground">
          {AWAITING_ARRIVAL_REASON}
        </p>
      </div>
    );
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
