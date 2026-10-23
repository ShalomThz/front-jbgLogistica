import {
  TONE_FILL,
  TONE_OUTLINE,
  TONE_RING,
  TONE_SOLID,
  TONE_TEXT,
  type StatusTone,
} from "@contexts/shared/domain/schemas/StatusTone";
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
  /** La etapa a la que va a avanzar (el diálogo de avanzar): el tramo hasta
   * ella se anima y su paso se marca punteado. Si es la misma etapa, late el
   * paso actual. */
  advancingTo?: ShipmentStage | null;
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
  advancingTo = null,
}: Props) => {
  const currentIndex = current ? stageIndex(current) : -1;
  const targetIndex = advancingTo ? stageIndex(advancingTo) : -1;

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
          const isClickable = !!onFocus;
          const isFocused = focused === stage;
          // El color del paso: el de la orden, salvo el del agente, que va en
          // su propio color (ver `toneForStage`).
          const stepTone = toneForStage(stage, tone);
          // El tramo que llega a este paso: recorrido si este ya se alcanzó.
          const reached = state !== "pending";
          // Avanzar: el tramo que lleva al destino se anima, y el destino se
          // marca. Sin cambio de etapa, el que late es el actual.
          const position = stageIndex(stage);
          const advancing =
            advancingTo !== null &&
            position > currentIndex &&
            position <= targetIndex;
          const isTarget = advancingTo === stage && state !== "current";
          const pulsesInPlace = advancingTo === stage && state === "current";

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
                >
                  {advancing && (
                    <span
                      className={cn(
                        "animate-tramo-avanza absolute inset-0",
                        TONE_FILL[stepTone],
                      )}
                    />
                  )}
                </span>
              )}

              <button
                type="button"
                disabled={!isClickable}
                onClick={() => isClickable && onFocus?.(stage)}
                title={STAGE_LABELS[stage]}
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
                      : isTarget
                        ? cn(TONE_OUTLINE[stepTone], "border-dashed")
                        : PENDING_STEP,
                  isFocused &&
                    "ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
              >
                {(isTarget || pulsesInPlace) && (
                  <span
                    aria-hidden
                    className={cn(
                      "absolute -inset-1 animate-ping rounded-full ring-2 motion-reduce:animate-none",
                      TONE_RING[stepTone],
                    )}
                  />
                )}
                {state === "done" ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
                {state === "current" && hasIncident && (
                  <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-status-problem text-background">
                    <TriangleAlert className="size-2.5" />
                  </span>
                )}
              </button>

              <p
                className={cn(
                  "mt-1.5 text-center text-[11px] leading-tight",
                  state === "current" || isTarget
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
