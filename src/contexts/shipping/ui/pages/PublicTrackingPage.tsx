import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  MapPin,
  PackageSearch,
  PackageX,
  Search,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@contexts/shared/shadcn";
import { useTrackingTimeline } from "../../infrastructure/hooks/tracking/useTrackingTimeline";

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Registrado",
  EMPTY_BOX_PENDING: "Caja vacía pendiente de entrega",
  AWAITING_PICKUP: "Pendiente de recolección",
  AT_WAREHOUSE: "En bodega",
  PROVIDER_SELECTED: "Preparando envío",
  FULFILLED: "Guía generada",
  IN_ROUTE: "En tránsito",
  DELIVERED: "Entregado",
  FAILED_ATTEMPT: "Intento de entrega fallido",
  RETURNED: "En devolución",
  CANCELLED: "Cancelado",
};

const CARRIER_TYPE_LABELS: Record<string, string> = {
  INTERNAL_FLEET: "Flota interna JBG",
  THIRD_PARTY: "Tercero",
};

export const PublicTrackingPage = () => {
  const navigate = useNavigate();
  const { trackingNumber = "" } = useParams();
  const [searchValue, setSearchValue] = useState(trackingNumber);
  const { data, isLoading } = useTrackingTimeline(trackingNumber);
  const summary = data?.summary ?? null;

  const sortedEvents = useMemo(
    () =>
      [...(data?.events ?? [])].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      ),
    [data],
  );

  const handleSearch = () => {
    const nextValue = searchValue.trim();
    if (!nextValue) return;
    navigate(`/tracking/${encodeURIComponent(nextValue)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-10 md:px-6">
        <Card className="border-primary/15 bg-background/90 backdrop-blur">
          <CardHeader className="space-y-4">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-primary" />
              Rastreo público de paquetes
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl font-semibold tracking-tight">
                Sigue tu envío en tiempo real
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Ingresa tu tracking number para ver el historial de eventos,
                intentos de entrega y última ubicación registrada del paquete.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Ej. JBG-TRACK-001"
                className="h-12 pl-9"
              />
            </div>
            <Button onClick={handleSearch} className="h-12 gap-2 px-6">
              <PackageSearch className="size-4" />
              Rastrear
            </Button>
          </CardContent>
        </Card>

        {isLoading ? (
          <PageLoader text="Buscando información de tu envío..." />
        ) : !summary ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <PackageX className="size-10 text-destructive" />
              <div>
                <p className="text-lg font-medium">
                  No encontramos ningún envío con ese número de rastreo
                </p>
                <p className="text-sm text-muted-foreground">
                  Verifica que el número de guía esté escrito correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">N° de guía</p>
                  <p className="mt-2 font-semibold">{summary.trackingNumber}</p>
                  {summary.orderNumber && (
                    <p className="text-xs text-muted-foreground">
                      Pedido {summary.orderNumber}
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <p className="mt-2 font-semibold">
                    {STATUS_LABELS[summary.status] ?? summary.status}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Transportista</p>
                  <p className="mt-2 font-semibold">
                    {summary.carrier
                      ? (CARRIER_TYPE_LABELS[summary.carrier.type] ??
                        summary.carrier.providerName)
                      : "—"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Paquete</p>
                  <p className="mt-2 font-semibold">
                    {summary.parcel
                      ? `${summary.parcel.weight.value} ${summary.parcel.weight.unit}`
                      : "—"}
                  </p>
                  {summary.parcel && (
                    <p className="text-xs text-muted-foreground">
                      {summary.parcel.dimensions.length} x{" "}
                      {summary.parcel.dimensions.width} x{" "}
                      {summary.parcel.dimensions.height}{" "}
                      {summary.parcel.dimensions.unit}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {(summary.origin.city || summary.destination.city) && (
              <Card>
                <CardContent className="flex items-center gap-3 p-5 text-sm">
                  <MapPin className="size-4 text-primary" />
                  <span>
                    {summary.origin.city || "Origen"},{" "}
                    {summary.origin.province}
                  </span>
                  <span className="text-muted-foreground">→</span>
                  <span>
                    {summary.destination.name} — {summary.destination.city},{" "}
                    {summary.destination.province}
                  </span>
                </CardContent>
              </Card>
            )}

            {sortedEvents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
                  <Truck className="size-10 text-primary" />
                  <div>
                    <p className="text-lg font-medium">Aún no hay eventos registrados</p>
                    <p className="text-sm text-muted-foreground">
                      Vuelve a consultar más tarde para ver el avance de tu
                      envío.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
            <Card>
              <CardHeader>
                <CardTitle>Línea de tiempo</CardTitle>
                <CardDescription>
                  Mostramos los eventos más recientes primero.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedEvents.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="rounded-full bg-primary/10 p-2 text-primary">
                        <Clock3 className="size-4" />
                      </div>
                      {index !== sortedEvents.length - 1 && (
                        <div className="mt-2 h-full w-px bg-border" />
                      )}
                    </div>
                    <div className="flex-1 rounded-2xl border p-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{event.description}</p>
                            <Badge variant="outline">
                              {STATUS_LABELS[event.statusSnapshot] ??
                                event.statusSnapshot}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {new Date(event.occurredAt).toLocaleString("es-MX")}
                          </p>
                        </div>
                        <Badge variant="secondary">{event.actorType}</Badge>
                      </div>

                      {event.gpsLocation && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="size-4" />
                          {event.gpsLocation.latitude}, {event.gpsLocation.longitude}
                        </div>
                      )}

                      {event.photoPath && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Evidencia registrada: {event.photoPath}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
