import {
  TONE_OUTLINE,
  TONE_RING,
  TONE_SOLID,
  TONE_TEXT,
} from "@contexts/shared/domain/schemas/StatusTone";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import {
  consolidationStages,
  STAGE_CAPTIONS,
  STAGE_LABELS,
  stageIndex,
  toneForStage,
  type ConsolidationStage,
} from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import {
  Boxes,
  Check,
  ClipboardCheck,
  Container,
  PackageCheck,
  PackageMinus,
  Truck,
  Warehouse,
  type LucideIcon,
} from "lucide-react";

const STAGE_ICON: Record<ConsolidationStage, LucideIcon> = {
  PREPARACION: ClipboardCheck,
  CARGANDO: Boxes,
  SELLADO: Container,
  DESPACHADO: Truck,
  EN_TRANSITO: Truck,
  EN_DESTINO: Warehouse,
  DESCARGANDO: PackageMinus,
  CONCILIADO: PackageCheck,
};

type StepState = "done" | "current" | "pending";

const PENDING_STEP = "border-border bg-muted text-muted-foreground/50";

interface Props {
  current: ConsolidationStage;
}

/**
 * Línea de tiempo de un consolidado: ocho pasos, siempre en el mismo orden,
 * sin eventos ni evidencia por paso (eso vive en la pestaña de Evidencias) —
 * a diferencia de `ShipmentStageTimeline`, acá sólo se muestra dónde va el
 * tráiler.
 */
export const ConsolidationStageTimeline = ({ current }: Props) => {
  const currentIndex = stageIndex(current);

  const stateOf = (stage: ConsolidationStage): StepState => {
    if (stage === current) return "current";
    return stageIndex(stage) < currentIndex ? "done" : "pending";
  };

  return (
    <div className="min-w-0 overflow-x-auto px-1 pt-2.5 pb-1">
      <ol className="flex min-w-max sm:min-w-0">
        {consolidationStages.map((stage, index) => {
          const state = stateOf(stage);
          const Icon = STAGE_ICON[stage];
          const tone = toneForStage(stage);
          const reached = state !== "pending";

          return (
            <li
              key={stage}
              className="relative flex min-w-[84px] flex-1 flex-col items-center px-1"
              aria-current={state === "current" ? "step" : undefined}
            >
              {index > 0 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-4 right-1/2 h-0.5 w-full -translate-y-1/2",
                    reached ? "bg-primary/50" : "bg-border",
                  )}
                />
              )}

              <span
                className={cn(
                  "relative z-10 flex size-8 items-center justify-center rounded-full border-2",
                  state === "current"
                    ? cn(
                        TONE_SOLID[tone],
                        "ring-2 ring-offset-1 ring-offset-background",
                        TONE_RING[tone],
                      )
                    : state === "done"
                      ? TONE_OUTLINE[tone]
                      : PENDING_STEP,
                )}
              >
                {state === "done" ? (
                  <Check className="size-4" />
                ) : (
                  <Icon className="size-4" />
                )}
              </span>

              <p
                className={cn(
                  "mt-1.5 text-center text-[11px] leading-tight",
                  state === "current"
                    ? cn("font-semibold", TONE_TEXT[tone])
                    : state === "done"
                      ? cn("font-medium opacity-75", TONE_TEXT[tone])
                      : "text-muted-foreground",
                )}
              >
                {STAGE_LABELS[stage]}
              </p>
              <p className="mt-0.5 line-clamp-2 text-center text-[10px] leading-tight text-muted-foreground">
                {STAGE_CAPTIONS[stage]}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
};
