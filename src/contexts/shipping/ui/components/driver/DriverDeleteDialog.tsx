import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { DriverPrimitives } from "../../../domain";

interface Props {
  driver: DriverPrimitives | null;
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
            ¿Eliminar el conductor <span className="font-medium">{driver.id}</span> con licencia{" "}
            <span className="font-medium">{driver.licenseNumber}</span>? Esta acción no se puede deshacer.
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
