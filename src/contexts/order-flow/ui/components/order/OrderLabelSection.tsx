import { useState } from "react";
import { Download, ExternalLink } from "lucide-react";
import { Button } from "@contexts/shared/shadcn";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import type { ShippingLabelPrimitives } from "@contexts/shipping/domain/schemas/value-objects/ShippingLabel";

interface OrderLabelSectionProps {
  label: ShippingLabelPrimitives;
  shipmentId: string;
  orderId?: string;
}

export const OrderLabelSection = ({ label, shipmentId, orderId }: OrderLabelSectionProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const isLocalLabel = label.documentUrl.startsWith("/");

  const handleLabel = async () => {
    if (!isLocalLabel) {
      window.open(label.documentUrl, "_blank");
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await shipmentRepository.getLabel(shipmentId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta${orderId ? `-${orderId}` : ""}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Etiqueta de envío</h4>
        <Button size="sm" variant="outline" onClick={handleLabel} disabled={isDownloading}>
          {isLocalLabel ? (
            <>
              <Download className="mr-1.5 size-4" />
              {isDownloading ? "Descargando..." : "Descargar etiqueta"}
            </>
          ) : (
            <>
              <ExternalLink className="mr-1.5 size-4" />
              Ver etiqueta
            </>
          )}
        </Button>
      </div>

      <div className="rounded-md border p-3 space-y-1">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Proveedor</span>
          <span className="col-span-2 text-sm">{label.provider}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Formato</span>
          <span className="col-span-2 text-sm">{label.format}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Generada</span>
          <span className="col-span-2 text-sm">
            {new Date(label.generatedAt).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};
