import { Badge } from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { TrailerPrimitives } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import { CheckCircle2, Truck } from "lucide-react";

interface Props {
  trailers: TrailerPrimitives[];
  selectedId: string;
  onSelect: (id: string) => void;
}

/** Lista de unidades elegibles como tarjetas — cada una se ve y se siente
 * como un vehículo real (ícono, estado, capacidad), no una fila de combo
 * box. Mismo espíritu que un selector de flota: tocar la tarjeta es "elegir
 * ese camión". */
export const TrailerCardList = ({ trailers, selectedId, onSelect }: Props) => {
  if (trailers.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
        No hay tráilers activos —{" "}
        <a href="/trailers" className="underline">
          da de alta uno
        </a>
        .
      </div>
    );
  }

  return (
    <div className="max-h-64 space-y-2 overflow-y-auto pr-0.5">
      {trailers.map((t) => {
        const isSelected = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-[color,background-color,border-color,transform] duration-150 ease-out active:scale-[0.98]",
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "hover:bg-muted/50",
            )}
          >
            <div
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              <Truck className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate font-mono text-sm font-semibold">{t.unitNumber}</p>
                {isSelected && <CheckCircle2 className="size-3.5 shrink-0 text-primary" />}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {t.type} · {t.plates}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <Badge variant="outline" className="border-status-done bg-status-done-soft text-status-done-fg">
                Activo
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">{t.capacityLinearFeet} ft</p>
            </div>
          </button>
        );
      })}
    </div>
  );
};
