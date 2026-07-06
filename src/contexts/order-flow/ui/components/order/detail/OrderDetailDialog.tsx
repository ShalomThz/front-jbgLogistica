import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  ORDER_STATUS_LABELS,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import type { OrderStatus } from "@contexts/sales/domain/schemas/order/Order";
import { BOX_CYCLE_STATUS_LABELS } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import {
  availableLabelOptions,
  downloadLabel as downloadLabelPdf,
  printLabel as printLabelPdf,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { CancelShipmentDialog } from "../CancelShipmentDialog";
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
import { Ban, ChevronDown, DollarSign, Download, FileText, Info, Package, Pencil, Printer, Route, Tag, Trash2, Users } from "lucide-react";
import boxIsometricSvg from "@/assets/box-isometric.svg";
import { Fragment, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { OrderShipmentSection } from "./OrderShipmentSection";
import { OrderFinancialSection } from "./OrderFinancialSection";
import { OrderStatusTimeline } from "./OrderStatusTimeline";
import { CarrierLogo } from "@contexts/shared/ui/components/CarrierLogo";
import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";

const STATUS_DOT_STYLES: Record<OrderStatus, string> = {
  DRAFT: "bg-muted-foreground",
  PENDING_HQ_PROCESS: "bg-yellow-500",
  COMPLETED: "bg-blue-500",
  CANCELLED: "bg-red-500",
};

/** Explica en qué paso del ciclo de caja vacía va la orden. */
const BOX_CYCLE_TOOLTIPS: Partial<Record<string, string>> = {
  EMPTY_BOX_PENDING:
    "El chofer debe entregar la caja vacía en el domicilio del remitente",
  AWAITING_PICKUP:
    "La caja está con el cliente; falta que el chofer la recolecte",
  AT_WAREHOUSE:
    "La caja regresó a bodega; JBG debe procesar y tarifar la orden",
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

// Mirrors the backend's Dimensions.calculateVolumetricWeight: dimensions are
// normalized to cm (×2.54 when in inches) and divided by 5000, so the result
// is always in kg regardless of the package's mass-weight unit.
function volumetricWeightKg(dimensions: {
  length: number;
  width: number;
  height: number;
  unit: string;
}) {
  const m = dimensions.unit === "in" ? 2.54 : 1;
  return (dimensions.length * m * (dimensions.width * m) * (dimensions.height * m)) / 5000;
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
  const boxCycleLabel = shipment
    ? BOX_CYCLE_STATUS_LABELS[shipment.status]
    : undefined;

  // Origin actually sent to the carrier, mirroring the backend's resolveOrigin:
  // packages always ship from the JBG warehouse stamped on the shipment
  // (HQ default when none was stored).
  const shippingOrigin = shipment?.warehouseAddress ?? null;
  // The invoice is generated on demand from the order, so it is available
  // once the order has been priced (numbered + tariff + billed total).
  const canPrintInvoice = Boolean(
    references.orderNumber && financials.tariff && financials.totalBilled,
  );

  const canEditPartner = user ? orderPolicies.editPartner(user) : false;
  const canEditHQ = user ? orderPolicies.editHQ(user) : false;
  const canViewFinancials = user ? orderPolicies.viewFinancials(user) : false;
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

  const downloadLabel = async (source: LabelSource) => {
    if (!shipment) return;
    setIsDownloadingLabel(true);
    try {
      const suffix = source.kind === "render" ? source.variant : "transportista";
      await downloadLabelPdf(
        shipment,
        source,
        `etiqueta-${order.id}-${suffix}.pdf`,
      );
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

  const printLabel = async (source: LabelSource) => {
    if (!shipment) return;
    setIsDownloadingLabel(true);
    try {
      await printLabelPdf(shipment, source);
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
                    {boxCycleLabel && (
                      <Badge
                        variant="outline"
                        className="ml-1 border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                      >
                        {boxCycleLabel}
                      </Badge>
                    )}
                  </span>
                </TooltipTrigger>
                {boxCycleLabel ? (
                  <TooltipContent>{BOX_CYCLE_TOOLTIPS[shipment!.status]}</TooltipContent>
                ) : (
                  order.status === "PENDING_HQ_PROCESS" && (
                    <TooltipContent>
                      La tienda completó su orden, JBG Logistics necesita completar la venta
                    </TooltipContent>
                  )
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
            <TabsTrigger value="clientes" className="flex-none">Clientes</TabsTrigger>
            <TabsTrigger value="ruta" className="flex-none">Ruta</TabsTrigger>
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
            <OrderStatusTimeline order={order} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ruta */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => setActiveTab("ruta")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setActiveTab("ruta");
                  }
                }}
                className="rounded-md border border-blue-200 bg-blue-50/60 p-3 space-y-1 cursor-pointer transition-colors hover:bg-blue-100/70 dark:border-blue-900/50 dark:bg-blue-950/20 dark:hover:bg-blue-950/40"
              >
                <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">
                  <Route className="size-4" />
                  Ruta
                </h4>
                <DetailRow label="Remitente" value={`${origin.name} — ${origin.address.city}, ${origin.address.province}`} />
                <DetailRow label="Destinatario" value={`${destination.name} — ${destination.address.city}, ${destination.address.province}`} />
                <DetailRow label="Recolección" value={order.emptyBoxDelivery ? "Caja vacía a domicilio (se recolecta)" : "Entregado en sucursal"} />
                {order.emptyBoxDelivery && (
                  <DetailRow
                    label="Caja vacía"
                    value={
                      order.financials.advance
                        ? `Se deja a domicilio — anticipo $${order.financials.advance.amount.toFixed(2)} ${order.financials.advance.currency}`
                        : "Se deja a domicilio"
                    }
                  />
                )}
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
                <img src={boxIsometricSvg} alt="Caja" className="w-12 h-auto mb-2" />
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
                <h4 className="flex items-center gap-1.5 text-sm font-semibold mb-2 text-emerald-900 dark:text-emerald-200">
                  <DollarSign className="size-4" />
                  Financiero
                </h4>
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
                {financials.advance && (
                  <>
                    <DetailRow
                      label="Anticipo pagado"
                      value={`-${formatMoney(financials.advance)}`}
                    />
                    {financials.totalBilled && (
                      <DetailRow
                        label="Restante"
                        value={formatMoney({
                          amount: Math.max(0, financials.totalBilled.amount - financials.advance.amount),
                          currency: financials.totalBilled.currency,
                        })}
                      />
                    )}
                  </>
                )}
                <DetailRow
                  label="Pagado"
                  value={
                    financials.isPaid
                      ? "Sí"
                      : financials.advance
                        ? "Anticipo"
                        : "No"
                  }
                />
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

          {/* Clientes */}
          <TabsContent value="clientes" className="space-y-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="size-4 text-muted-foreground" />
              Clientes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Remitente</h4>
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
                <h4 className="text-sm font-semibold">Destinatario</h4>
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

          {/* Ruta enviada a la paquetería */}
          <TabsContent value="ruta">
            <div className="space-y-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <Route className="size-4 text-muted-foreground" />
                Ruta
              </h3>
              <div className="flex items-start gap-2 rounded-md border border-blue-200 bg-blue-50/60 p-3 text-sm dark:border-blue-900/50 dark:bg-blue-950/20">
                <Info className="size-4 shrink-0 mt-0.5 text-blue-700 dark:text-blue-300" />
                <p className="text-blue-900 dark:text-blue-200">
                  El paquete sale del almacén JBG, no de la dirección del cliente.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">
                    Origen (almacén JBG)
                  </h4>
                  <div className="rounded-md border p-3 space-y-1">
                    {shippingOrigin ? (
                      <>
                        <DetailRow label="Nombre" value={shippingOrigin.name} />
                        <DetailRow label="Empresa" value={shippingOrigin.company || "—"} />
                        <DetailRow label="Teléfono" value={shippingOrigin.phone} />
                        <DetailRow label="Dirección" value={shippingOrigin.address.address1} />
                        {shippingOrigin.address.address2 && (
                          <DetailRow label="Dirección 2" value={shippingOrigin.address.address2} />
                        )}
                        <DetailRow
                          label="Ciudad"
                          value={`${shippingOrigin.address.city}, ${shippingOrigin.address.province}`}
                        />
                        <DetailRow label="C.P." value={shippingOrigin.address.zip} />
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Salió de la dirección por defecto de JBG (configuración de HQ).
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Destino</h4>
                  <div className="rounded-md border p-3 space-y-1">
                    <DetailRow label="Nombre" value={destination.name} />
                    <DetailRow label="Empresa" value={destination.company || "—"} />
                    <DetailRow label="Teléfono" value={destination.phone} />
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
            </div>
          </TabsContent>

          {/* Paquete */}
          <TabsContent value="paquete">
            <div className="space-y-2">
              <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-muted/30 py-6">
                <img src={boxIsometricSvg} alt="Caja" className="w-32 h-auto" />
                <p className="text-sm text-muted-foreground">
                  {boxes.find((b) => b.id === order.package.boxId)?.name ?? "Caja"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.package.dimensions.length} × {order.package.dimensions.width} × {order.package.dimensions.height} {order.package.dimensions.unit}
                </p>
              </div>
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
                  label="Peso volumétrico"
                  value={`${volumetricWeightKg(order.package.dimensions).toFixed(2)} kg`}
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
            <TabsContent value="financiero" className="space-y-3">
              <h3 className="flex items-center gap-2 text-sm font-semibold">
                <DollarSign className="size-4 text-muted-foreground" />
                Financiero
              </h3>
              <OrderFinancialSection
                rate={shipment.rate}
                costBreakdown={shipment.costBreakdown}
                totalBilled={financials.totalBilled}
                tariff={financials.tariff}
                discount={financials.discount}
                advance={financials.advance}
                canViewFinancials={canViewFinancials}
              />
            </TabsContent>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t p-4 sm:p-6">
          {shipment && availableLabelOptions(shipment).length > 0 && (
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
                {availableLabelOptions(shipment).map((option, index) => (
                  <Fragment key={option.id}>
                    {index > 0 && <DropdownMenuSeparator />}
                    <DropdownMenuLabel className="text-xs text-muted-foreground">
                      {option.title}
                    </DropdownMenuLabel>
                    <DropdownMenuItem
                      className={option.className}
                      onClick={() => downloadLabel(option.source)}
                    >
                      <Download className="size-4" />
                      Descargar
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className={option.className}
                      onClick={() => printLabel(option.source)}
                    >
                      <Printer className="size-4" />
                      Imprimir
                    </DropdownMenuItem>
                  </Fragment>
                ))}
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
