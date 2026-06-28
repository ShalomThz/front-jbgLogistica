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
            ¿Seguro que deseas cancelar el envío? Si ya tiene guía generada, se
            cancelará con la paquetería. Esta acción no se puede deshacer.
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
