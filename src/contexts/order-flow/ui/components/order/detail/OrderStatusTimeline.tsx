import {
  orderProgress,
  orderTimelineStages,
} from "@contexts/order-flow/domain/services/orderProgress";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { TONE_CALLOUT } from "@contexts/shared/domain/schemas/StatusTone";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  INCIDENT_LABELS,
  STAGE_LABELS,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  useShipmentTracking,
  useStageLocks,
} from "@contexts/shipping/infrastructure/hooks/shipments/useShipment";
import { ShipmentEventList } from "@contexts/shipping/ui/components/shipment/ShipmentEventList";
import {
  ShipmentStageTimeline,
  type StageCaption,
} from "@contexts/shipping/ui/components/shipment/ShipmentStageTimeline";
import { Ban, Check, TriangleAlert, Undo2 } from "lucide-react";
import { useState, type ReactNode } from "react";

/** Forma del aviso al pie; el color lo pone TONE_CALLOUT. */
const CALLOUT_CLASS =
  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-center text-xs font-medium";

interface OrderStatusTimelineProps {
  order: OrderListView;
  /** Las acciones sobre la línea (registrar evento, incidencia). */
  actions?: ReactNode;
}

/**
 * El rastreo de la orden: la línea de etapas de la guía del cliente, qué falta,
 * y al tocar una etapa, todo lo que pasó en ella.
 *
 * La etiqueta, el tono y el "qué falta" salen de `orderProgress`, el mismo
 * cálculo de la fila de la tabla y del encabezado, así que la orden dice lo
 * mismo en las tres. Cancelaciones y devoluciones no ocupan un paso: cortan el
 * recorrido, así que se avisan al pie.
 */
export function OrderStatusTimeline({
  order,
  actions,
}: OrderStatusTimelineProps) {
  const { user } = useAuth();
  const shipment = order.shipment;
  const progress = orderProgress(order);
  const stages = orderTimelineStages(order);

  const canViewTracking = !!user && shippingPolicies.viewTracking(user);
  const { data: events = [], isLoading } = useShipmentTracking(
    shipment?.id,
    canViewTracking,
  );
  // Los candados y la palomita, como en el diálogo de registrar evento. Solo
  // para quien registra eventos: el back no da las etapas abiertas a nadie
  // más, y a quien solo mira no le sirve saber qué falta registrar.
  const canRecordEvents = !!user && shippingPolicies.recordEvents(user);
  const { requirements, nextStage } = useStageLocks(
    shipment?.id,
    stages,
    progress.stage,
    canRecordEvents,
  );

  // La etapa que se está mirando: la siguiente si la actual ya está cumplida, y
  // si no la actual. La que se toca a mano vale mientras la línea no se mueva;
  // cuando avanza (se registró el evento que abre la siguiente, cambió la
  // etapa), el enfoque la sigue. Por eso la elección guarda dónde estaba la
  // línea cuando se hizo.
  const anchor = nextStage ?? progress.stage;
  const [picked, setPicked] = useState<{
    stage: ShipmentStage;
    anchor: ShipmentStage | null;
  } | null>(null);
  const focusedStage =
    picked && picked.anchor === anchor ? picked.stage : anchor;
  const setFocused = (stage: ShipmentStage) => setPicked({ stage, anchor });

  // Lo último que pasó en cada etapa, para la segunda línea de cada paso. Las
  // incidencias no cuentan: no son un paso del recorrido.
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

  const focusedEvents = events.filter((e) => e.stage === focusedStage);
  const cancelled =
    order.status === "CANCELLED" || shipment?.status === "CANCELLED";

  return (
    <div className="space-y-3 rounded-md border p-3 sm:p-4">
      <ShipmentStageTimeline
        stages={stages}
        current={progress.stage}
        tone={progress.tone}
        hasIncident={!!progress.incident}
        captions={captions}
        focused={canViewTracking ? focusedStage : null}
        onFocus={canViewTracking ? setFocused : undefined}
        requirements={requirements}
        currentCompleted={!!nextStage}
      />

      {cancelled ? (
        <p className={cn(CALLOUT_CLASS, TONE_CALLOUT.stopped)}>
          <Ban className="size-3.5" />
          Orden cancelada
        </p>
      ) : shipment?.status === "RETURNED" ? (
        <p className={cn(CALLOUT_CLASS, TONE_CALLOUT.stopped)}>
          <Undo2 className="size-3.5" />
          Devuelta al remitente — {progress.hint.toLowerCase()}
        </p>
      ) : progress.incident ? (
        <p className={cn(CALLOUT_CLASS, TONE_CALLOUT.stopped)}>
          <TriangleAlert className="size-3.5 shrink-0" />
          {INCIDENT_LABELS[progress.incident.type]} — {progress.incident.reason}
        </p>
      ) : shipment?.status === "DELIVERED" ? (
        <p className={cn(CALLOUT_CLASS, TONE_CALLOUT.done)}>
          <Check className="size-3.5" />
          Entregado al destinatario
        </p>
      ) : (
        progress.hint && (
          <p className="text-center text-xs text-muted-foreground">
            {progress.detail && (
              <span className="font-medium text-foreground">
                {progress.detail} ·{" "}
              </span>
            )}
            {progress.hint}
          </p>
        )
      )}

      {actions && (
        <div className="flex flex-wrap justify-end gap-2">{actions}</div>
      )}

      {canViewTracking && focusedStage && (
        <div className="space-y-2 border-t pt-3">
          <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {STAGE_LABELS[focusedStage]}
          </h5>
          {isLoading ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              Cargando historial...
            </p>
          ) : (
            <ShipmentEventList
              events={focusedEvents}
              emptyText="Todavía no hay eventos registrados en esta etapa."
              tone={progress.tone}
              isCurrentStage={focusedStage === progress.stage}
            />
          )}
        </div>
      )}
    </div>
  );
}
