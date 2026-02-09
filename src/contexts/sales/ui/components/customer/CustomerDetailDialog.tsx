import { Pencil, Trash2, MapPin } from "lucide-react";
import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { CustomerPrimitives } from "@/contexts/sales/domain";

const STATUS_LABELS: Record<string, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<string, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface Props {
  customer: CustomerPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (customer: CustomerPrimitives) => void;
  onDelete?: (customer: CustomerPrimitives) => void;
}

export const CustomerDetailDialog = ({ customer, open, onClose, onEdit, onDelete }: Props) => {
  if (!customer) return null;

  const status = "ACTIVE"; // TODO: add status to schema if needed
  const createdDate = new Date(customer.createdAt).toLocaleDateString("es-MX");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{customer.name}</span>
            <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
          </DialogTitle>
          <DialogDescription>Cliente desde {createdDate}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Datos personales</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={customer.name} />
              <DetailRow label="Empresa" value={customer.company} />
              <DetailRow label="Teléfono" value={customer.phone} />
              <DetailRow label="Email" value={customer.email} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <MapPin className="size-4" />
              Dirección
            </h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Dirección" value={customer.address.address1} />
              {customer.address.address2 && (
                <DetailRow label="Dirección 2" value={customer.address.address2} />
              )}
              <DetailRow label="Ciudad" value={customer.address.city} />
              <DetailRow label="Provincia" value={customer.address.province} />
              <DetailRow label="C.P." value={customer.address.zip} />
              <DetailRow label="País" value={customer.address.country} />
              {customer.address.reference && (
                <DetailRow label="Referencia" value={customer.address.reference} />
              )}
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información adicional</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="ID Tienda" value={customer.registeredByStoreId} />
              <DetailRow label="Fecha registro" value={createdDate} />
              <DetailRow label="Última actualización" value={new Date(customer.updatedAt).toLocaleDateString("es-MX")} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(customer)}>
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(customer)}>
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
