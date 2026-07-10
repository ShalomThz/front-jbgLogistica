import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { Trash2 } from "lucide-react";
import type { RoutePrimitives } from "../../../domain/schemas/route/Route";

interface Props {
  route: RoutePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}

export const DeliveryRoutePermanentDeleteDialog = ({
  route,
  open,
  onClose,
  onConfirm,
  isDeleting = false,
}: Props) => {
  if (!route) return null;

  const shortId = route.id.slice(0, 8).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="size-5 text-destructive" />
            Eliminar ruta permanentemente
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                ¿Eliminar la ruta{" "}
                <span className="font-mono font-medium">#{shortId}</span>?
              </p>
              <p className="text-destructive">
                Esta acción borra el registro por completo y no se puede
                deshacer. A diferencia de cancelar, no queda ningún historial
                de esta ruta.
              </p>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Eliminando…" : "Sí, eliminar permanentemente"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
