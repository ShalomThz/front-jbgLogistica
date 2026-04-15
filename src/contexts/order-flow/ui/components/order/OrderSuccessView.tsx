import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
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
  Plus,
  Printer,
  Share2,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { FileText } from "lucide-react";

const CARRIER_TYPE_LABELS: Record<string, string> = {
  INTERNAL_FLEET: "Flota interna",
  THIRD_PARTY: "Tercero",
};

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

function sumMoney(...amounts: (MoneyPrimitives | undefined | null)[]): MoneyPrimitives {
  const totalAmount = amounts.reduce((sum, money) => sum + (money?.amount ?? 0), 0);
  const currency = amounts.find((money) => money?.currency)?.currency || "USD";
  return { amount: totalAmount, currency };
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
  invoiceId?: string | null;
  onFinish: () => void;
  onCreateAnother?: () => void;
}

export function OrderSuccessView({ shipment, invoiceId, onFinish, onCreateAnother }: OrderSuccessViewProps) {
  const { provider, rate, label, costBreakdown, finalPrice } = shipment;
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingInvoice, setIsDownloadingInvoice] = useState(false);

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

  const handleDownloadLabel = async (variant: LabelVariant) => {
    if (!label) return;
    const isLocal = label.documentUrl.startsWith("/");
    if (!isLocal) {
      window.open(label.documentUrl, "_blank");
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id, variant);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${label.trackingNumber}-${variant}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrintLabel = async (variant: LabelVariant) => {
    if (!label) return;
    const isLocal = label.documentUrl.startsWith("/");
    if (!isLocal) {
      const printWindow = window.open(label.documentUrl, "_blank");
      printWindow?.print();
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await shipmentRepository.getLabel(shipment.id, variant);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!invoiceId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${invoiceId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const handlePrintInvoice = async () => {
    if (!invoiceId) return;
    setIsDownloadingInvoice(true);
    try {
      const blob = await orderRepository.getInvoicePdf(invoiceId);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setIsDownloadingInvoice(false);
    }
  };

  const total = finalPrice
    ? sumMoney(
        finalPrice,
        costBreakdown?.additionalCost,
        costBreakdown?.insurance,
        costBreakdown?.tape,
        costBreakdown?.wrap,
        costBreakdown?.tools,
      )
    : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Success Banner */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-950/30">
        <CheckCircle2 className="mx-auto size-12 text-green-600" />
        <h2 className="mt-3 text-xl font-bold text-green-700 dark:text-green-400">
          Envío creado exitosamente
        </h2>
        <p className="mt-1 text-sm text-green-600/80 dark:text-green-400/70">
          La guía ha sido generada y el envío está listo
        </p>
      </div>

      {/* Tracking Hero */}
      {label && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground">Número de guía</p>
                <p className="mt-0.5 truncate text-lg font-bold tracking-wide">
                  {label.trackingNumber}
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
                  onClick={() => copyToClipboard(label.trackingNumber, "N° de guía")}
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
                  onClick={() => window.open(label.trackingUrl, "_blank")}
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
      {label && (
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
              <DropdownMenuItem
                className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                onClick={() => handleDownloadLabel("cargo")}
              >
                <Download className="size-4" />
                JBG Cargo
              </DropdownMenuItem>
              <DropdownMenuItem
                className="bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50"
                onClick={() => handleDownloadLabel("agente")}
              >
                <Download className="size-4" />
                JBG Agente
              </DropdownMenuItem>
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
              <DropdownMenuItem
                className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                onClick={() => handlePrintLabel("cargo")}
              >
                <Printer className="size-4" />
                JBG Cargo
              </DropdownMenuItem>
              <DropdownMenuItem
                className="bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50"
                onClick={() => handlePrintLabel("agente")}
              >
                <Printer className="size-4" />
                JBG Agente
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Invoice Actions */}
      {invoiceId && (
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

      {/* Shipment Summary */}
      <Card>
        <CardContent className="space-y-4 pt-6">
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
              {total && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-blue-600">{formatMoney(total)}</p>
                </div>
              )}
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
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between gap-3">
        {onCreateAnother && (
          <Button variant="outline" className="gap-2" onClick={onCreateAnother}>
            <Plus className="size-4" />
            Crear otro envío
          </Button>
        )}
        <Button className="ml-auto" onClick={onFinish}>
          Ir a órdenes
        </Button>
      </div>
    </div>
  );
}
