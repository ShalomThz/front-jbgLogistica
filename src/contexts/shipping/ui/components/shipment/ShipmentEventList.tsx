import { useMedia } from "@contexts/shared/infrastructure/hooks/media/useMedia";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  TONE_EVENT,
  TONE_TEXT,
  type StatusTone,
} from "@contexts/shared/domain/schemas/StatusTone";
import { SHIPPING_MODE_LABELS } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";
import type { ShippingMode } from "@contexts/shipping/domain/schemas/shipment/ShippingModes";
import {
  AGENT_TONE,
  toneForStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  ACTOR_LABELS,
  type ShipmentTrackingEventPrimitives,
} from "@contexts/shipping/domain/schemas/tracking/ShipmentTrackingEvent";
import { MapPin, TriangleAlert, UserRound } from "lucide-react";

interface Props {
  events: readonly ShipmentTrackingEventPrimitives[];
  emptyText: string;
  /** El tono de la orden, el mismo de la línea de tiempo. */
  tone: StatusTone;
  /** Si es la etapa donde está la orden. En una ya pasada ningún evento es
   * "el de ahora", así que van todos atenuados. */
  isCurrentStage: boolean;
}

/**
 * Los eventos de una etapa, del más reciente al más viejo: lo que la guía pide
 * poder consultar "al abrir una etapa" — eventos internos, fotos, ubicaciones y
 * responsables (§1).
 *
 * Llevan el color de la orden con la misma jerarquía que la línea: el más
 * reciente resaltado, los anteriores atenuados. Una incidencia va siempre en
 * rojo, sea del tono que sea la orden.
 */
export const ShipmentEventList = ({
  events,
  emptyText,
  tone,
  isCurrentStage,
}: Props) => {
  if (events.length === 0) {
    return <p className="py-3 text-center text-xs text-muted-foreground">{emptyText}</p>;
  }

  const newestFirst = [...events].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );

  return (
    <ol className="space-y-2">
      {newestFirst.map((event, index) => {
        // Una incidencia en rojo; lo del agente en su color; el resto, el de
        // la orden.
        const palette =
          TONE_EVENT[
            event.incident ? "stopped" : toneForStage(event.stage, tone)
          ];
        return (
          <ShipmentEventItem
            key={event.id}
            event={event}
            accent={
              isCurrentStage && index === 0 ? palette.latest : palette.earlier
            }
          />
        );
      })}
    </ol>
  );
};

const readString = (
  metadata: Record<string, unknown> | null,
  key: string,
): string | null => {
  const value = metadata?.[key];
  return typeof value === "string" && value ? value : null;
};

const ShipmentEventItem = ({
  event,
  accent,
}: {
  event: ShipmentTrackingEventPrimitives;
  accent: string;
}) => {
  const signaturePath = readString(event.metadata, "signaturePath");
  const recipientName = readString(event.metadata, "recipientName");
  const transportMode = readString(event.metadata, "transportMode");
  const consolidationRef = readString(event.metadata, "consolidationRef");

  const { data: signature } = useMedia(signaturePath);

  return (
    <li
      className={cn(
        "space-y-1.5 rounded-md border border-l-4 bg-background p-3 text-sm",
        accent,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
        <p
          className={cn(
            "flex items-center gap-1.5 font-medium",
            event.incident && TONE_TEXT.stopped,
          )}
        >
          {event.incident && <TriangleAlert className="size-3.5" />}
          {event.description}
        </p>
        <span className="text-xs text-muted-foreground">
          {new Date(event.occurredAt).toLocaleString("es-MX", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span
          className={cn(
            "flex items-center gap-1",
            event.actorType === "AGENT" && cn("font-medium", TONE_TEXT[AGENT_TONE]),
          )}
        >
          <UserRound className="size-3" />
          {ACTOR_LABELS[event.actorType]}
        </span>
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="size-3" />
            {event.location.name} — {event.location.city}, {event.location.state}
          </span>
        )}
        {transportMode && (
          <span>
            Salida {SHIPPING_MODE_LABELS[transportMode as ShippingMode]?.toLowerCase() ?? transportMode}
          </span>
        )}
        {consolidationRef && <span>Consolidado {consolidationRef}</span>}
        {recipientName && <span>Recibió: {recipientName}</span>}
      </div>

      {event.notes && <p className="text-xs">{event.notes}</p>}

      {(event.photoPaths.length > 0 || signaturePath) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {event.photoPaths.map((path, index) => (
            <EvidencePhoto
              key={path}
              path={path}
              alt={`Evidencia ${index + 1}: ${event.description}`}
            />
          ))}
          {signature?.url && (
            <img
              src={signature.url}
              alt="Firma"
              className="h-20 w-auto rounded border bg-white object-contain px-2"
            />
          )}
        </div>
      )}
    </li>
  );
};

/** Una foto del evento; se abre en grande en otra pestaña. */
const EvidencePhoto = ({ path, alt }: { path: string; alt: string }) => {
  const { data: photo } = useMedia(path);
  if (!photo?.url) return null;
  return (
    <a href={photo.url} target="_blank" rel="noreferrer">
      <img
        src={photo.url}
        alt={alt}
        className="h-20 w-auto rounded border object-cover"
      />
    </a>
  );
};
