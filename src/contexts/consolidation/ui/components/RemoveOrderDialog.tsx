import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Folio de la orden, para que se sepa cuál se quita. */
  orderLabel: string;
  onConfirm: () => void;
  isRemoving: boolean;
}

/** Confirmación antes de quitar una orden del consolidado: no hay deshacer, y
 * al volver a agregarla se capturan otra vez sus pies y su revisión. */
export const RemoveOrderDialog = ({
  open,
  onOpenChange,
  orderLabel,
  onConfirm,
  isRemoving,
}: Props) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>¿Quitar orden del consolidado?</DialogTitle>
        <DialogDescription>
          La orden <strong className="font-mono">{orderLabel}</strong> saldrá de este
          consolidado y quedará disponible para otro. Se pierden sus pies lineales, sección,
          comentario y verificación.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isRemoving}>
          Cancelar
        </Button>
        <Button variant="destructive" onClick={onConfirm} disabled={isRemoving}>
          {isRemoving ? "Quitando..." : "Quitar orden"}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);
