import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  ORDER_STATUS_LABELS,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import {
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
  DropdownMenuTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { Ban, ChevronDown, Download, Package, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { OrderShipmentSection } from "./OrderShipmentSection";

const STATUS_DOT_STYLES: Record<OrderStatus, string> = {
  DRAFT: "bg-muted-foreground",
  PENDING_HQ_PROCESS: "bg-yellow-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

function formatMoney(money: { amount: number; currency: string }) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

interface OrderDetailDialogProps {
  order: OrderListView | null;
  open: boolean;
  onClose: () => void;
  onDelete?: (order: OrderListView) => void;
  isDeleting?: boolean;
  onCancelShipment?: (shipmentId: string) => void;
  isCancelling?: boolean;
}

export const OrderDetailDialog = ({
  order,
  open,
  onClose,
  onDelete,
  isDeleting,
  onCancelShipment,
  isCancelling,
}: OrderDetailDialogProps) => {
  const navigate = useNavigate();
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const { boxes } = useBoxes({ enabled: open });

  if (!order) return null;

  const { shipment, origin, destination, financials, references } = order;
  const isEditable =
    order.status !== "COMPLETED" && order.status !== "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  const downloadInvoice = async () => {
    if (!order.invoiceId) return;
    const invoiceId = order.invoiceId;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

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
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto pt-8">
        <DialogHeader>
          <DialogTitle>
            Orden{" "}
            {[references.orderNumber, references.partnerOrderNumber]
              .filter(Boolean)
              .map((n) => `#${n}`)
              .join(" · ") || order.id}
          </DialogTitle>
          <DialogDescription className="text-sm flex items-center justify-between">
            <span>Tienda <span className="font-semibold text-foreground">{order.store.name}</span></span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground cursor-default">
                    <span className={cn("relative flex size-2.5 rounded-full", STATUS_DOT_STYLES[order.status])}>
                      <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-75", STATUS_DOT_STYLES[order.status])} />
                    </span>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </TooltipTrigger>
                {order.status === "PENDING_HQ_PROCESS" && (
                  <TooltipContent>
                    La tienda completó su orden, JBG Logistics necesita completar la venta
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="resumen">
          <TabsList variant="line" className="w-full justify-start">
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="contactos">Contactos</TabsTrigger>
            <TabsTrigger value="paquete">Paquete</TabsTrigger>
            {isCompleted && shipment && (
              <TabsTrigger value="envio">Envío</TabsTrigger>
            )}
          </TabsList>

          {/* Resumen */}
          <TabsContent value="resumen" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ruta */}
              <div className="rounded-md border p-3 space-y-1">
                <h4 className="text-sm font-semibold mb-2">Ruta</h4>
                <DetailRow label="Origen" value={`${origin.name} — ${origin.address.city}, ${origin.address.province}`} />
                <DetailRow label="Destino" value={`${destination.name} — ${destination.address.city}, ${destination.address.province}`} />
              </div>

              {/* Paquete */}
              <div className="rounded-md border p-3 space-y-1">
                <h4 className="text-sm font-semibold mb-2">Paquete</h4>
                <DetailRow
                  label="Dimensiones"
                  value={`${order.package.dimensions.length}×${order.package.dimensions.width}×${order.package.dimensions.height} ${order.package.dimensions.unit}`}
                />
                <DetailRow
                  label="Peso"
                  value={`${order.package.weight.value} ${order.package.weight.unit}`}
                />
              </div>

              {/* Financiero */}
              <div className="rounded-md border p-3 space-y-1">
                <h4 className="text-sm font-semibold mb-2">Financiero</h4>
                <DetailRow
                  label="Total"
                  value={financials.totalPrice ? formatMoney(financials.totalPrice) : "—"}
                />
                <DetailRow label="Pagado" value={financials.isPaid ? "Sí" : "No"} />
              </div>

              {/* Referencias */}
              <div className="rounded-md border p-3 space-y-1">
                <h4 className="text-sm font-semibold mb-2">Referencias</h4>
                <DetailRow label="N° Factura JBG" value={references.orderNumber ?? "—"} />
                <DetailRow label="N° Factura Agente" value={references.partnerOrderNumber ?? "—"} />
              </div>
            </div>

            {/* Guía rápida */}
            {shipment?.label && (
              <div className="rounded-md border p-3 space-y-1">
                <h4 className="text-sm font-semibold mb-2">Guía</h4>
                <DetailRow label="N° Guía" value={shipment.label.trackingNumber} />
                {shipment.provider && (
                  <DetailRow label="Proveedor" value={shipment.provider.providerName} />
                )}
              </div>
            )}
          </TabsContent>

          {/* Contactos */}
          <TabsContent value="contactos" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Origen</h4>
                <div className="rounded-md border p-3 space-y-1">
                  <DetailRow label="Nombre" value={origin.name} />
                  <DetailRow label="Empresa" value={origin.company || "—"} />
                  <DetailRow label="Teléfono" value={origin.phone} />
                  <DetailRow label="Email" value={origin.email || "—"} />
                  <DetailRow label="Dirección" value={origin.address.address1} />
                  {origin.address.address2 && (
                    <DetailRow label="Dirección 2" value={origin.address.address2} />
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
                  <DetailRow label="Dirección" value={destination.address.address1} />
                  {destination.address.address2 && (
                    <DetailRow label="Dirección 2" value={destination.address.address2} />
                  )}
                  <DetailRow
                    label="Ciudad"
                    value={`${destination.address.city}, ${destination.address.province}`}
                  />
                  <DetailRow label="C.P." value={destination.address.zip} />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Paquete */}
          <TabsContent value="paquete" className="mt-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Detalle del paquete</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Caja" value={boxes.find(b => b.id === order.package.boxId)?.name ?? order.package.boxId} />
                <DetailRow
                  label="Dimensiones"
                  value={`${order.package.dimensions.length}×${order.package.dimensions.width}×${order.package.dimensions.height} ${order.package.dimensions.unit}`}
                />
                <DetailRow
                  label="Peso"
                  value={`${order.package.weight.value} ${order.package.weight.unit}`}
                />
                <DetailRow
                  label="Propiedad"
                  value={
                    order.package.ownership === "STORE"
                      ? "Caja de la tienda"
                      : "Caja traída por el cliente"
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Envío */}
          {isCompleted && shipment && (
            <TabsContent value="envio" className="mt-4">
              <OrderShipmentSection shipment={shipment} />
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter>
          {order.invoiceId && (
            <Button
              variant="outline"
              size="sm"
              onClick={downloadInvoice}
              disabled={isDownloadingInvoice}
            >
              <Download className="mr-1.5 size-4" />
              {isDownloadingInvoice ? "Descargando..." : "Descargar factura"}
            </Button>
          )}
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
          {shipment && order.status !== "CANCELLED" && (
            <Button
              variant="outline"
              onClick={() => onCancelShipment?.(shipment.id)}
              disabled={isCancelling}
              className="border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/50"
            >
              <Ban className="size-4" />
              {isCancelling ? "Cancelando..." : "Cancelar envío"}
            </Button>
          )}
          <Button
            variant="destructive"
            onClick={() => onDelete?.(order)}
            disabled={isDeleting}
          >
            <Trash2 className="size-4" />
            Eliminar
          </Button>
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
