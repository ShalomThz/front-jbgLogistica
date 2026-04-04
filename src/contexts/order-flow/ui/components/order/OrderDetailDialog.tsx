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
import { Ban, ChevronDown, Download, FileText, Package, Pencil, Printer, Tag, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { OrderShipmentSection } from "./OrderShipmentSection";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

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
  const { user } = useAuth();
  const [isDownloadingLabel, setIsDownloadingLabel] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const { boxes } = useBoxes({ enabled: open });
  const { data: signatureData, isLoading: isLoadingSignature } = useMedia(order?.customerSignature);

  useEffect(() => {
    if (!open && pendingRoute) {
      navigate(pendingRoute);
      setPendingRoute(null);
    }
  }, [open, pendingRoute, navigate]);

  if (!order) return null;

  const { shipment, origin, destination, financials, references } = order;
  const isEditable =
    order.status !== "COMPLETED" && order.status !== "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  const canEditPartner = user ? orderPolicies.editPartner(user) : false;
  const canEditHQ = user ? orderPolicies.editHQ(user) : false;
  const userCanEdit = order.type === "PARTNER" ? (canEditPartner || canEditHQ) : canEditHQ;
  const userCanDelete = user
    ? order.type === "PARTNER" ? orderPolicies.deletePartner(user) : orderPolicies.deleteHQ(user)
    : false;

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

  const printInvoice = async () => {
    if (!order.invoiceId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(order.invoiceId);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const printLabel = async () => {
    if (!shipment?.label) return;
    if (!shipment.label.documentUrl.startsWith("/")) {
      const printWindow = window.open(shipment.label.documentUrl, "_blank");
      printWindow?.print();
      return;
    }
    setIsDownloadingLabel(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingLabel(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto pt-8">
        {pendingRoute ? (
          <PageLoader text="Redirigiendo..." />
        ) : (<>
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
                <DetailRow label="Recolección" value={order.pickupAtAddress ? "Recolección a domicilio" : "Entregado en sucursal"} />
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

              {/* Firma */}
              {order.customerSignature && (
                <div className="rounded-md border p-3 space-y-2 col-span-1 sm:col-span-2">
                  <h4 className="text-sm font-semibold">Evidencia de Cliente</h4>
                  {isLoadingSignature ? (
                    <div className="text-sm text-muted-foreground animate-pulse">Cargando firma...</div>
                  ) : signatureData?.url ? (
                    <div className="bg-white rounded-md flex justify-center py-2 px-4 shadow-sm border border-black/10">
                      <img src={signatureData.url} alt="Firma del cliente" className="h-24 w-auto object-contain" />
                    </div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Firma no disponible</div>
                  )}
                </div>
              )}
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
          {shipment?.label && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDownloadingLabel}>
                  <Tag className="mr-1.5 size-4" />
                  Etiqueta
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadLabel}>
                  <Download className="size-4" />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={printLabel}>
                  <Printer className="size-4" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {order.invoiceId && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={isDownloadingInvoice}>
                  <FileText className="mr-1.5 size-4" />
                  Factura
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={downloadInvoice}>
                  <Download className="size-4" />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={printInvoice}>
                  <Printer className="size-4" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
          {userCanDelete && (
            <Button
              variant="destructive"
              onClick={() => onDelete?.(order)}
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          )}
          {userCanEdit && (
            order.type === "PARTNER" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!isEditable}>
                    <Pencil className="size-4" />
                    Editar
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {canEditPartner && (
                    <DropdownMenuItem
                      onClick={() => {
                        setPendingRoute(`/orders/${order.id}/edit`);
                        onClose();
                      }}
                    >
                      <Pencil className="size-4" />
                      Editar orden
                    </DropdownMenuItem>
                  )}
                  {canEditHQ && (
                    <DropdownMenuItem
                      onClick={() => {
                        setPendingRoute(`/orders/${order.id}/edit?mode=complete`);
                        onClose();
                      }}
                    >
                      <Package className="size-4" />
                      Completar venta
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                disabled={!isEditable}
                onClick={() => {
                  setPendingRoute(`/orders/${order.id}/edit`);
                  onClose();
                }}
              >
                <Pencil className="size-4" />
                Editar
              </Button>
            )
          )}
        </DialogFooter>
        </>)}
      </DialogContent>
    </Dialog>
  );
};
