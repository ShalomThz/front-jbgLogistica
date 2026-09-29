import {
  ORDER_MILESTONES,
  orderProgress,
} from "@contexts/order-flow/domain/services/orderProgress";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import { TONE_FILL, TONE_TEXT } from "@contexts/shared/domain/schemas/StatusTone";
import { INCIDENT_LABELS } from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import { TriangleAlert } from "lucide-react";

interface Props {
  order: OrderListView;
  className?: string;
}

/**
 * El recorrido de la orden como una sola línea: en qué etapa está y qué falta.
 *
 * Ocho tramos fijos —las etapas de la guía— para que las filas se comparen
 * entre sí de un vistazo. Debajo, la etapa; al lado, el estatus operativo
 * cuando agrega algo ("Bodega origen · Por procesar"). Una incidencia abierta
 * se marca aparte, porque no mueve la etapa pero es lo primero que hay que ver.
 */
export const OrderProgressBar = ({ order, className }: Props) => {
  const { reached, label, detail, hint, tone, incident } = orderProgress(order);

  // Las etapas, en el tooltip, para no tener que aprenderse la barra.
  const milestoneSummary = ORDER_MILESTONES.map(
    (milestone, index) => `${index < reached ? "✓" : "○"} ${milestone}`,
  ).join("\n");

  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      title={hint ? `${hint}\n\n${milestoneSummary}` : milestoneSummary}
    >
      <div
        className="flex items-center gap-0.5"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={ORDER_MILESTONES.length}
        aria-valuenow={reached}
        aria-valuetext={label}
      >
        {ORDER_MILESTONES.map((milestone, index) => (
          <span
            key={milestone}
            className={cn(
              "h-1.5 w-2.5 rounded-full transition-colors",
              index < reached ? TONE_FILL[tone] : "bg-muted",
            )}
          />
        ))}
      </div>
      <span className="flex flex-wrap items-center gap-x-1 text-xs leading-tight">
        <span className={cn("font-medium", TONE_TEXT[tone])}>{label}</span>
        {detail && <span className="text-muted-foreground">· {detail}</span>}
      </span>
      {incident && (
        <span
          className={cn(
            "flex items-center gap-1 text-[11px] font-medium leading-none",
            TONE_TEXT.stopped,
          )}
        >
          <TriangleAlert className="size-3" />
          {INCIDENT_LABELS[incident.type]}
        </span>
      )}
    </div>
  );
};
