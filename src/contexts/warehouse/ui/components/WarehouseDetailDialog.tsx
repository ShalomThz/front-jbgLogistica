import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { Download, Package, Pencil, Trash2 } from "lucide-react";
import type {
  PackageListViewPrimitives,
  WarehousePackageStatus,
} from "../../domain/WarehousePackageSchema";

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

function DetailRow({ label, value }: { label: string; value: string }) {
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
  onEdit?: (pkg: PackageListViewPrimitives) => void;
  onDelete?: (pkg: PackageListViewPrimitives) => void;
  onDownloadReceipt?: (id: string) => void;
  isDownloadingReceipt?: boolean;
}

export const WarehouseDetailDialog = ({ pkg, open, onClose, onEdit, onDelete, onDownloadReceipt, isDownloadingReceipt }: Props) => {
  if (!pkg) return null;

  const createdDate = new Date(pkg.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const dimStr = `${pkg.dimensions.length} × ${pkg.dimensions.width} × ${pkg.dimensions.height} ${pkg.dimensions.unit}`;
  const weightStr = `${pkg.weight.value} ${pkg.weight.unit}`;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Package className="size-5" />
              Paquete {pkg.id.slice(0, 8)}
            </span>
            <Badge variant={STATUS_VARIANT[pkg.status]}>{STATUS_LABELS[pkg.status]}</Badge>
          </DialogTitle>
          <DialogDescription>Ingresado el {createdDate}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información del paquete</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Factura oficial" value={pkg.officialInvoice} />
              <DetailRow label="Dimensiones" value={dimStr} />
              <DetailRow label="Peso" value={weightStr} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Referencias</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Proveedor" value={pkg.provider.name} />
              <DetailRow label="Repartidor proveedor" value={pkg.providerDeliveryPerson} />
              <DetailRow label="Cliente" value={pkg.customer.name} />
              <DetailRow label="Tienda" value={pkg.store.name} />
              <DetailRow label="Registrado por" value={pkg.user.name} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Creado" value={createdDate} />
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
        <DialogFooter>
          {onDownloadReceipt && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadReceipt(pkg.id)}
              disabled={isDownloadingReceipt}
            >
              <Download className="mr-1.5 size-4" />
              {isDownloadingReceipt ? "Generando..." : "Descargar recibo"}
            </Button>
          )}
          {onDelete && (
            <Button variant="outline" size="sm" onClick={() => onDelete(pkg)}>
              <Trash2 className="mr-1.5 size-4" />
              Eliminar
            </Button>
          )}
          {onEdit && (
            <Button size="sm" onClick={() => onEdit(pkg)}>
              <Pencil className="mr-1.5 size-4" />
              Editar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
