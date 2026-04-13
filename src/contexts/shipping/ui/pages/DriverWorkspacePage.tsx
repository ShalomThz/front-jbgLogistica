import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Camera,
  CheckCircle2,
  Clock3,
  Crosshair,
  MapPinned,
  Navigation,
  PackageCheck,
  RefreshCw,
  Route,
  Truck,
  XCircle,
} from "lucide-react";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { parseApiError } from "@contexts/shared/infrastructure/http/parseApiError";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Progress,
  Textarea,
} from "@contexts/shared/shadcn";
import { useDriverActiveRoute, useRouteActions } from "../../infrastructure/hooks/routes/useRoutes";
import type { RouteStopPrimitives } from "../../domain/schemas/route/RouteStop";
import type { DeliveryOutcome } from "../../domain/schemas/route/DeliveryAttempt";

const STOP_VARIANT = {
  PENDING: "secondary",
  DELIVERED: "default",
  FAILED: "outline",
  RETURNED: "outline",
} as const;

/**
 * Builds a Google Maps directions URL in drive mode.
 * Uses pending stops ordered by stopOrder as waypoints.
 * Origin comes from route.origin (lat/lng).
 * If only one pending stop exists, it becomes the destination with no waypoints.
 */
const buildGoogleMapsUrl = (
  route: import("../../domain/schemas/route/RouteDelivery").RoutePrimitives,
): string => {
  const pendingStops = route.stops
    .filter((stop) => stop.status === "PENDING")
    .sort((a, b) => a.stopOrder - b.stopOrder);

  if (pendingStops.length === 0) return "";

  const origin = `${route.origin.latitude},${route.origin.longitude}`;

  const lastStop = pendingStops[pendingStops.length - 1];
  const intermediateStops = pendingStops.slice(0, -1);

  const toAddrString = (
    stop: import("../../domain/schemas/route/RouteStop").RouteStopPrimitives,
  ) =>
    `${stop.address.address1}, ${stop.address.city}, ${stop.address.province}, ${stop.address.country}`;

  const params = new URLSearchParams({
    api: "1",
    origin,
    destination: toAddrString(lastStop),
    travelmode: "driving",
  });

  if (intermediateStops.length > 0) {
    params.set("waypoints", intermediateStops.map(toAddrString).join("|"));
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
};

export const DriverWorkspacePage = () => {
  const { user } = useAuth();
  const { data: route, isLoading, refetch } = useDriverActiveRoute();
  const {
    startRoute,
    isStartingRoute,
    recordDeliveryAttempt,
    isRecordingDeliveryAttempt,
    completeRoute,
    isCompletingRoute,
  } = useRouteActions();

  const [selectedStop, setSelectedStop] = useState<RouteStopPrimitives | null>(null);
  const [outcome, setOutcome] = useState<DeliveryOutcome>("DELIVERED");
  const [reason, setReason] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [locationHint, setLocationHint] = useState("");

  useEffect(() => {
    if (!route) return;
    const firstPendingStop =
      route.stops.find((stop) => stop.status === "PENDING") ?? null;
    setSelectedStop(firstPendingStop);
  }, [route]);

  const deliveredCount =
    route?.stops.filter((stop) => stop.status === "DELIVERED").length ?? 0;
  const terminalCount =
    route?.stops.filter(
      (stop) => stop.status === "DELIVERED" || stop.status === "RETURNED",
    ).length ?? 0;
  const canComplete =
    !!route &&
    route.status === "ACTIVE" &&
    route.stops.every(
      (stop) => stop.status === "DELIVERED" || stop.status === "RETURNED",
    );

  const currentStop = useMemo(() => {
    if (!route) return null;
    return route.stops.find((stop) => stop.id === selectedStop?.id) ?? null;
  }, [route, selectedStop?.id]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationHint("Tu navegador no soporta geolocalización.");
      return;
    }

    setLocationHint("Buscando tu ubicación...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLat(String(position.coords.latitude));
        setGpsLng(String(position.coords.longitude));
        setLocationHint("Ubicación capturada.");
      },
      () => {
        setLocationHint("No pudimos obtener tu ubicación. Puedes capturarla manualmente.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const resetAttemptForm = () => {
    setReason("");
    setPhoto(null);
    setGpsLat("");
    setGpsLng("");
    setLocationHint("");
  };

  const handleStartRoute = async () => {
    if (!route) return;

    try {
      await startRoute(route.id);
      toast.success("Ruta iniciada.");
      await refetch();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleCompleteRoute = async () => {
    if (!route) return;

    try {
      await completeRoute(route.id);
      toast.success("Ruta completada.");
      await refetch();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleSubmitAttempt = async () => {
    if (!route || !currentStop || !photo) {
      toast.error("Adjunta una foto antes de registrar el intento.");
      return;
    }

    if (!gpsLat || !gpsLng) {
      toast.error("Necesitamos la ubicación GPS del intento.");
      return;
    }

    try {
      await recordDeliveryAttempt({
        routeId: route.id,
        stopId: currentStop.id,
        outcome,
        photo,
        gpsLat: Number(gpsLat),
        gpsLng: Number(gpsLng),
        clientTimestamp: new Date().toISOString(),
        reason: outcome === "FAILED" ? reason.trim() || undefined : undefined,
      });

      toast.success(
        outcome === "DELIVERED"
          ? "Entrega registrada."
          : "Intento fallido registrado.",
      );
      resetAttemptForm();
      setSelectedStop(null);
      await refetch();
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  if (isLoading) {
    return <PageLoader text="Cargando tu ruta..." />;
  }

  if (!route) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Mi ruta
          </h1>
          <p className="text-sm text-muted-foreground">
            Hola {user?.name ?? "equipo"}, aquí aparecerá tu ruta activa en
            cuanto tengas una asignación en curso.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <Route className="size-10 text-primary" />
            <div>
              <p className="text-lg font-medium">No tienes una ruta activa</p>
              <p className="text-sm text-muted-foreground">
                Cuando el área operativa te asigne una, la verás aquí con tus
                próximas paradas.
              </p>
            </div>
            <Button variant="outline" className="gap-2" onClick={() => refetch()}>
              <RefreshCw className="size-4" />
              Revisar de nuevo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Mi ruta
          </h1>
          <p className="text-sm text-muted-foreground">
            Ruta {route.id}. Marca cada entrega con evidencia fotográfica y
            ubicación para mantener la trazabilidad completa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCw className="size-4" />
            Actualizar
          </Button>
          {route.stops.some((stop) => stop.status === "PENDING") && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => {
                const url = buildGoogleMapsUrl(route);
                if (url) window.open(url, "_blank", "noopener,noreferrer");
              }}
            >
              <Navigation className="size-4" />
              Navegar con Google Maps
            </Button>
          )}
          {route.status === "PLANNED" && (
            <Button className="gap-2" onClick={handleStartRoute} disabled={isStartingRoute}>
              <Truck className="size-4" />
              Iniciar ruta
            </Button>
          )}
          {canComplete && (
            <Button className="gap-2" onClick={handleCompleteRoute} disabled={isCompletingRoute}>
              <CheckCircle2 className="size-4" />
              Completar ruta
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Estado</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-2xl font-semibold">{route.status}</p>
              <Badge variant={route.status === "ACTIVE" ? "secondary" : "outline"}>
                {route.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Entregadas</p>
            <p className="mt-2 text-2xl font-semibold">
              {deliveredCount}/{route.stops.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Cobertura</p>
            <p className="mt-2 text-2xl font-semibold">
              {route.mapsMetadata
                ? `${route.mapsMetadata.distanceKm.toFixed(1)} km`
                : "Sin optimizar"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progreso de la jornada</CardTitle>
          <CardDescription>
            La ruta solo puede completarse cuando todas las paradas estén en
            estado terminal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {terminalCount} de {route.stops.length} cerradas
            </span>
            <span className="font-medium">{Math.round((terminalCount / route.stops.length) * 100)}%</span>
          </div>
          <Progress value={(terminalCount / route.stops.length) * 100} />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Paradas</CardTitle>
            <CardDescription>
              Selecciona una parada pendiente para registrar el resultado del
              intento.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {route.stops.map((stop) => (
              <div
                key={stop.id}
                className={`rounded-2xl border p-4 transition ${
                  selectedStop?.id === stop.id ? "border-primary bg-primary/5" : ""
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium">
                      #{stop.stopOrder} · {stop.shipmentId}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {stop.address.address1}, {stop.address.city}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" />
                      Intentos: {stop.attempts.length}
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2 md:items-end">
                    <Badge variant={STOP_VARIANT[stop.status]}>
                      {stop.status}
                    </Badge>
                    {route.status === "ACTIVE" && stop.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedStop(stop);
                            setOutcome("FAILED");
                            resetAttemptForm();
                          }}
                        >
                          <XCircle className="mr-1 size-4" />
                          Fallida
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedStop(stop);
                            setOutcome("DELIVERED");
                            resetAttemptForm();
                          }}
                        >
                          <PackageCheck className="mr-1 size-4" />
                          Entregada
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Resumen operativo</CardTitle>
            <CardDescription>
              Información rápida para que no tengas que abrir cada parada.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl bg-muted/40 p-4">
              <div className="flex items-center gap-2 font-medium">
                <MapPinned className="size-4 text-primary" />
                Punto de salida
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {route.origin.latitude}, {route.origin.longitude}
              </p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Conductor asignado</p>
              <p className="font-medium">{route.driverId}</p>
            </div>

            <div className="rounded-2xl border p-4">
              <p className="text-sm text-muted-foreground">Parada seleccionada</p>
              <p className="font-medium">
                {currentStop
                  ? `${currentStop.shipmentId} · ${currentStop.address.city}`
                  : "Elige una parada pendiente"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!currentStop} onOpenChange={(open) => !open && setSelectedStop(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Registrar intento en {currentStop?.shipmentId}
            </DialogTitle>
            <DialogDescription>
              Adjunta evidencia, registra ubicación y confirma si la entrega fue
              exitosa o fallida.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={outcome === "DELIVERED" ? "default" : "outline"}
                onClick={() => setOutcome("DELIVERED")}
              >
                Entregada
              </Button>
              <Button
                variant={outcome === "FAILED" ? "default" : "outline"}
                onClick={() => setOutcome("FAILED")}
              >
                Fallida
              </Button>
            </div>

            {outcome === "FAILED" && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Motivo</p>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Ej. cliente ausente, dirección cerrada, acceso restringido"
                />
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">Evidencia fotográfica</p>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed p-4 text-sm text-muted-foreground">
                <Camera className="size-4" />
                {photo ? photo.name : "Seleccionar foto"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    setPhoto(event.target.files?.[0] ?? null)
                  }
                />
              </label>
            </div>

            <div className="space-y-3 rounded-2xl bg-muted/40 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Ubicación GPS</p>
                  <p className="text-xs text-muted-foreground">{locationHint || "Captura automática recomendada."}</p>
                </div>
                <Button variant="outline" size="sm" onClick={requestLocation}>
                  <Crosshair className="mr-1 size-4" />
                  Usar mi ubicación
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  value={gpsLat}
                  onChange={(event) => setGpsLat(event.target.value)}
                  placeholder="Latitud"
                />
                <Input
                  value={gpsLng}
                  onChange={(event) => setGpsLng(event.target.value)}
                  placeholder="Longitud"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedStop(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitAttempt} disabled={isRecordingDeliveryAttempt}>
              Guardar intento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
