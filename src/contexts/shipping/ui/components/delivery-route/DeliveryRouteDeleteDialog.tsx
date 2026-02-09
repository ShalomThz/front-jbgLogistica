import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, Button } from "@/shared/shadcn";
import type { RoutePrimitives } from "../../../domain";

interface Props {
  route: RoutePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeliveryRouteDeleteDialog = ({ route, open, onClose, onConfirm }: Props) => {
  if (!route) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar ruta</DialogTitle>
          <DialogDescription>
            ¿Eliminar la ruta <span className="font-medium">{route.id}</span> con{" "}
            <span className="font-medium">{route.stops.length} paradas</span>? Esta acción no se puede deshacer.
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
