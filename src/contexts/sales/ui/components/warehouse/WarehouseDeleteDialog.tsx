import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@contexts/shared/shadcn";
import type { WarehousePackagePrimitives } from "../../../domain/schemas/warehouse-package/WarehousePackageSchema";

interface Props {
  pkg: WarehousePackagePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const WarehouseDeleteDialog = ({ pkg, open, onClose, onConfirm }: Props) => {
  if (!pkg) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar paquete</DialogTitle>
          <DialogDescription>
            ¿Eliminar el paquete <span className="font-medium">{pkg.id.slice(0, 8)}</span> con factura{" "}
            <span className="font-medium">{pkg.officialInvoice}</span>? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm}>Eliminar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
