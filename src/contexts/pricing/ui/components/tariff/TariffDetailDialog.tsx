import { Pencil, Trash2 } from "lucide-react";
import { Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { TariffPrimitives } from "../../../domain";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props {
  tariff: TariffPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (tariff: TariffPrimitives) => void;
  onDelete?: (tariff: TariffPrimitives) => void;
}

export const TariffDetailDialog = ({ tariff, open, onClose, onEdit, onDelete }: Props) => {
  if (!tariff) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle>Tarifa {tariff.id}</DialogTitle>
          <DialogDescription>Creada el {new Date(tariff.createdAt).toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Configuración</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Zona origen" value={tariff.originZoneId} />
              <DetailRow label="País destino" value={tariff.destinationCountry} />
              <DetailRow label="Caja" value={tariff.boxId} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Precio</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Monto" value={`$${tariff.price.amount.toFixed(2)}`} />
              <DetailRow label="Moneda" value={tariff.price.currency} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Fechas</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Creación" value={new Date(tariff.createdAt).toLocaleDateString("es-MX")} />
              <DetailRow label="Actualización" value={new Date(tariff.updatedAt).toLocaleDateString("es-MX")} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(tariff)}><Trash2 className="mr-1.5 size-4" />Eliminar</Button>}
            {onEdit && <Button size="sm" onClick={() => onEdit(tariff)}><Pencil className="mr-1.5 size-4" />Editar</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
