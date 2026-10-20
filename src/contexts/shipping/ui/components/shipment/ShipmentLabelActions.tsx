import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { Button } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { SyncShipmentWithCarrierResponse } from "@contexts/shipping/application/shipment/SyncShipmentWithCarrierResponse";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface Props {
  shipment: Pick<ShipmentPrimitives, "id">;
}

/** Lo que se le dice a la persona según lo que respondió la paquetería. */
function notifySync({
  outcome,
  reason,
  shipment,
}: SyncShipmentWithCarrierResponse) {
  switch (outcome) {
    case "fulfilled":
      return toast.success("La guía ya está lista");
    case "pending":
      return toast.info(
        "Skydropx todavía está generando la guía. Vuelve a consultar en un momento.",
      );
    case "failed":
      return toast.error(
        `Skydropx rechazó la guía${reason ? `: ${reason}` : ""}. Elige otra paquetería con "Completar venta" o "Editar".`,
      );
    case "updated":
      return toast.success(
        `Actualizado: ${shipment.carrierStatus?.label ?? "estado nuevo de la paquetería"}`,
      );
    case "cancelled":
      return toast.warning(
        "Skydropx tiene el envío cancelado: se canceló aquí también",
      );
    case "unchanged":
      return toast.info("Sin cambios: ya está al día con Skydropx");
    case "not_carrier":
      return toast.info(
        "No hay nada que consultar a la paquetería; se recargó la orden.",
      );
  }
}

/**
 * Las acciones sobre la guía desde la orden:
 *
 * - **Actualizar envío**, siempre: pone el envío al día si el webhook
 *   de la paquetería no llegó —la guía en creación, una cancelación, un estado
 *   nuevo del paquete—. Con la flota JBG solo vuelve a leer la orden.
 *
 * Una guía que no salió no se reintenta desde aquí: con la misma tarifa daría
 * lo mismo. Se cotiza otra vez con "Completar venta".
 *
 * Se muestra solo con `CAN_FULFILL_SHIPMENTS`, el mismo permiso que pedir la
 * guía.
 */
export const ShipmentLabelActions = ({ shipment }: Props) => {
  const { user } = useAuth();
  const { syncWithCarrier, isSyncingWithCarrier } = useShipmentActions();

  if (!user || !shippingPolicies.fulfill(user)) return null;

  const sync = async () => {
    try {
      notifySync(await syncWithCarrier(shipment.id));
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={sync}
      disabled={isSyncingWithCarrier}
      title="Si lo lleva Skydropx, le pregunta por la guía, una cancelación o un estado nuevo"
    >
      <RefreshCw
        className={cn("size-3.5", isSyncingWithCarrier && "animate-spin")}
      />
      {isSyncingWithCarrier ? "Actualizando..." : "Actualizar envío"}
    </Button>
  );
};
