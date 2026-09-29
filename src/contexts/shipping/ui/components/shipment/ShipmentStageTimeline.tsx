import {
  TONE_FILL,
  TONE_OUTLINE,
  TONE_RING,
  TONE_SOLID,
  TONE_TEXT,
  type StatusTone,
} from "@contexts/shared/domain/schemas/StatusTone";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  STAGE_CAPTIONS,
  STAGE_LABELS,
  stageIndex,
  toneForStage,
  type ShipmentStage,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStages";
import {
  Boxes,
  Building2,
  Check,
  Container,
  Lock,
  PackageCheck,
  Plane,
  Store,
  TriangleAlert,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const STAGE_ICON: Record<ShipmentStage, LucideIcon> = {
  AGENT: Store,
  ORIGIN_WAREHOUSE: Warehouse,
  DISPATCHED: Container,
  IN_TRANSIT: Plane,
  DESTINATION_WAREHOUSE: Building2,
  DISTRIBUTION: Boxes,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: PackageCheck,
};

type StepState = "done" | "current" | "pending";

/**
 * El recorrido se pinta con el tono de la orden —el mismo de la fila y del
 * encabezado—, así la misma orden se ve del mismo color en todas las pantallas.
 * La intensidad dice dónde está: la etapa actual va sólida y con halo, las
 * cumplidas en la versión suave del mismo tono (`TONE_OUTLINE`), y las
 * pendientes en gris, porque todavía no son parte del recorrido.
 */
const PENDING_STEP = "border-border bg-muted text-muted-foreground/50";

export interface StageCaption {
  /** El último evento registrado en la etapa. */
  label: string;
  occurredAt: string;
}

interface Props {
  /** Las etapas que se dibujan, en orden. Las que no aplican a la orden ya
   * vienen omitidas (ver `timelineStages`). */
  stages: readonly ShipmentStage[];
  current: ShipmentStage | null;
  /** El tono de la orden (`orderProgress`), para el paso actual. */
  tone: StatusTone;
  /** Hay una incidencia abierta: se marca sobre el paso actual. */
  hasIncident?: boolean;
  /** Lo último que pasó en cada etapa, para la segunda línea. */
  captions?: Partial<Record<ShipmentStage, StageCaption>>;
  /** La etapa enfocada: la que se está mirando o la que se va a registrar. */
  focused?: ShipmentStage | null;
  /** Presente, los pasos se pueden tocar. */
  onFocus?: (stage: ShipmentStage) => void;
  /** Si viene, solo estas etapas se pueden tocar (el diálogo: las que tienen
   * eventos disponibles). */
  enabled?: ReadonlySet<ShipmentStage>;
  /** Lo que falta hacer antes de poder usar una etapa ("Primero se debe
   * completar la venta"). Se marca con un candado sobre el paso y se lee al
   * pasar el mouse: así se ve qué hacer, no solo que está apagada. */
  requirements?: Partial<Record<ShipmentStage, string>>;
  /** La etapa actual ya cumplió lo que abre la siguiente: lleva palomita en
   * vez de su ícono, sin dejar de ser la actual. */
  currentCompleted?: boolean;
}

const formatShortDate = (iso: string) =>
  new Date(iso).toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

/**
 * La línea de tiempo del rastreo: las etapas de la guía del cliente, de
 * izquierda a derecha, con la actual resaltada y lo último que pasó en cada
 * una debajo.
 *
 * Es sencilla a propósito (guía, §1): una etapa por paso. Los eventos internos,
 * fotos y responsables de cada etapa se ven al tocarla, no acá.
 *
 * La comparten el detalle de la orden —tocar una etapa muestra sus eventos— y
 * el diálogo de registrar evento —tocar una etapa muestra qué se puede
 * registrar en ella.
 */
export const ShipmentStageTimeline = ({
  stages,
  current,
  tone,
  hasIncident = false,
  captions,
  focused = null,
  onFocus,
  enabled,
  requirements,
  currentCompleted = false,
}: Props) => {
  const currentIndex = current ? stageIndex(current) : -1;

  const stateOf = (stage: ShipmentStage): StepState => {
    if (stage === current) return "current";
    return stageIndex(stage) < currentIndex ? "done" : "pending";
  };

  return (
    // `min-w-0` para que pueda encogerse por debajo del ancho de los pasos: sin
    // eso estira a quien lo tenga adentro en vez de scrollear.
    //
    // El padding arriba y a los costados no es decorativo: `overflow-x-auto`
    // también recorta en vertical, y el anillo del paso actual y el aviso de
    // incidencia salen por encima del círculo. Sin esto se cortaban.
    <div className="min-w-0 overflow-x-auto px-1 pt-2.5 pb-1">
      <ol className="flex min-w-max sm:min-w-0">
        {stages.map((stage, index) => {
          const state = stateOf(stage);
          const Icon = STAGE_ICON[stage];
          const caption = captions?.[stage];
          const isClickable = !!onFocus && (!enabled || enabled.has(stage));
          const isFocused = focused === stage;
          const requirement = requirements?.[stage];
          // El color del paso: el de la orden, salvo el del agente, que va en
          // su propio color (ver `toneForStage`).
          const stepTone = toneForStage(stage, tone);
          // El tramo que llega a este paso: recorrido si este ya se alcanzó.
          const reached = state !== "pending";

          return (
            <li
              key={stage}
              className="relative flex min-w-[76px] flex-1 flex-col items-center px-1"
              aria-current={state === "current" ? "step" : undefined}
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-4 right-1/2 w-full -translate-y-1/2",
                    // El tramo recorrido, del tono de la orden pero atenuado:
                    // la línea no debe pesar más que los pasos.
                    "h-0.5",
                    reached ? cn(TONE_FILL[tone], "opacity-50") : "bg-border",
                  )}
                />
              )}

              {/* Lo que falta para abrir la etapa va al pasar el mouse. El
                  disparador es el `span` y no el botón porque uno
                  deshabilitado no recibe el hover. */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="relative z-10">
                    <button
                      type="button"
                      disabled={!isClickable}
                      onClick={() => isClickable && onFocus?.(stage)}
                      title={requirement ? undefined : STAGE_LABELS[stage]}
                      className={cn(
                        "relative z-10 flex size-8 items-center justify-center rounded-full border-2 transition-shadow",
                        isClickable
                          ? "cursor-pointer hover:shadow-md"
                          : "cursor-default",
                        state === "current"
                          ? cn(
                              TONE_SOLID[stepTone],
                              "ring-2 ring-offset-1 ring-offset-background",
                              TONE_RING[stepTone],
                            )
                          : state === "done"
                            ? TONE_OUTLINE[stepTone]
                            : PENDING_STEP,
                        isFocused &&
                          "ring-2 ring-primary ring-offset-2 ring-offset-background",
                        onFocus &&
                          enabled &&
                          !enabled.has(stage) &&
                          "opacity-50",
                      )}
                    >
                      {state === "done" ||
                      (state === "current" && currentCompleted) ? (
                        <Check className="size-4" />
                      ) : (
                        <Icon className="size-4" />
                      )}
                      {state === "current" && hasIncident && (
                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-status-problem text-background">
                          <TriangleAlert className="size-2.5" />
                        </span>
                      )}
                      {/* Neutro: el color queda para el estado de la orden y
                          para el agente; esto es solo "todavía no". */}
                      {requirement && state !== "current" && (
                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-muted-foreground text-background">
                          <Lock className="size-2.5" />
                        </span>
                      )}
                    </button>
                  </span>
                </TooltipTrigger>
                {requirement && <TooltipContent>{requirement}</TooltipContent>}
              </Tooltip>

              <p
                className={cn(
                  "mt-1.5 text-center text-[11px] leading-tight",
                  state === "current"
                    ? cn("font-semibold", TONE_TEXT[stepTone])
                    : state === "done"
                      ? cn("font-medium opacity-75", TONE_TEXT[stepTone])
                      : "text-muted-foreground",
                  isFocused && "underline underline-offset-2",
                )}
              >
                {STAGE_LABELS[stage]}
              </p>
              <p className="mt-0.5 line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                {caption ? caption.label : STAGE_CAPTIONS[stage]}
              </p>
              {caption && (
                <p className="text-center text-[10px] leading-tight text-muted-foreground/70">
                  {formatShortDate(caption.occurredAt)}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
};
