import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  Ban,
  Box,
  Check,
  ClipboardCheck,
  FilePlus2,
  PackageCheck,
  Tag,
  Truck,
  Undo2,
  Warehouse,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

/** Orden de avance del shipment para saber qué hitos ya se alcanzaron. */
const SHIPMENT_PROGRESS = [
  "DRAFT",
  "EMPTY_BOX_PENDING",
  "AWAITING_PICKUP",
  "AT_WAREHOUSE",
  "PROVIDER_SELECTED",
  "FULFILLED",
  "IN_ROUTE",
  "DELIVERED",
] as const;

interface TimelineStep {
  label: string;
  /** Qué está pasando cuando este es el paso en curso. */
  pendingHint: string;
  icon: LucideIcon;
  done: boolean;
}

function shipmentRank(status: string | undefined): number {
  if (!status) return 0;
  // Un intento fallido sigue siendo "en ruta" para el cliente
  if (status === "FAILED_ATTEMPT") {
    return SHIPMENT_PROGRESS.indexOf("IN_ROUTE");
  }
  const rank = SHIPMENT_PROGRESS.indexOf(
    status as (typeof SHIPMENT_PROGRESS)[number],
  );
  return rank === -1 ? 0 : rank;
}

function buildSteps(order: OrderListView): TimelineStep[] {
  const rank = shipmentRank(order.shipment?.status);
  const at = (status: (typeof SHIPMENT_PROGRESS)[number]) =>
    rank >= SHIPMENT_PROGRESS.indexOf(status);

  const boxCycleSteps: TimelineStep[] = order.emptyBoxDelivery
    ? [
        {
          label: "Caja vacía entregada",
          pendingHint: "El chofer llevará la caja vacía al domicilio",
          icon: Box,
          done: at("AWAITING_PICKUP"),
        },
        {
          label: "Recolectada, en bodega",
          pendingHint: "La caja está con el cliente; falta recolectarla",
          icon: Warehouse,
          done: at("AT_WAREHOUSE"),
        },
      ]
    : [];

  return [
    {
      label: "Orden creada",
      pendingHint: "",
      icon: FilePlus2,
      done: true,
    },
    ...boxCycleSteps,
    {
      label: "Orden procesada",
      pendingHint: "JBG debe pesar y tarifar la orden",
      icon: ClipboardCheck,
      done: order.status === "COMPLETED",
    },
    {
      label: "Guía generada",
      pendingHint: "Falta elegir paquetería y generar la guía",
      icon: Tag,
      done: at("FULFILLED"),
    },
    {
      label: "En ruta",
      pendingHint: "El paquete espera salir a reparto",
      icon: Truck,
      done: at("IN_ROUTE"),
    },
    {
      label: "Entregado",
      pendingHint: "El paquete va en camino al destinatario",
      icon: PackageCheck,
      done: at("DELIVERED"),
    },
  ];
}

interface OrderStatusTimelineProps {
  order: OrderListView;
}

/**
 * Línea de tiempo del recorrido de la orden: hitos completados, paso en curso
 * (con qué falta para avanzar) y pasos futuros. Cancelaciones y devoluciones
 * cortan la línea con su propio marcador.
 */
export function OrderStatusTimeline({ order }: OrderStatusTimelineProps) {
  const cancelled =
    order.status === "CANCELLED" || order.shipment?.status === "CANCELLED";
  const returned = order.shipment?.status === "RETURNED";
  const failedAttempt = order.shipment?.status === "FAILED_ATTEMPT";

  const steps = buildSteps(order);
  const currentIndex = steps.findIndex((step) => !step.done);
  const current = currentIndex === -1 ? null : steps[currentIndex];

  return (
    <div className="rounded-md border p-3 sm:p-4">
      <div className="flex items-start overflow-x-auto pb-1">
        {steps.map((step, index) => {
          const isCurrent = index === currentIndex && !cancelled && !returned;
          const isDone = step.done && !cancelled;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex min-w-0 flex-1 flex-col items-center">
              {/* Fila de círculo + conectores */}
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    index === 0
                      ? "bg-transparent"
                      : isDone || isCurrent
                        ? "bg-green-400 dark:bg-green-600"
                        : "bg-muted",
                  )}
                />
                <div
                  className={cn(
                    "relative flex size-8 shrink-0 items-center justify-center rounded-full border-2",
                    isDone
                      ? "border-green-500 bg-green-500 text-white"
                      : isCurrent
                        ? "border-amber-500 bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400"
                        : "border-muted-foreground/25 bg-background text-muted-foreground/50",
                  )}
                >
                  {isDone ? <Check className="size-4" /> : <Icon className="size-4" />}
                  {isCurrent && (
                    <span className="absolute inline-flex size-full animate-ping rounded-full border-2 border-amber-400 opacity-60" />
                  )}
                </div>
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    index === steps.length - 1
                      ? "bg-transparent"
                      : isDone
                        ? "bg-green-400 dark:bg-green-600"
                        : "bg-muted",
                  )}
                />
              </div>
              <p
                className={cn(
                  "mt-1.5 px-1 text-center text-[11px] leading-tight",
                  isDone
                    ? "font-medium text-foreground"
                    : isCurrent
                      ? "font-semibold text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground/60",
                )}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Qué sigue / estado excepcional */}
      {cancelled ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-red-50 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <Ban className="size-3.5" />
          Orden cancelada
        </p>
      ) : returned ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-red-50 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950/30 dark:text-red-400">
          <Undo2 className="size-3.5" />
          Devuelto al remitente — se agotaron los intentos de entrega
        </p>
      ) : failedAttempt ? (
        <p className="mt-2 flex items-center justify-center gap-1.5 rounded-md bg-amber-50 py-1.5 text-xs font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
          <Truck className="size-3.5" />
          Intento de entrega fallido — se volverá a intentar
        </p>
      ) : current ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {current.pendingHint}
        </p>
      ) : (
        <p className="mt-2 flex items-center justify-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400">
          <Check className="size-3.5" />
          Entregado al destinatario
        </p>
      )}
    </div>
  );
}
