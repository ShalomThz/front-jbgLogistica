import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import type { StoreListViewPrimitives } from "@contexts/iam/domain/schemas/store/StoreListView";

interface Props {
  store: StoreListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const StoreDeleteDialog = ({
  store,
  open,
  onClose,
  onConfirm,
  isLoading,
}: Props) => {
  if (!store) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar tienda</DialogTitle>
          <DialogDescription>
            ¿Eliminar "{store.name}"? Esta acción no se puede deshacer.
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
