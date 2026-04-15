import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@contexts/shared/shadcn";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";

interface Props {
  driver: DriverListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DriverDeleteDialog = ({ driver, open, onClose, onConfirm }: Props) => {
  if (!driver) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar conductor</DialogTitle>
          <DialogDescription>
            ¿Eliminar al conductor{" "}
            <span className="font-medium">{driver.user.name}</span> con licencia{" "}
            <span className="font-medium">{driver.licenseNumber}</span>? Esta acción no se puede
            deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Eliminar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
