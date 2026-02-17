import { useEffect, useState } from "react";
import { Download, FileWarning } from "lucide-react";
import { Button, Skeleton } from "@contexts/shared/shadcn";
import type { ShippingLabelPrimitives } from "@contexts/shipping/domain/schemas/value-objects/ShippingLabel";

interface OrderLabelSectionProps {
  label: ShippingLabelPrimitives;
}

export const OrderLabelSection = ({ label }: OrderLabelSectionProps) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");

    fetch(label.documentUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch(() => setError(true));

    return () => {
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [label.documentUrl]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Etiqueta de envío</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => window.open(blobUrl ?? label.documentUrl, "_blank")}
        >
          <Download className="size-4" />
          Descargar etiqueta
        </Button>
      </div>

      <div className="rounded-md border overflow-hidden">
        {!blobUrl && !error && <Skeleton className="w-full h-[500px]" />}
        {error && (
          <div className="w-full h-[200px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileWarning className="size-8" />
            <p className="text-sm">No se pudo cargar la vista previa</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(label.documentUrl, "_blank")}
            >
              Abrir en nueva pestaña
            </Button>
          </div>
        )}
        {blobUrl && (
          <iframe
            src={blobUrl}
            title="Etiqueta de envío"
            className="w-full h-[500px]"
          />
        )}
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
