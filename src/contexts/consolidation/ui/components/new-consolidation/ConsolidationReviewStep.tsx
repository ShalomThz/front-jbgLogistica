import type { ReactNode } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Button, Card, CardContent } from "@contexts/shared/shadcn";
import { Container, Package, Pencil, TriangleAlert, Truck } from "lucide-react";
import type { NewConsolidationFormValues } from "@contexts/consolidation/domain/schemas/consolidation/NewConsolidationForm";
import type { TrailerPrimitives } from "@contexts/consolidation/domain/schemas/trailer/Trailer";
import type { DriverListViewPrimitives } from "@contexts/shipping/domain/schemas/driver/DriverListView";
import type { NewConsolidationStep } from "@contexts/consolidation/ui/hooks/useNewConsolidationFlow";
import { departureFromInput, formatDeparture } from "@contexts/consolidation/domain/departureDate";
import { TruckVisual } from "@contexts/consolidation/ui/components/TruckVisual";

interface Props {
  trailers: TrailerPrimitives[];
  drivers: DriverListViewPrimitives[];
  onEdit: (step: NewConsolidationStep) => void;
  /** Sin permiso de cargar órdenes no hay paso de órdenes que resumir. */
  showOrders: boolean;
}

const Section = ({
  icon: Icon,
  title,
  onEdit,
  children,
}: {
  icon: typeof Truck;
  title: string;
  onEdit: () => void;
  children: ReactNode;
}) => (
  <Card>
    <CardContent className="space-y-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="size-4 text-muted-foreground" />
          {title}
        </div>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-xs"
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
          Editar
        </Button>
      </div>
      {children}
    </CardContent>
  </Card>
);

const Row = ({ label, value }: { label: string; value: ReactNode }) => (
  <div className="flex justify-between gap-4 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium">{value}</span>
  </div>
);

/** Paso 3: todo lo que se va a crear, con un atajo para corregir cada parte. */
export const ConsolidationReviewStep = ({
  trailers,
  drivers,
  onEdit,
  showOrders,
}: Props) => {
  const { control } = useFormContext<NewConsolidationFormValues>();
  const values = useWatch({ control });

  const trailer = trailers.find((t) => t.id === values.trailerId);
  const driver = drivers.find((d) => d.id === values.driverId);
  const departure = departureFromInput(values.plannedDepartureAt ?? "");
  const orders = values.orders ?? [];
  const capacity = Number(values.capacityLinearFeet) || 0;
  const totalLinearFeet = orders.reduce((sum, o) => sum + (o.linearFeet ?? 0), 0);

  const warnings = [
    totalLinearFeet > capacity &&
      `Las órdenes ocupan ${totalLinearFeet.toFixed(1)} ft y la capacidad es ${capacity} ft.`,
    !driver && "No tiene conductor asignado.",
  ].filter((w): w is string => !!w);

  return (
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="flex gap-2 rounded-md border border-status-attention/40 bg-status-attention-soft p-3 text-sm">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-status-attention-fg" />
          <ul className="space-y-0.5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Section icon={Container} title="Ruta" onEdit={() => onEdit("datos")}>
          <Row label="Folio" value={<span className="font-mono">{values.folio}</span>} />
          <Row label="Origen" value={values.origin} />
          <Row label="Destino" value={values.destination} />
          <Row
            label="Salida"
            value={departure ? formatDeparture(departure) : "Sin fecha"}
          />
        </Section>

        <Section icon={Truck} title="Unidad" onEdit={() => onEdit("datos")}>
          <Row
            label="Tráiler"
            value={
              trailer ? (
                <>
                  <span className="font-mono">{trailer.unitNumber}</span> · {trailer.type} ·{" "}
                  {trailer.plates}
                </>
              ) : (
                "—"
              )
            }
          />
          <Row label="Conductor" value={driver ? driver.user.name : "Sin asignar"} />
          <Row label="Capacidad" value={`${capacity} ft`} />
        </Section>
      </div>

      {showOrders && (
        <Section
          icon={Package}
          title={`Órdenes (${orders.length})`}
          onEdit={() => onEdit("ordenes")}
        >
          <TruckVisual
            usedLinearFeet={0}
            pendingLinearFeet={totalLinearFeet}
            capacityLinearFeet={capacity}
            compact
          />
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sin órdenes. Puedes agregarlas después desde el consolidado.
            </p>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {orders.map((o) => (
                <li key={o.orderId} className="flex items-center justify-between gap-3 px-3 py-2">
                  <span className="truncate font-mono font-semibold">
                    {o.displayLabel ?? o.orderId?.slice(0, 8).toUpperCase()}
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    {o.section ? `Sección ${o.section} · ` : ""}
                    {(o.linearFeet ?? 0).toFixed(1)} ft
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}
    </div>
  );
};
