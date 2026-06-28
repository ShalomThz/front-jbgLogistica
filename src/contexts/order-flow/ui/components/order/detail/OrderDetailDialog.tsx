import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  ORDER_STATUS_LABELS,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import { CancelShipmentDialog } from "../CancelShipmentDialog";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { OrderShipmentSection } from "./OrderShipmentSection";
import { OrderFinancialSection } from "./OrderFinancialSection";
import { CarrierLogo } from "@contexts/shared/ui/components/CarrierLogo";
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
      <span className="col-span-2 min-w-0 text-sm break-words">{value}</span>
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
  const [cancelShipmentOpen, setCancelShipmentOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("resumen");
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
  // The invoice is generated on demand from the order, so it is available
  // once the order has been priced (numbered + tariff + billed total).
  const canPrintInvoice = Boolean(
    references.orderNumber && financials.tariff && financials.totalBilled,
  );

  const canEditPartner = user ? orderPolicies.editPartner(user) : false;
  const canEditHQ = user ? orderPolicies.editHQ(user) : false;
  const userCanEdit = order.type === "PARTNER" ? (canEditPartner || canEditHQ) : canEditHQ;
  const userCanDelete = user
    ? order.type === "PARTNER" ? orderPolicies.deletePartner(user) : orderPolicies.deleteHQ(user)
    : false;

  const downloadInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(order.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${order.references.orderNumber ?? order.references.partnerOrderNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const downloadLabel = async (variant: LabelVariant) => {
    if (!shipment?.label) return;
    if (shipment.label.documentUrl && !shipment.label.documentUrl.startsWith("/")) {
      window.open(shipment.label.documentUrl, "_blank");
      return;
    }
    setIsDownloadingLabel(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id, variant);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${order.id}-${variant}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingLabel(false);
    }
  };

  const printInvoice = async () => {
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(order.id);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const printLabel = async (variant: LabelVariant) => {
    if (!shipment?.label) return;
    if (shipment.label.documentUrl && !shipment.label.documentUrl.startsWith("/")) {
      const printWindow = window.open(shipment.label.documentUrl, "_blank");
      printWindow?.print();
      return;
    }
    setIsDownloadingLabel(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id, variant);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingLabel(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex! flex-col gap-0! p-0! sm:max-w-3xl max-h-[90vh] overflow-hidden">
        {pendingRoute ? (
          <div className="p-6">
            <PageLoader text="Redirigiendo..." />
          </div>
        ) : (
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col gap-0!"
        >
        {/* Header box - static */}
        <div className="shrink-0 border-b px-4 pt-8 pb-2 sm:px-6">
        <DialogHeader className="flex-row items-start gap-3 space-y-0">
          {shipment?.provider && (
            <CarrierLogo
              name={shipment.provider.providerName}
              className="size-10 shrink-0 rounded object-contain mt-0.5"
            />
          )}
          <div className="min-w-0 flex-1">
          <DialogTitle className="break-words">
            Orden{" "}
            {[references.orderNumber, references.partnerOrderNumber]
              .filter(Boolean)
              .map((n) => `#${n}`)
              .join(" · ") || order.id}
          </DialogTitle>
          <DialogDescription className="text-sm flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
          </div>
        </DialogHeader>

          <TabsList
            variant="line"
            className="mt-4 w-full justify-start overflow-x-auto"
          >
            <TabsTrigger value="resumen" className="flex-none">Resumen</TabsTrigger>
            <TabsTrigger value="contactos" className="flex-none">Contactos</TabsTrigger>
            <TabsTrigger value="paquete" className="flex-none">Paquete</TabsTrigger>
            {isCompleted && shipment && (
              <TabsTrigger value="envio" className="flex-none">Envío</TabsTrigger>
            )}
            {isCompleted && shipment && (
              <TabsTrigger value="financiero" className="flex-none">Financiero</TabsTrigger>
            )}
          </TabsList>
        </div>

        {/* Content box - scrolls vertically and horizontally */}
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {/* Resumen */}
          <TabsContent value="resumen" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ruta */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab("contactos")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("contactos");
                  }
                }}
                className="rounded-md border border-blue-200 bg-blue-50/60 p-3 space-y-1 cursor-pointer transition-colors hover:bg-blue-100/70 dark:border-blue-900/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
              >
                <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">Ruta</h4>
                <DetailRow label="Origen" value={`${origin.name} — ${origin.address.city}, ${origin.address.province}`} />
                <DetailRow label="Destino" value={`${destination.name} — ${destination.address.city}, ${destination.address.province}`} />
                <DetailRow label="Recolección" value={order.pickupAtAddress ? "Recolección a domicilio" : "Entregado en sucursal"} />
              </div>

              {/* Paquete */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab("paquete")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("paquete");
                  }
                }}
                className="rounded-md border border-amber-200 bg-amber-50/60 p-3 space-y-1 cursor-pointer transition-colors hover:bg-amber-100/70 dark:border-amber-900/50 dark:bg-amber-950/20 dark:hover:bg-amber-950/40"
              >
                <h4 className="text-sm font-semibold mb-2 text-amber-900 dark:text-amber-200">Paquete</h4>
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
              <div
                role={isCompleted && shipment ? "button" : undefined}
                tabIndex={isCompleted && shipment ? 0 : undefined}
                onClick={() => {
                  if (isCompleted && shipment) setActiveTab("financiero");
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isCompleted && shipment) {
                    e.preventDefault();
                    setActiveTab("financiero");
                  }
                }}
                className={cn(
                  "rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 dark:border-emerald-900/50 dark:bg-emerald-950/20",
                  isCompleted && shipment && "cursor-pointer transition-colors hover:bg-emerald-100/70 dark:hover:bg-emerald-950/40",
                )}
              >
                <h4 className="text-sm font-semibold mb-2 text-emerald-900 dark:text-emerald-200">Financiero</h4>
                <DetailRow
                  label="Total"
                  value={financials.totalBilled ? formatMoney(financials.totalBilled) : "—"}
                />
                {financials.discount.amount && (
                  <DetailRow
                    label="Descuento"
                    value={`-${formatMoney(financials.discount.amount)}${financials.discount.concept ? ` (${financials.discount.concept})` : ""}`}
                  />
                )}
                <DetailRow label="Pagado" value={financials.isPaid ? "Sí" : "No"} />
              </div>

              {/* Referencias */}
              <div
                role={isCompleted && shipment ? "button" : undefined}
                tabIndex={isCompleted && shipment ? 0 : undefined}
                onClick={() => {
                  if (isCompleted && shipment) setActiveTab("envio");
                }}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && isCompleted && shipment) {
                    e.preventDefault();
                    setActiveTab("envio");
                  }
                }}
                className={cn(
                  "rounded-md border p-3 space-y-1",
                  isCompleted && shipment && "cursor-pointer transition-colors hover:bg-muted/50",
                )}
              >
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
                <DetailRow label="N° Guía" value={shipment.label.trackingNumber ?? "—"} />
                {shipment.provider && (
                  <DetailRow label="Proveedor" value={shipment.provider.providerName} />
                )}
              </div>
            )}
          </TabsContent>

          {/* Contactos */}
          <TabsContent value="contactos">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Origen</h4>
                <div className="rounded-md border p-3 space-y-1">
                  <DetailRow label="Nombre" value={origin.name} />
                  {origin.customerNumber != null && (
                    <DetailRow label="No. Cliente" value={formatCustomerNumber(origin.customerNumber)} />
                  )}
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
                  {destination.customerNumber != null && (
                    <DetailRow label="No. Cliente" value={formatCustomerNumber(destination.customerNumber)} />
                  )}
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
          <TabsContent value="paquete">
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
              {order.package.photos.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Fotos</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {order.package.photos.map((src, i) => (
                      <a
                        key={i}
                        href={src}
                        target="_blank"
                        rel="noreferrer"
                        className="aspect-square rounded-md overflow-hidden border"
                      >
                        <img
                          src={src}
                          alt={`Foto ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Envío */}
          {isCompleted && shipment && (
            <TabsContent value="envio">
              <OrderShipmentSection shipment={shipment} />
            </TabsContent>
          )}

          {/* Financiero */}
          {isCompleted && shipment && (
            <TabsContent value="financiero">
              <OrderFinancialSection
                rate={shipment.rate}
                costBreakdown={shipment.costBreakdown}
                totalBilled={financials.totalBilled}
                tariff={financials.tariff}
                discount={financials.discount}
              />
            </TabsContent>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t p-4 sm:p-6">
          {shipment?.label && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloadingLabel}
                  className="w-full sm:w-auto"
                >
                  <Tag className="mr-1.5 size-4" />
                  Etiqueta
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  JBG Cargo
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                  onClick={() => downloadLabel("cargo")}
                >
                  <Download className="size-4" />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                  onClick={() => printLabel("cargo")}
                >
                  <Printer className="size-4" />
                  Imprimir
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  JBG Agente
                </DropdownMenuLabel>
                <DropdownMenuItem
                  className="bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50"
                  onClick={() => downloadLabel("agente")}
                >
                  <Download className="size-4" />
                  Descargar
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50"
                  onClick={() => printLabel("agente")}
                >
                  <Printer className="size-4" />
                  Imprimir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {canPrintInvoice && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloadingInvoice}
                  className="w-full sm:w-auto"
                >
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
              onClick={() => setCancelShipmentOpen(true)}
              disabled={isCancelling}
              className="w-full sm:w-auto border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-400 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950/50"
            >
              <Ban className="size-4" />
              {isCancelling ? "Cancelando..." : "Cancelar envío"}
            </Button>
          )}
          {shipment && (
            <CancelShipmentDialog
              open={cancelShipmentOpen}
              onClose={() => setCancelShipmentOpen(false)}
              onConfirm={() => {
                setCancelShipmentOpen(false);
                onCancelShipment?.(shipment.id);
              }}
              isLoading={isCancelling}
            />
          )}
          {userCanDelete && (
            <Button
              variant="destructive"
              onClick={() => onDelete?.(order)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          )}
          {userCanEdit && (
            order.type === "PARTNER" ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button disabled={!isEditable} className="w-full sm:w-auto">
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
                className="w-full sm:w-auto"
              >
                <Pencil className="size-4" />
                Editar
              </Button>
            )
          )}
        </DialogFooter>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
