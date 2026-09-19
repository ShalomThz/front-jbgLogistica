import {
  Badge,
  Card,
  CardContent,
  Separator,
} from "@contexts/shared/shadcn";
import {
  AlertTriangle,
  ChevronDown,
  Edit,
  MapPin,
  Package,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { useWatch } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { WeightBreakdown } from "@contexts/pricing/application/QuotePrice";
import {
  calculateBillableWeight,
  calculateMassWeight,
  calculateVolumetricWeight,
  FALLBACK_VOLUMETRIC_DIVISOR,
} from "@contexts/order-flow/domain/services/packageCalculations";
import { useVolumetricDivisor } from "@contexts/settings/infrastructure/hooks/useVolumetricDivisor";

interface ShipmentSummaryCardProps {
  onEdit: () => void;
  /** El desglose que devolvió la cotización, cuando el servicio cobra por peso.
   * Manda sobre el cálculo local: se hizo con el divisor de Ajustes y con el
   * piso de la tarifa aplicado. */
  weightBreakdown?: WeightBreakdown | null;
}

export function ShipmentSummaryCard({
  onEdit,
  weightBreakdown = null,
}: ShipmentSummaryCardProps) {
  const [open, setOpen] = useState(true);

  const sender = useWatch<HQOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<HQOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<HQOrderFormValues, "package">({ name: "package" });
  const selectedRate = useWatch<HQOrderFormValues, "shippingService.selectedRate">({ name: "shippingService.selectedRate" });
  const shippingMode = useWatch<HQOrderFormValues, "shippingService.shippingMode">({ name: "shippingService.shippingMode" });

  // El mismo de Ajustes que usa el paso anterior: si acá se usara otro, el peso
  // cambiaría al avanzar de paso sin que nada lo explique.
  const { volumetricDivisor } = useVolumetricDivisor();
  const divisor = volumetricDivisor ?? FALLBACK_VOLUMETRIC_DIVISOR;

  // Solo el aéreo cobra por el mayor entre masa y volumen, así que es el único
  // modo donde mostrar la comparación aporta algo.
  const isAir = shippingMode === "AIR";
  const massWeight = calculateMassWeight(pkg);
  const volumetricWeight = calculateVolumetricWeight(pkg, divisor);
  const billableWeight = calculateBillableWeight(pkg, shippingMode, divisor);

  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Resumen de envío</span>
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="inline-flex items-center text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            <Edit className="size-3 mr-1" />
            Editar
          </span>
        </div>
        <ChevronDown className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <User className="size-3" />
              Remitente
            </div>
            <div className="text-sm font-medium">{sender.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground">{sender.phone}</div>
            {sender.address.address1 && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 mt-0.5 shrink-0" />
                <span>
                  {sender.address.address1}, {sender.address.city}, {sender.address.province} {sender.address.zip}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <User className="size-3" />
              Destinatario
            </div>
            <div className="text-sm font-medium">{recipient.name || "Sin nombre"}</div>
            <div className="text-xs text-muted-foreground">{recipient.phone}</div>
            {recipient.address.address1 && (
              <div className="flex items-start gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3 mt-0.5 shrink-0" />
                <span>
                  {recipient.address.address1}, {recipient.address.city}, {recipient.address.province} {recipient.address.zip}
                </span>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
              <Package className="size-3" />
              Paquete
            </div>
            <div className="text-xs text-muted-foreground space-y-0.5">
              <div>{pkg.length} x {pkg.width} x {pkg.height} {pkg.dimensionUnit}</div>
              {/* Con cotización manda su desglose: se calculó con el divisor de
                  Ajustes y con el piso de la tarifa. El cálculo local es la
                  vista previa de mientras. */}
              {weightBreakdown ? (
                <>
                  <div>
                    Peso real: {weightBreakdown.realWeight.value.toFixed(2)}{" "}
                    {weightBreakdown.realWeight.unit}
                  </div>
                  <div>
                    Peso volumétrico:{" "}
                    {weightBreakdown.volumetricWeight.value.toFixed(2)}{" "}
                    {weightBreakdown.volumetricWeight.unit}
                  </div>
                  <div className="font-semibold text-primary">
                    Peso facturado:{" "}
                    {weightBreakdown.billableWeight.value.toFixed(2)}{" "}
                    {weightBreakdown.billableWeight.unit}
                    {" × "}
                    {weightBreakdown.pricePerUnit.amount}{" "}
                    {weightBreakdown.pricePerUnit.currency}
                  </div>
                  {weightBreakdown.exceedsMaximum && (
                    // Aviso, no bloqueo: el precio ya está calculado sin topar.
                    <div className="flex items-start gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
                      <AlertTriangle className="mt-0.5 size-3 shrink-0" />
                      <span>
                        Supera el peso máximo de esta tarifa. Se puede continuar;
                        confirmá con la paquetería antes de cerrar.
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {isAir && (
                    <>
                      <div>Peso masa: {massWeight.toFixed(2)} {pkg.weightUnit}</div>
                      <div>Peso volumétrico: {volumetricWeight.toFixed(2)} {pkg.weightUnit}</div>
                    </>
                  )}
                  <div className={isAir ? "font-semibold text-primary motion-safe:animate-pulse" : undefined}>
                    Peso a cotizar: {billableWeight.toFixed(2)} {pkg.weightUnit}
                    {isAir && <> (el mayor: {volumetricWeight > massWeight ? "volumétrico" : "masa"})</>}
                  </div>
                </>
              )}
            </div>
          </div>

          {selectedRate && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Truck className="size-3" />
                  Servicio seleccionado
                </div>
                <div className="text-sm font-medium">{selectedRate.serviceName}</div>
                {selectedRate.estimatedDays != null && (
                  <div className="text-xs text-muted-foreground">
                    {selectedRate.estimatedDays} día{selectedRate.estimatedDays !== 1 ? "s" : ""} hábil{selectedRate.estimatedDays !== 1 ? "es" : ""}
                  </div>
                )}
                {selectedRate.isOcurre && (
                  <Badge variant="secondary" className="text-xs">Ocurre</Badge>
                )}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
