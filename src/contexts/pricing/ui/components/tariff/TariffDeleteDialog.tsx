import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { TariffPrimitives } from "../../../domain";

interface Props {
  tariff: TariffPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const TariffDeleteDialog = ({ tariff, open, onClose, onConfirm, isLoading }: Props) => {
  if (!tariff) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar tarifa</DialogTitle>
          <DialogDescription>¿Eliminar esta tarifa? Esta acción no se puede deshacer.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>{isLoading ? "Eliminando..." : "Eliminar"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
