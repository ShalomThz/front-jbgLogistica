import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Clock3,
  MapPin,
  PackageSearch,
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

export const PublicTrackingPage = () => {
  const navigate = useNavigate();
  const { trackingNumber = "" } = useParams();
  const [searchValue, setSearchValue] = useState(trackingNumber);
  const { data: events, isLoading } = useTrackingTimeline(trackingNumber);

  const sortedEvents = useMemo(
    () =>
      [...(events ?? [])].sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      ),
    [events],
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
          <PageLoader text="Buscando eventos de rastreo..." />
        ) : sortedEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 p-10 text-center">
              <Truck className="size-10 text-primary" />
              <div>
                <p className="text-lg font-medium">Sin eventos todavía</p>
                <p className="text-sm text-muted-foreground">
                  Verifica el número de rastreo o vuelve a intentar más tarde si
                  el envío acaba de ser generado.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Tracking</p>
                  <p className="mt-2 font-semibold">{trackingNumber}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Último estado</p>
                  <p className="mt-2 font-semibold">
                    {sortedEvents[0]?.statusSnapshot ?? "Sin estado"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm text-muted-foreground">Eventos</p>
                  <p className="mt-2 font-semibold">{sortedEvents.length}</p>
                </CardContent>
              </Card>
            </div>

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
                            <Badge variant="outline">{event.statusSnapshot}</Badge>
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
          </div>
        )}
      </div>
    </div>
  );
};
