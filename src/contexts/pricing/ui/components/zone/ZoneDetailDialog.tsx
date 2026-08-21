import {
  AlignLeft,
  CalendarClock,
  CalendarPlus,
  Globe,
  Map,
  Pencil,
  Tag,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@contexts/shared/shadcn";
import type { ZonePrimitives } from "@contexts/pricing/domain/schemas/zone/Zone";

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        {label}
      </span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface Props {
  zone: ZonePrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (zone: ZonePrimitives) => void;
  onDelete?: (zone: ZonePrimitives) => void;
}

export const ZoneDetailDialog = ({ zone, open, onClose, onEdit, onDelete }: Props) => {
  if (!zone) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle>{zone.name}</DialogTitle>
          <DialogDescription>Creada el {new Date(zone.createdAt).toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow icon={Tag} label="Nombre" value={zone.name} />
              <DetailRow icon={Map} label="Estado" value={zone.state || "Sin definir"} />
              <DetailRow icon={Globe} label="País" value={zone.country} />
              <DetailRow icon={AlignLeft} label="Descripción" value={zone.description || "Sin descripción"} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Fechas</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow icon={CalendarPlus} label="Creación" value={new Date(zone.createdAt).toLocaleDateString("es-MX")} />
              <DetailRow icon={CalendarClock} label="Actualización" value={new Date(zone.updatedAt).toLocaleDateString("es-MX")} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(zone)}><Trash2 className="mr-1.5 size-4" />Eliminar</Button>}
            {onEdit && <Button size="sm" onClick={() => onEdit(zone)}><Pencil className="mr-1.5 size-4" />Editar</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
