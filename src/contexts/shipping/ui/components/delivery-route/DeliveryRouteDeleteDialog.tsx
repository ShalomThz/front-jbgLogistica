import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { AlertTriangle } from "lucide-react";
import type { RoutePrimitives } from "../../../domain/schemas/route/Route";

interface Props {
  route: RoutePrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isCancelling?: boolean;
}

export const DeliveryRouteDeleteDialog = ({
  route,
  open,
  onClose,
  onConfirm,
  isCancelling = false,
}: Props) => {
  if (!route) return null;

  const shortId = route.id.slice(0, 8).toUpperCase();
  const pendingStops = route.stops.filter((s) => s.status === "PENDING").length;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="size-5 text-destructive" />
            Cancelar ruta
          </DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                ¿Cancelar la ruta{" "}
                <span className="font-mono font-medium">#{shortId}</span>?
              </p>
              {pendingStops > 0 && (
                <p className="text-destructive">
                  {pendingStops} parada{pendingStops !== 1 ? "s" : ""} pendiente
                  {pendingStops !== 1 ? "s" : ""} volverán al estado anterior.
                  Esta acción no se puede deshacer.
                </p>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCancelling}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isCancelling}
          >
            {isCancelling ? "Cancelando…" : "Sí, cancelar ruta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
