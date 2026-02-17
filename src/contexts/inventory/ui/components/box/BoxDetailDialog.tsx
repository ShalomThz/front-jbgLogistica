import { Pencil, Trash2 } from "lucide-react";
import { Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@contexts/shared/shadcn";
import type { BoxPrimitives } from "@contexts/inventory/domain/schemas/box/Box";

const UNIT_LABELS: Record<string, string> = { cm: "cm", in: "pulgadas" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { box: BoxPrimitives | null; open: boolean; onClose: () => void; onEdit?: (box: BoxPrimitives) => void; onDelete?: (box: BoxPrimitives) => void; }

export const BoxDetailDialog = ({ box, open, onClose, onEdit, onDelete }: Props) => {
  if (!box) return null;
  const dims = `${box.dimensions.length} × ${box.dimensions.width} × ${box.dimensions.height} ${UNIT_LABELS[box.dimensions.unit]}`;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle>{box.name}</DialogTitle>
          <DialogDescription>Creada el {new Date(box.createdAt).toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Dimensiones</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Largo" value={`${box.dimensions.length} ${box.dimensions.unit}`} /><DetailRow label="Ancho" value={`${box.dimensions.width} ${box.dimensions.unit}`} /><DetailRow label="Alto" value={`${box.dimensions.height} ${box.dimensions.unit}`} /><DetailRow label="Tamaño" value={dims} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Inventario</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Stock" value={String(box.stock)} /><DetailRow label="Fecha creación" value={new Date(box.createdAt).toLocaleDateString("es-MX")} /><DetailRow label="Última actualización" value={new Date(box.updatedAt).toLocaleDateString("es-MX")} /></div></div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && <Button variant="destructive" size="sm" onClick={() => onDelete(box)}><Trash2 className="mr-1.5 size-4" />Eliminar</Button>}
            {onEdit && <Button size="sm" onClick={() => onEdit(box)}><Pencil className="mr-1.5 size-4" />Editar</Button>}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
