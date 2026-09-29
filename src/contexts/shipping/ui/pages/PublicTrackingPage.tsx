import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Ban,
  MapPin,
  PackageSearch,
  PackageX,
  Search,
  ShieldCheck,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  TONE_CALLOUT,
  TONE_EVENT,
  TONE_TEXT,
  type StatusTone,
} from "@contexts/shared/domain/schemas/StatusTone";
import type {
  PublicTrackingEvent,
  TrackingSummary,
} from "../../application/tracking/TrackingTimelineResponse";
import {
  AGENT_TONE,
  INCIDENT_LABELS,
  STAGE_LABELS,
  toneForStage,
  type ShipmentStage,
} from "../../domain/schemas/shipment/ShipmentStages";
import {
  SHIPMENT_STATUS_TONE,
  shipmentStatuses,
  type ShipmentStatus,
} from "../../domain/schemas/shipment/ShipmentStatuses";
import { ACTOR_LABELS } from "../../domain/schemas/tracking/ShipmentTrackingEvent";
import { timelineStages } from "../../domain/services/timelineStages";
import { useTrackingTimeline } from "../../infrastructure/hooks/tracking/useTrackingTimeline";
import {
  ShipmentStageTimeline,
  type StageCaption,
} from "../components/shipment/ShipmentStageTimeline";

const CARRIER_TYPE_LABELS: Record<string, string> = {
  INTERNAL_FLEET: "JBG Logistics",
  THIRD_PARTY: "Paquetería",
};

const isShipmentStatus = (status: string): status is ShipmentStatus =>
  (shipmentStatuses as readonly string[]).includes(status);

/** El mismo tono que ve la oficina, con la incidencia por encima. */
function summaryTone(summary: TrackingSummary): StatusTone {
  if (summary.incident) return "stopped";
  return isShipmentStatus(summary.status)
    ? SHIPMENT_STATUS_TONE[summary.status]
    : "transit";
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * El rastreo que ve el cliente (guía operativa, §1): una línea sencilla con las
 * etapas y, al tocar una, lo que pasó en ella.
 *
 * El back ya manda cada evento recortado —sin responsable, GPS, archivos ni
 * observaciones internas—, así que acá no hay nada que esconder: se muestra lo
 * que llega.
 */
export const PublicTrackingPage = () => {
  const navigate = useNavigate();
  const { trackingNumber = "" } = useParams();
  const [searchValue, setSearchValue] = useState(trackingNumber);
  const [focused, setFocused] = useState<ShipmentStage | null>(null);
  const { data, isLoading } = useTrackingTimeline(trackingNumber);
  const summary = data?.summary ?? null;
  const events = data?.events ?? [];

  const handleSearch = () => {
    const nextValue = searchValue.trim();
    if (!nextValue) return;
    setFocused(null);
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
                Sigue tu envío
              </CardTitle>
              <CardDescription className="max-w-2xl text-sm">
                Ingresa tu número de guía para ver en qué etapa está tu paquete
                y todo lo que ha pasado con él.
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
          <TrackingResult
            summary={summary}
            events={events}
            focused={focused ?? summary.stage}
            onFocus={setFocused}
          />
        )}
      </div>
    </div>
  );
};

const TrackingResult = ({
  summary,
  events,
  focused,
  onFocus,
}: {
  summary: TrackingSummary;
  events: readonly PublicTrackingEvent[];
  focused: ShipmentStage | null;
  onFocus: (stage: ShipmentStage) => void;
}) => {
  const tone = summaryTone(summary);
  const stages = timelineStages(
    {
      hasAgentStage: events.some((e) => e.stage === "AGENT"),
      viaCarrier: summary.carrier?.type === "THIRD_PARTY",
    },
    summary.stage,
  );

  const captions: Partial<Record<ShipmentStage, StageCaption>> = {};
  for (const event of events) {
    if (!event.stage || event.incident) continue;
    const previous = captions[event.stage];
    if (!previous || event.occurredAt > previous.occurredAt) {
      captions[event.stage] = {
        label: event.description,
        occurredAt: event.occurredAt,
      };
    }
  }

  const focusedEvents = events
    .filter((e) => e.stage === focused)
    .sort(
      (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
    );

  const cut =
    summary.status === "CANCELLED"
      ? { icon: Ban, text: "Envío cancelado" }
      : summary.status === "RETURNED"
        ? { icon: Undo2, text: "Devuelto al remitente" }
        : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">N° de guía</p>
            <p className="mt-2 font-semibold break-all">{summary.trackingNumber}</p>
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
            <p className={cn("mt-2 font-semibold", TONE_TEXT[tone])}>
              {cut?.text ?? (summary.stage ? STAGE_LABELS[summary.stage] : "Registrado")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Transportista</p>
            <p className="mt-2 font-semibold">
              {summary.carrier
                ? summary.carrier.type === "THIRD_PARTY"
                  ? summary.carrier.providerName
                  : CARRIER_TYPE_LABELS[summary.carrier.type]
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
          <CardContent className="flex flex-wrap items-center gap-3 p-5 text-sm">
            <MapPin className="size-4 text-primary" />
            <span>
              {summary.origin.city || "Origen"}, {summary.origin.province}
            </span>
            <span className="text-muted-foreground">→</span>
            <span>
              {summary.destination.name} — {summary.destination.city},{" "}
              {summary.destination.province}
            </span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Línea de tiempo</CardTitle>
          <CardDescription>
            Toca una etapa para ver todo lo que pasó en ella.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ShipmentStageTimeline
            stages={stages}
            current={summary.stage}
            tone={tone}
            hasIncident={!!summary.incident}
            captions={captions}
            focused={focused}
            onFocus={onFocus}
          />

          {cut ? (
            <p
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium",
                TONE_CALLOUT.stopped,
              )}
            >
              <cut.icon className="size-4" />
              {cut.text}
            </p>
          ) : (
            summary.incident && (
              <p
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium",
                  TONE_CALLOUT.stopped,
                )}
              >
                <TriangleAlert className="size-4" />
                {INCIDENT_LABELS[summary.incident]}
              </p>
            )
          )}

          {focused && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-semibold">{STAGE_LABELS[focused]}</h3>
              {focusedEvents.length === 0 ? (
                <p className="py-3 text-sm text-muted-foreground">
                  Todavía no hay movimientos en esta etapa.
                </p>
              ) : (
                <ol className="space-y-2">
                  {focusedEvents.map((event, index) => (
                    <li
                      key={event.id}
                      // Misma jerarquía que la línea: el último evento de la
                      // etapa actual resaltado, el resto atenuado.
                      className={cn(
                        "rounded-xl border border-l-4 p-4",
                        TONE_EVENT[
                          event.incident
                            ? "stopped"
                            : toneForStage(event.stage, tone)
                        ][
                          index === 0 && focused === summary.stage
                            ? "latest"
                            : "earlier"
                        ],
                      )}
                    >
                      <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between">
                        <p
                          className={cn(
                            "flex items-center gap-1.5 font-medium",
                            event.incident && TONE_TEXT.stopped,
                          )}
                        >
                          {event.incident && <TriangleAlert className="size-4" />}
                          {event.description}
                        </p>
                        <span className="text-sm text-muted-foreground">
                          {formatDateTime(event.occurredAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="size-3" />
                            {event.location.name} — {event.location.city},{" "}
                            {event.location.state}
                          </span>
                        )}
                        <span
                          className={cn(
                            event.actorType === "AGENT" &&
                              cn("font-medium", TONE_TEXT[AGENT_TONE]),
                          )}
                        >
                          {ACTOR_LABELS[event.actorType]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
