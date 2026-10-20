import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const CancelShipmentDialog = ({
  open,
  onClose,
  onConfirm,
  isLoading,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cancelar envío</DialogTitle>
          <DialogDescription>
            Se cancela el envío y también la orden. Si lo lleva una paquetería
            y ya tiene guía, se cancela con ella. No se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Cancelando..." : "Sí, cancelar envío"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
