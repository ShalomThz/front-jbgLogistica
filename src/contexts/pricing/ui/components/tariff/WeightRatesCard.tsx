import type { WeightRatePrimitives } from "@contexts/pricing/application/WeightRate";
import {
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_LABELS,
  SHIPPING_MODE_LABELS,
  serviceLevels,
  type ServiceLevel,
  type ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { useWeightRates } from "@contexts/pricing/infrastructure/hooks/tariffs/useWeightRates";
import { WeightRateCellDialog } from "@contexts/pricing/ui/components/tariff/WeightRateCellDialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { Handshake, Plus, Users } from "lucide-react";
import { useState } from "react";

interface WeightRatesCardProps {
  zoneId: string;
  zoneName?: string;
  destinationCountry: string;
  /** Lo decide el selector de la página, no esta tabla: es el mismo eje que
   * elige si se ve la matriz de cajas o esto. */
  shippingMode: ShippingMode;
  canEdit: boolean;
}

/** Lo que gana el socio si revende al precio público. Igual que en la matriz. */
function marginPercent(
  publicRate: WeightRatePrimitives | undefined,
  partnerRate: WeightRatePrimitives | undefined,
): number | null {
  if (!publicRate || !partnerRate) return null;
  if (publicRate.pricePerUnit.currency !== partnerRate.pricePerUnit.currency) {
    return null;
  }
  if (publicRate.pricePerUnit.amount === 0) return null;

  return (
    ((publicRate.pricePerUnit.amount - partnerRate.pricePerUnit.amount) /
      publicRate.pricePerUnit.amount) *
    100
  );
}

/**
 * La tabla de tarifas por peso, con la misma forma que la matriz de cajas:
 * una fila por servicio, público y socio en la misma celda, y todos los
 * servicios a la vista para que se note cuál falta.
 *
 * El eje de filas es el servicio y no la caja porque acá no hay caja — es la
 * única diferencia de fondo. Las columnas extra (mínimo, máximo, unidad) son
 * las condiciones que solo existen cuando se cobra por peso.
 */
export function WeightRatesCard({
  zoneId,
  zoneName,
  destinationCountry,
  shippingMode,
  canEdit,
}: WeightRatesCardProps) {
  const { weightRates, isLoading, setWeightRate, isSaving } =
    useWeightRates(zoneId);

  const [editing, setEditing] = useState<ServiceLevel | null>(null);

  // El hook trae la zona entera; destino y modo se filtran acá para que la
  // tabla coincida con lo elegido arriba, igual que la matriz.
  const visible = weightRates.filter(
    (rate) =>
      rate.destinationCountry === destinationCountry &&
      rate.shippingMode === shippingMode,
  );

  const rateFor = (serviceLevel: ServiceLevel, priceType: "PUBLIC" | "PARTNER") =>
    visible.find(
      (rate) =>
        rate.serviceLevel === serviceLevel && rate.priceType === priceType,
    );

  const money = (rate: WeightRatePrimitives | undefined) =>
    rate
      ? `$${rate.pricePerUnit.amount.toFixed(2)} ${rate.pricePerUnit.currency}/${rate.unit}`
      : "—";

  const editingPublic = editing ? rateFor(editing, "PUBLIC") : undefined;
  const editingPartner = editing ? rateFor(editing, "PARTNER") : undefined;
  const editingAny = editingPublic ?? editingPartner;

  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border">
      <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
        <p className="truncate text-xs text-muted-foreground">
          {zoneName ? `${zoneName} → ${destinationCountry} · ` : ""}
          {SHIPPING_MODE_LABELS[shippingMode]} · se cobra por peso
        </p>
        <p className="shrink-0 text-xs text-muted-foreground">
          El mayor entre real y volumétrico · divisor en Ajustes
        </p>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-40">Servicio</TableHead>
              <TableHead className="min-w-56">Precio por unidad</TableHead>
              <TableHead className="text-right">Mínimo</TableHead>
              <TableHead className="text-right">Máximo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center text-sm text-muted-foreground"
                >
                  Cargando...
                </TableCell>
              </TableRow>
            ) : (
              // Los cuatro servicios siempre, como la matriz: así se ve de una
              // qué combinaciones faltan en vez de una tabla que parece vacía.
              serviceLevels.map((service) => {
                const publicRate = rateFor(service, "PUBLIC");
                const partnerRate = rateFor(service, "PARTNER");
                const margin = marginPercent(publicRate, partnerRate);
                const anyRate = publicRate ?? partnerRate;
                const isEmpty = !publicRate && !partnerRate;

                const cell = isEmpty ? (
                  <span className="flex items-center gap-1 py-1 text-xs text-muted-foreground">
                    {canEdit && <Plus className="size-3" />}
                    Sin precio
                  </span>
                ) : (
                  <span className="flex flex-col gap-0.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3 shrink-0" />
                        Público
                      </span>
                      <span className="font-mono tabular-nums">
                        {money(publicRate)}
                      </span>
                    </span>
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Handshake className="size-3 shrink-0" />
                        Socio
                      </span>
                      <span className="font-mono tabular-nums">
                        {money(partnerRate)}
                      </span>
                    </span>
                    {margin !== null && (
                      <span
                        className={`text-right text-[11px] ${
                          margin < 0
                            ? "text-amber-600 dark:text-amber-500"
                            : "text-muted-foreground"
                        }`}
                      >
                        margen {margin.toFixed(0)}%
                      </span>
                    )}
                  </span>
                );

                return (
                  <TableRow key={service}>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${SERVICE_LEVEL_COLORS[service]}`}
                      >
                        {SERVICE_LEVEL_LABELS[service]}
                      </span>
                    </TableCell>
                    <TableCell>
                      {canEdit ? (
                        <button
                          type="button"
                          onClick={() => setEditing(service)}
                          className="w-full rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {cell}
                        </button>
                      ) : (
                        <div className="px-1 py-1.5">{cell}</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {anyRate ? `${anyRate.minWeight} ${anyRate.unit}` : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">
                      {!anyRate ? (
                        "—"
                      ) : anyRate.maxWeight === null ? (
                        <span className="text-xs text-muted-foreground">
                          sin techo
                        </span>
                      ) : (
                        `${anyRate.maxWeight} ${anyRate.unit}`
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {editing && (
        <WeightRateCellDialog
          open
          onClose={() => setEditing(null)}
          onSave={setWeightRate}
          zoneId={zoneId}
          zoneName={zoneName}
          destinationCountry={destinationCountry}
          shippingMode={shippingMode}
          serviceLevel={editing}
          publicPrice={editingPublic?.pricePerUnit ?? null}
          partnerPrice={editingPartner?.pricePerUnit ?? null}
          unit={editingAny?.unit ?? "lb"}
          minWeight={editingAny?.minWeight ?? null}
          maxWeight={editingAny?.maxWeight ?? null}
          isLoading={isSaving}
        />
      )}
    </div>
  );
}
