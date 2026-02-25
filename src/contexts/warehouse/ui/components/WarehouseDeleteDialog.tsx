import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { PackageListViewPrimitives } from "../../domain/WarehousePackageSchema";
 
interface Props {
  pkg: PackageListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const WarehouseDeleteDialog = ({ pkg, open, onClose, onConfirm, isLoading }: Props) => {
  if (!pkg) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar paquete</DialogTitle>
          <DialogDescription>
            ¿Eliminar el paquete{" "}
            <span className="font-medium">{pkg.id.slice(0, 8)}</span> con factura{" "}
            <span className="font-medium">{pkg.officialInvoice}</span>? Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
