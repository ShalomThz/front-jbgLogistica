import { Pencil, Trash2, Package } from "lucide-react";
import {
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { WarehousePackagePrimitives, WarehousePackageStatus } from "../../../domain/schemas/warehouse-package/WarehousePackageSchema";

const STATUS_LABELS: Record<WarehousePackageStatus, string> = {
  WAREHOUSE: "En bodega",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  REPACKED: "Reempacado",
  AUTHORIZED: "Autorizado",
};

const STATUS_VARIANT: Record<WarehousePackageStatus, "default" | "secondary" | "outline" | "destructive"> = {
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
  pkg: WarehousePackagePrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (pkg: WarehousePackagePrimitives) => void;
  onDelete?: (pkg: WarehousePackagePrimitives) => void;
}

export const WarehouseDetailDialog = ({ pkg, open, onClose, onEdit, onDelete }: Props) => {
  if (!pkg) return null;

  const createdDate = new Date(pkg.createdAt).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

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
              <DetailRow label="ID" value={pkg.id} />
              <DetailRow label="Factura oficial" value={pkg.officialInvoice} />
              <DetailRow label="Peso" value={`${pkg.weightInKg} kg`} />
              <DetailRow label="Empacador" value={pkg.packer} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Referencias</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Cliente ID" value={pkg.customerId} />
              <DetailRow label="Tienda ID" value={pkg.storeId} />
              <DetailRow label="Proveedor ID" value={pkg.providerId} />
              <DetailRow label="Repartidor proveedor" value={pkg.providerDeliveryPerson} />
              <DetailRow label="Caja ID" value={pkg.boxId} />
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
        {(onEdit || onDelete) && (
          <DialogFooter>
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
        )}
      </DialogContent>
    </Dialog>
  );
};
