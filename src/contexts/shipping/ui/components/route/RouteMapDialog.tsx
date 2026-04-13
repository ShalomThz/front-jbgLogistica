import { MapPinned, Navigation, Clock } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Separator,
} from "@contexts/shared/shadcn";
import { RouteMap } from "./RouteMap";
import type { RoutePrimitives, RouteStatus } from "../../../domain/schemas/route/RouteDelivery";

const STATUS_LABELS: Record<RouteStatus, string> = {
  PLANNED: "Planeada",
  ACTIVE: "Activa",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STOP_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  DELIVERED: "Entregada",
  FAILED: "Fallida",
  RETURNED: "Devuelta",
};

const STOP_STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  PENDING: "secondary",
  DELIVERED: "default",
  FAILED: "outline",
  RETURNED: "outline",
};

interface RouteMapDialogProps {
  open: boolean;
  onClose: () => void;
  route: RoutePrimitives | null;
}

export const RouteMapDialog = ({ open, onClose, route }: RouteMapDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex h-[85vh] max-w-5xl flex-col gap-0 p-0">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="size-5 text-primary" />
            Mapa de ruta
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {route?.mapsMetadata ? (
                <>
                  <span className="flex items-center gap-1.5">
                    <MapPinned className="size-4" />
                    {route.mapsMetadata.distanceKm.toFixed(1)} km
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="size-4" />
                    {Math.round(route.mapsMetadata.durationMinutes)} min estimados
                  </span>
                  <span>{route.stops.length} paradas</span>
                </>
              ) : (
                <span>Optimiza la ruta para ver distancia y tiempo estimados.</span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Map area — takes remaining vertical space */}
        <div className="relative min-h-0 flex-1">
          {!route?.mapsMetadata ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <MapPinned className="size-10 opacity-40" />
              <p className="text-sm">
                Optimiza la ruta primero para ver el trazado en el mapa.
              </p>
            </div>
          ) : (
            <RouteMap route={route} />
          )}
        </div>

        <Separator />

        {/* Stops list — scrollable, max 200px */}
        {route && route.stops.length > 0 && (
          <div className="shrink-0 overflow-y-auto px-6 py-4" style={{ maxHeight: 200 }}>
            <p className="mb-3 text-sm font-medium">
              Paradas ({route.stops.length})
            </p>
            <div className="space-y-2">
              {route.stops
                .slice()
                .sort((a, b) => a.stopOrder - b.stopOrder)
                .map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 rounded-xl border p-2.5 text-sm"
                  >
                    <span className="shrink-0 font-mono text-xs font-semibold text-muted-foreground">
                      #{stop.stopOrder}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {stop.address.address1}, {stop.address.city}
                    </span>
                    <Badge variant={STOP_STATUS_VARIANT[stop.status]}>
                      {STOP_STATUS_LABELS[stop.status]}
                    </Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Footer close button */}
        <div className="shrink-0 border-t px-6 py-3">
          <Button variant="outline" onClick={onClose} className="w-full">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
