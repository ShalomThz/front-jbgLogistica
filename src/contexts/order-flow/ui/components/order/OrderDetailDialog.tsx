import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@contexts/shared/shadcn";
import { ChevronDown, Download, Package, Pencil } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { OrderShipmentSection } from "./OrderShipmentSection";

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
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false);
  const isCompleted = order?.status === "COMPLETED";

  if (!order) return null;

  const { shipment, origin, destination, financials, references } = order;
  const isEditable = order.status !== "COMPLETED" && order.status !== "CANCELLED";

  const downloadLabel = async () => {
    if (!shipment?.label) return;
    if (!shipment.label.documentUrl.startsWith("/")) {
      window.open(shipment.label.documentUrl, "_blank");
      return;
    }
    setIsDownloadingLabel(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingLabel(false);
    }
  };

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

        {isCompleted && shipment && (
          <div className="space-y-4">
            <OrderShipmentSection shipment={shipment} />
          </div>
        )}

        <DialogFooter>
          {shipment?.label && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadLabel}
              disabled={isDownloadingLabel}
            >
              <Download className="mr-1.5 size-4" />
              {isDownloadingLabel ? "Descargando..." : "Descargar etiqueta"}
            </Button>
          )}
          {order.type === "PARTNER" ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button disabled={!isEditable}>
                  <Pencil className="size-4" />
                  Editar
                  <ChevronDown className="size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => {
                    onClose();
                    navigate(`/orders/${order.id}/edit`);
                  }}
                >
                  <Pencil className="size-4" />
                  Editar orden
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    onClose();
                    navigate(`/orders/${order.id}/edit?mode=complete`);
                  }}
                >
                  <Package className="size-4" />
                  Completar venta
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
