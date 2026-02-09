import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { ZonePrimitives } from "../../../domain";

interface Props {
  zone: ZonePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const ZoneDeleteDialog = ({ zone, open, onClose, onConfirm, isLoading }: Props) => {
  if (!zone) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar zona</DialogTitle>
          <DialogDescription>¿Eliminar "{zone.name}"? Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>{isLoading ? "Eliminando..." : "Eliminar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
