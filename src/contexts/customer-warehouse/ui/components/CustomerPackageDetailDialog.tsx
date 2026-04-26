import { useEffect, useState } from "react";
import {
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { ChevronLeft, ChevronRight, Images, Package, X } from "lucide-react";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

const STATUS_VARIANT: Record<
  WarehousePackageStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  WAREHOUSE: "secondary",
  SHIPPED: "outline",
  DELIVERED: "default",
  REPACKED: "secondary",
  AUTHORIZED: "default",
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface Props {
  pkg: PackageListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
}

export const CustomerPackageDetailDialog = ({ pkg, open, onClose }: Props) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const photos = pkg?.photos ?? [];

  useEffect(() => {
    if (lightboxIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      if (e.key === "ArrowRight")
        setLightboxIndex((i) => (i !== null ? (i + 1) % photos.length : null));
      if (e.key === "ArrowLeft")
        setLightboxIndex((i) =>
          i !== null ? (i - 1 + photos.length) % photos.length : null,
        );
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, photos.length]);

  if (!pkg) return null;

  const createdDate = new Date(pkg.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const boxSummaries = pkg.boxes.map(
    (b) => `${b.dimensions.length}×${b.dimensions.width}×${b.dimensions.height} ${b.dimensions.unit} · ${b.weight.value} ${b.weight.unit}`,
  );

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v && lightboxIndex !== null) return;
          if (!v) onClose();
        }}
      >
        <DialogContent className="sm:max-w-lg pt-8">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="size-5" />
                Paquete {pkg.id.slice(0, 8)}
              </span>
              <Badge variant={STATUS_VARIANT[pkg.status]}>
                {STATUS_LABELS[pkg.status]}
              </Badge>
            </DialogTitle>
            <DialogDescription>Ingresado el {createdDate}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <Images className="size-4" />
                  Fotos ({photos.length})
                </h4>
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((src, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i)}
                      className="aspect-square w-full rounded-md overflow-hidden border focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <img
                        src={src}
                        alt={`Foto ${i + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                      />
                    </button>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Información del paquete</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Factura oficial" value={pkg.officialInvoice} />
                {boxSummaries.map((summary, i) => (
                  <DetailRow key={i} label={`Caja ${i + 1}`} value={summary} />
                ))}
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Referencias</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Proveedor" value={pkg.provider.name} />
                <DetailRow label="Repartidor proveedor" value={pkg.providerDetails.deliveryPerson} />
                <DetailRow label="Factura proveedor" value={pkg.providerDetails.supplierInvoice ?? undefined} />
                <DetailRow label="Tienda" value={pkg.store.name} />
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Fechas</h4>
              <div className="rounded-md border p-3 space-y-1">
                <DetailRow label="Ingresado" value={createdDate} />
                <DetailRow
                  label="Actualizado"
                  value={new Date(pkg.updatedAt).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center bg-black/95"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLightboxIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
          >
            <X className="size-7" />
          </button>

          <span className="absolute top-4 left-1/2 -translate-x-1/2 text-sm text-white/70">
            {lightboxIndex + 1} / {photos.length}
          </span>

          {photos.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((i) =>
                  i !== null ? (i - 1 + photos.length) % photos.length : null,
                )
              }
              className="absolute left-4 text-white/80 hover:text-white"
            >
              <ChevronLeft className="size-10" />
            </button>
          )}

          <img
            src={photos[lightboxIndex]}
            alt={`Foto ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
          />

          {photos.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((i) =>
                  i !== null ? (i + 1) % photos.length : null,
                )
              }
              className="absolute right-4 text-white/80 hover:text-white"
            >
              <ChevronRight className="size-10" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
