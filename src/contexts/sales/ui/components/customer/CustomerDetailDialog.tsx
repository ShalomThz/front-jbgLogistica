import { Pencil, Trash2, MapPin } from "lucide-react";
import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@contexts/shared/shadcn";
import type { CustomerListViewPrimitives } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { formatCustomerNumber } from "@contexts/shared/domain/formatCustomerNumber";
import { CustomerIdPhoto } from "./CustomerIdPhoto";

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
  customer: CustomerListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (customer: CustomerListViewPrimitives) => void;
  onDelete?: (customer: CustomerListViewPrimitives) => void;
}

export const CustomerDetailDialog = ({ customer, open, onClose, onEdit, onDelete }: Props) => {
  if (!customer) return null;

  const status = "ACTIVE"; // TODO: add status to schema if needed
  const createdDate = new Date(customer.createdAt).toLocaleDateString("es-MX");

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Tres capas: `flex flex-col` en vez del `grid` que trae el primitivo, y
          `gap-0 p-0` para que cada capa ponga su propio espaciado. El alto lo
          topa `max-h-[85vh]`; sin eso el diálogo crece con el contenido y no hay
          nada que scrollear. */}
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        {/* `pr-12` deja libre la esquina donde el primitivo pone la X. */}
        <DialogHeader className="border-b px-6 py-4 pr-12">
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="truncate">{customer.name}</span>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground">{formatCustomerNumber(customer.customerNumber)}</span>
              <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABELS[status]}</Badge>
            </div>
          </DialogTitle>
          <DialogDescription>Cliente desde {createdDate}</DialogDescription>
        </DialogHeader>
        {/* `min-h-0` es lo que habilita el scroll: sin él un hijo flex no se
            encoge por debajo de su contenido y el overflow nunca aparece. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <CustomerIdPhoto
            photo={customer.photo}
            name={customer.name}
            className="mx-auto max-w-xs"
          />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Datos personales</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={customer.name} />
              <DetailRow label="Empresa" value={customer.company} />
              <DetailRow label="Teléfono" value={customer.phone} />
              {customer.secondaryPhone && (
                <DetailRow label="Teléfono adicional" value={customer.secondaryPhone} />
              )}
              <DetailRow label="Email" value={customer.email ?? "—"} />
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
              <DetailRow label="Tienda" value={customer.store.name} />
              <DetailRow label="Fecha registro" value={createdDate} />
              <DetailRow label="Última actualización" value={new Date(customer.updatedAt).toLocaleDateString("es-MX")} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter className="border-t px-6 py-4">
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
