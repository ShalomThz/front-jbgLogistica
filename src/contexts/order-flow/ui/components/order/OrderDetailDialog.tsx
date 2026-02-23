import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Pencil } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Skeleton,
} from "@contexts/shared/shadcn";
import { useShipmentByOrderId } from "@contexts/shipping/infrastructure/hooks/shipments/useShipment";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { OrderShipmentSection } from "./OrderShipmentSection";
import { OrderLabelSection } from "./OrderLabelSection";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface OrderDetailDialogProps {
  order: OrderListView | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailDialog = ({
  order,
  open,
  onClose,
}: OrderDetailDialogProps) => {
  const navigate = useNavigate();
  const [showLabel, setShowLabel] = useState(false);
  const isCompleted = order?.status === "COMPLETED";
  const {
    data: shipment,
    isLoading: isShipmentLoading,
    isError,
  } = useShipmentByOrderId(isCompleted ? order?.id : undefined);

  if (!order) return null;

  const { origin, destination, financials, references } = order;
  const isEditable = order.status !== "COMPLETED" && order.status !== "CANCELLED";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-7xl max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Orden {order.id}</span>
            <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>Tienda {order.store.name}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Origen</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Nombre" value={origin.name} />
                <DetailRow label="Empresa" value={origin.company || "—"} />
                <DetailRow label="Teléfono" value={origin.phone} />
                <DetailRow label="Email" value={origin.email || "—"} />
                <DetailRow label="Dirección" value={origin.address.address1} />
                {origin.address.address2 && (
                  <DetailRow
                    label="Dirección 2"
                    value={origin.address.address2}
                  />
                )}
                <DetailRow
                  label="Ciudad"
                  value={`${origin.address.city}, ${origin.address.province}`}
                />
                <DetailRow label="C.P." value={origin.address.zip} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Destino</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Nombre" value={destination.name} />
                <DetailRow label="Empresa" value={destination.company || "—"} />
                <DetailRow label="Teléfono" value={destination.phone} />
                <DetailRow label="Email" value={destination.email || "—"} />
                <DetailRow
                  label="Dirección"
                  value={destination.address.address1}
                />
                {destination.address.address2 && (
                  <DetailRow
                    label="Dirección 2"
                    value={destination.address.address2}
                  />
                )}
                <DetailRow
                  label="Ciudad"
                  value={`${destination.address.city}, ${destination.address.province}`}
                />
                <DetailRow label="C.P." value={destination.address.zip} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Paquete</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Caja" value={order.package.boxId} />
                <DetailRow
                  label="Dimensiones"
                  value={`${order.package.dimensions.length}×${order.package.dimensions.width}×${order.package.dimensions.height} ${order.package.dimensions.unit}`}
                />
                <DetailRow
                  label="Peso"
                  value={`${order.package.weight.value} ${order.package.weight.unit}`}
                />
                <DetailRow label="Propiedad" value={order.package.ownership === "STORE" ? "Caja de la tienda" : "Caja traída por el cliente"} />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Financiero</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow
                  label="Total"
                  value={
                    financials.totalPrice
                      ? `$${financials.totalPrice.amount.toFixed(2)} ${financials.totalPrice.currency}`
                      : "—"
                  }
                />
                <DetailRow
                  label="Pagado"
                  value={financials.isPaid ? "Sí" : "No"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Referencias</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow
                  label="N° Factura JBG"
                  value={references.orderNumber ?? "—"}
                />
                <DetailRow
                  label="N° Factura Agente"
                  value={references.partnerOrderNumber ?? "—"}
                />
              </div>
            </div>
          </div>
        </div>

        {isCompleted && isShipmentLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {isCompleted && isError && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">
              No se pudo cargar la información de envío.
            </p>
          </div>
        )}

        {isCompleted && !isShipmentLoading && !isError && shipment && (
          <div className="space-y-4">
            <OrderShipmentSection shipment={shipment} />
            {shipment.label && !showLabel && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowLabel(true)}
              >
                <FileText className="size-4" />
                Ver etiqueta de envío
              </Button>
            )}
            {shipment.label && showLabel && (
              <OrderLabelSection label={shipment.label} />
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            disabled={!isEditable}
            onClick={() => {
              onClose();
              navigate(`/orders/${order.id}/edit`);
            }}
          >
            <Pencil className="size-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
