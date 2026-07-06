import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from "@contexts/shared/shadcn";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCopy,
  Download,
  ExternalLink,
  FilePlus2,
  MapPin,
  Printer,
  Share2,
  Truck,
  User,
  UserPlus,
} from "lucide-react";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { toast } from "sonner";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import {
  availableLabelOptions,
  downloadLabel,
  printLabel,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { FileText } from "lucide-react";

const CARRIER_TYPE_LABELS: Record<string, string> = {
  INTERNAL_FLEET: "Flota interna",
  THIRD_PARTY: "Tercero",
};

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface OrderSuccessViewProps {
  shipment: ShipmentPrimitives;
  orderId?: string | null;
  totalBilled?: MoneyPrimitives | null;
  onFinish: () => void;
  onCreateBlank?: () => void;
  onCreateSameClient?: () => void;
}

export function OrderSuccessView({ shipment, orderId, totalBilled, onFinish, onCreateBlank, onCreateSameClient }: OrderSuccessViewProps) {
  const { provider, rate, label, costBreakdown } = shipment;
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(true);

  const { data: order } = useOrder(orderId ?? undefined);
  const { user } = useAuth();
  const effectiveTotalBilled = totalBilled ?? order?.financials.totalBilled ?? null;
  const totalShipping = order?.financials.totalPrice ?? null;
  const photos = order?.package.photos ?? [];

  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${description} copiado al portapapeles`);
  };

  const shareTracking = () => {
    if (!label) return;
    const text = `Tu envío está en camino.\nN° de guía: ${label.trackingNumber}\nRastreo: ${label.trackingUrl}`;
    if (navigator.share) {
      navigator.share({ title: "Información de rastreo", text });
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Información de rastreo copiada al portapapeles");
    }
  };

  const handleDownloadLabel = async (source: LabelSource) => {
    setIsDownloading(true);
    try {
      const suffix = source.kind === "render" ? source.variant : "transportista";
      await downloadLabel(
        shipment,
        source,
        `etiqueta-${label?.trackingNumber ?? shipment.id}-${suffix}.pdf`,
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintLabel = async (source: LabelSource) => {
    setIsDownloading(true);
    try {
      await printLabel(shipment, source);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!orderId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${orderId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!orderId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(orderId);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4">
        <div className="flex size-11 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircle2 className="size-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resumen de la venta</h1>
          <p className="text-sm text-muted-foreground">
            La guía fue generada y el envío está listo
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 space-y-6 overflow-auto">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
      {/* Columna 1: Resumen del envío */}
      <Card className="h-fit">
        <CardContent className="space-y-4 pt-6">
          {/* Title + vendor */}
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">Detalle del envío</p>
            {user && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="size-3.5" />
                Vendió: {user.name}
              </p>
            )}
          </div>

          {/* Cliente / Destinatario */}
          {order && (
            <>
              <Separator />
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <User className="size-3.5" />
                    Cliente
                  </p>
                  <p className="truncate text-sm font-medium">{order.origin.name}</p>
                  {order.origin.company && (
                    <p className="truncate text-xs text-muted-foreground">{order.origin.company}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{order.origin.phone}</p>
                </div>
                <div className="space-y-0.5">
                  <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                    <MapPin className="size-3.5" />
                    Destinatario
                  </p>
                  <p className="truncate text-sm font-medium">{order.destination.name}</p>
                  {order.destination.company && (
                    <p className="truncate text-xs text-muted-foreground">{order.destination.company}</p>
                  )}
                  <p className="text-xs text-muted-foreground">{order.destination.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {order.destination.address.city}, {order.destination.address.province}
                  </p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Provider + Service */}
          {(provider || rate) && (
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                {provider && (
                  <div className="flex items-center gap-2">
                    <Truck className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{provider.providerName}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {CARRIER_TYPE_LABELS[provider.type] ?? provider.type}
                    </Badge>
                  </div>
                )}
                {rate && (
                  <div className="ml-6 space-y-0.5">
                    <p className="text-sm">{rate.serviceName}</p>
                    {rate.estimatedDays != null && (
                      <p className="text-xs text-muted-foreground">
                        {rate.estimatedDays} día{rate.estimatedDays !== 1 ? "s" : ""} hábil{rate.estimatedDays !== 1 ? "es" : ""}
                      </p>
                    )}
                    {rate.isOcurre && (
                      <Badge variant="outline" className="text-[10px]">Ocurre</Badge>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Cost Breakdown (collapsible feel — always visible but compact) */}
          {costBreakdown && (
            <>
              <Separator />
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-muted-foreground">Desglose</p>
                {rate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Envío</span>
                    <span>{formatMoney(rate.price)}</span>
                  </div>
                )}
                {rate && rate.insuranceFee.amount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Seguro (paquetería)</span>
                    <span>{formatMoney(rate.insuranceFee)}</span>
                  </div>
                )}
                {Object.entries(costBreakdown).map(([key, value]) =>
                  value && value.amount > 0 ? (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{COST_LABELS[key] ?? key}</span>
                      <span>{formatMoney(value)}</span>
                    </div>
                  ) : null,
                )}
              </div>
            </>
          )}

          {/* Totals */}
          {(totalShipping || effectiveTotalBilled) && (
            <>
              <Separator />
              <div className="space-y-1.5">
                {totalShipping && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total guía</span>
                    <span className="font-semibold">{formatMoney(totalShipping)}</span>
                  </div>
                )}
                {effectiveTotalBilled && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total facturado</span>
                    <span className="text-lg font-bold text-blue-600">{formatMoney(effectiveTotalBilled)}</span>
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Columna 2: detalle, acciones y navegación */}
      <div className="space-y-6">
      {/* Tracking Hero */}
      {label && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Número de guía</p>
                <p className="mt-0.5 truncate text-lg font-bold tracking-wide">
                  {label.trackingNumber ?? "No disponible"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {label.provider} · {new Date(label.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => label.trackingNumber && copyToClipboard(label.trackingNumber, "N° de guía")}
                  title="Copiar guía"
                >
                  <ClipboardCopy className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={shareTracking}
                  title="Compartir rastreo"
                >
                  <Share2 className="size-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8"
                  onClick={() => label.trackingUrl && window.open(label.trackingUrl, "_blank")}
                  title="Ver rastreo"
                >
                  <ExternalLink className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Label Actions */}
      {availableLabelOptions(shipment).length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={isDownloading}
              >
                <Download className="size-4" />
                {isDownloading ? "Descargando..." : "Descargar etiqueta"}
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableLabelOptions(shipment).map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  className={option.className}
                  onClick={() => handleDownloadLabel(option.source)}
                >
                  <Download className="size-4" />
                  {option.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="gap-2"
                disabled={isDownloading}
              >
                <Printer className="size-4" />
                Imprimir etiqueta
                <ChevronDown className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {availableLabelOptions(shipment).map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  className={option.className}
                  onClick={() => handlePrintLabel(option.source)}
                >
                  <Printer className="size-4" />
                  {option.title}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Invoice Actions */}
      {orderId && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleDownloadInvoice}
            disabled={isDownloadingInvoice}
          >
            <FileText className="size-4" />
            {isDownloadingInvoice ? "Descargando..." : "Descargar factura"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={handlePrintInvoice}
            disabled={isDownloadingInvoice}
          >
            <Printer className="size-4" />
            Imprimir factura
          </Button>
        </div>
      )}

      {/* Fotos del paquete (al fondo de la columna 2) */}
      {photos.length > 0 && (
        <Card>
          <CardContent className="space-y-2 pt-6">
            <p className="text-xs font-semibold text-muted-foreground">Fotos del paquete</p>
            <div className="flex flex-wrap gap-3">
              {photos.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block size-24 overflow-hidden rounded-lg border"
                >
                  <img
                    src={url}
                    alt={`Foto del paquete ${i + 1}`}
                    className="size-full object-cover transition-transform hover:scale-105"
                  />
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
      </div>
      </div>

      {/* Footer */}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t pt-4">
        <div className="flex flex-wrap gap-2">
          {onCreateBlank && (
            <Button variant="outline" className="gap-2" onClick={onCreateBlank}>
              <FilePlus2 className="size-4" />
              Nueva orden en blanco
            </Button>
          )}
          {onCreateSameClient && (
            <Button variant="outline" className="gap-2" onClick={onCreateSameClient}>
              <UserPlus className="size-4" />
              Nueva orden del mismo cliente
            </Button>
          )}
        </div>
        <Button className="ml-auto" onClick={onFinish}>
          Ir a órdenes
        </Button>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-green-200 bg-green-50 sm:max-w-md dark:border-green-800 dark:bg-green-950/30">
          <DialogHeader className="items-center text-center">
            <CheckCircle2 className="size-14 text-green-600" />
            <DialogTitle className="text-xl text-green-700 dark:text-green-400">
              Creado exitosamente
            </DialogTitle>
            <DialogDescription className="text-green-600/80 dark:text-green-400/70">
              La guía ha sido generada y el envío está listo.
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-2 bg-green-600 hover:bg-green-700"
            onClick={() => setShowSuccessDialog(false)}
          >
            Ver resumen
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
