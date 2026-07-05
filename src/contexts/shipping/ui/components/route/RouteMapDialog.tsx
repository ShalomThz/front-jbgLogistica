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
import { useHQSettings } from "@contexts/settings/infrastructure/hooks/useSkydropxSettings";
import {
  Clock,
  ExternalLink,
  Loader2,
  MapPinned,
  Navigation,
  Warehouse,
  Zap,
} from "lucide-react";
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

interface WarehouseAddressLike {
  name: string;
  address: {
    address1: string;
    city: string;
    geolocation: { latitude: number; longitude: number; placeId: string | null };
  };
}

/** The route only stores the origin coordinates; recover the warehouse it points to */
function matchWarehouse(
  origin: RoutePrimitives["origin"],
  warehouses: WarehouseAddressLike[],
): WarehouseAddressLike | undefined {
  return warehouses.find((w) => {
    const geo = w.address.geolocation;
    if (origin.placeId && geo.placeId === origin.placeId) return true;
    return (
      Math.abs(geo.latitude - origin.latitude) < 1e-4 &&
      Math.abs(geo.longitude - origin.longitude) < 1e-4
    );
  });
}

interface RouteMapDialogProps {
  open: boolean;
  onClose: () => void;
  route: RoutePrimitives | null;
  /** Shown on unoptimized PLANNED routes; optimizing swaps the list for the map */
  onOptimize?: () => void;
  isOptimizing?: boolean;
}

export const RouteMapDialog = ({
  open,
  onClose,
  route,
  onOptimize,
  isOptimizing = false,
}: RouteMapDialogProps) => {
  const { skydropxAddresses } = useHQSettings();

  const isOptimized = !!route?.mapsMetadata;
  const orderedStops = route
    ? [...route.stops].sort((a, b) => a.stopOrder - b.stopOrder)
    : [];
  const warehouse = route
    ? matchWarehouse(route.origin, skydropxAddresses)
    : undefined;
  const canOptimize =
    !!onOptimize && route?.status === "PLANNED" && orderedStops.length > 0;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="flex max-h-[85vh] max-w-7xl flex-col gap-0 overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Navigation className="size-5 text-primary" />
            Mapa de ruta
          </DialogTitle>
          <DialogDescription asChild>
            <div className="flex flex-wrap items-center gap-4 text-sm">
                {route && isOptimized && (
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
                </>
              ) : (
                <span>
                  {route?.stops.length
                    ? "Ruta sin optimizar — optimízala para ver el trazado en el mapa."
                    : "Agrega paradas para trazar la ruta."}
                </span>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Map — only when the route was optimized; otherwise a prompt to optimize */}
        {isOptimized && route ? (
          <div className="relative h-[45vh] min-h-[320px] shrink-0">
            <RouteMap route={route} />
          </div>
        ) : (
          <div className="flex shrink-0 flex-col items-center justify-center gap-3 px-6 py-10 text-center">
            <MapPinned className="size-10 text-muted-foreground opacity-40" />
            <div>
              <p className="text-sm font-medium">Ruta sin optimizar</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {canOptimize
                  ? "Optimiza la ruta para calcular el mejor orden de las paradas y ver el recorrido en el mapa."
                  : "El mapa se muestra cuando la ruta ha sido optimizada."}
              </p>
            </div>
            {canOptimize && (
              <Button onClick={onOptimize} disabled={isOptimizing} className="gap-1.5">
                {isOptimizing ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Zap className="size-4" />
                )}
                {isOptimizing ? "Optimizando…" : "Optimizar"}
              </Button>
            )}
          </div>
        )}

        <Separator />

        {/* Itinerary — warehouse origin first, then the stops in route order */}
        {route && (
          <div className="shrink-0 overflow-y-auto px-6 py-4" style={{ maxHeight: 240 }}>
            <p className="mb-3 text-sm font-medium">
              Itinerario ({orderedStops.length}{" "}
              {orderedStops.length === 1 ? "parada" : "paradas"})
            </p>
            <div className="space-y-2">
              {/* Origin — the departure warehouse */}
              <div className="flex items-center gap-3 rounded-xl border bg-muted/40 p-2.5 text-sm">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
                  <Warehouse className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1 truncate">
                  {warehouse
                    ? `${warehouse.name} — ${warehouse.address.address1}, ${warehouse.address.city}`
                    : `Origen (${route.origin.latitude.toFixed(5)}, ${route.origin.longitude.toFixed(5)})`}
                </span>
                <Badge variant="outline">Salida</Badge>
              </div>

              {orderedStops.map((stop) => (
                <div
                  key={stop.id}
                  className="flex items-center gap-3 rounded-xl border p-2.5 text-sm"
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-semibold text-primary">
                    {stop.stopOrder}
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
      </DialogContent>
    </Dialog>
  );
};
