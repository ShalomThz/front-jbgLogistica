import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { Clock, ExternalLink, MapPinned, Navigation } from "lucide-react";
import type { RoutePrimitives } from "../../../domain/schemas/route/Route";
import { RouteMap } from "./RouteMap";

/**
 * Deep link to Google Maps directions following the current stop order as a
 * round trip: origin → stops → back to origin (matches the optimizer). Works
 * without any API key and opens turn-by-turn navigation on mobile.
 */
function buildGoogleMapsUrl(route: RoutePrimitives): string {
  const coord = (lat: number, lng: number) => `${lat},${lng}`;
  const origin = coord(route.origin.latitude, route.origin.longitude);

  const stops = [...route.stops].sort((a, b) => a.stopOrder - b.stopOrder);
  if (stops.length === 0) {
    return `https://www.google.com/maps/search/?api=1&query=${origin}`;
  }

  const waypoints = stops
    .map((s) =>
      coord(s.address.geolocation.latitude, s.address.geolocation.longitude),
    )
    .join("|");

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: origin,
    waypoints,
    travelmode: "driving",
  });

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}


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
                <span>
                  {route?.stops.length
                    ? "Ruta sin optimizar — se muestra el orden actual de paradas."
                    : "Agrega paradas para trazar la ruta."}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Map area — takes remaining vertical space. Leaflet/OSM renders the
            stops even without optimizing; the optimized polyline appears when
            mapsMetadata exists. */}
        <div className="relative min-h-0 flex-1">
          {route ? (
            <>
              <RouteMap route={route} />
              {!route.mapsMetadata && route.stops.length > 0 && (
                <div className="pointer-events-none absolute left-1/2 top-3 z-[1000] -translate-x-1/2 rounded-full border border-amber-300 bg-amber-50/95 px-3 py-1 text-xs font-medium text-amber-700 shadow-sm">
                  Sin optimizar — trazado en línea recta
                </div>
              )}
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground">
              <MapPinned className="size-10 opacity-40" />
              <p className="text-sm">Selecciona una ruta para ver el mapa.</p>
            </div>
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

        {/* Footer — open in Google Maps (no API key needed) + close */}
        <div className="flex shrink-0 gap-2 border-t px-6 py-3">
          {route && (
            <Button asChild variant="default" className="flex-1 gap-1.5">
              <a
                href={buildGoogleMapsUrl(route)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="size-4" />
                Abrir en Google Maps
              </a>
            </Button>
          )}
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
