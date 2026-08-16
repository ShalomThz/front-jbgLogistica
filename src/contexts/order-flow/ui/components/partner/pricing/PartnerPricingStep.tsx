import { ServiceLevelSelector } from "../../shared/ServiceLevelSelector";
import { ZoneSelector } from "@contexts/pricing/ui/components/zone/ZoneSelector";
import {
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_LABELS,
  type ServiceLevel,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { Badge, Card, CardContent } from "@contexts/shared/shadcn";
import { AlertTriangle, Gauge, Handshake, MapPin, Package } from "lucide-react";
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { PartnerAdditionalCostsCard } from "./PartnerAdditionalCostsCard";
import { PartnerTariffCard } from "./PartnerTariffCard";
import { PartnerOrderSummaryCard } from "./PartnerOrderSummaryCard";
import { PartnerTotalCard } from "./PartnerTotalCard";
import { SignatureCard } from "../../shared/SignatureCard";

interface PartnerPricingStepProps {
  tariffPrice: MoneyPrimitives | null;
  effectiveTariff: MoneyPrimitives | null;
  onTariffChange: (value: MoneyPrimitives) => void;
  isLoadingPrice: boolean;
  tariffError: string | null;
  refetchPrice: () => void;
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
  /** Orden ya existente (edición): muestra sus abonos ya registrados. */
  orderId?: string;
  /** Zona efectiva usada en la búsqueda de tarifa (override o la de la tienda). */
  zoneId?: string;
  /** Presente solo si el usuario tiene permiso para cambiar la zona. */
  onZoneChange?: (zoneId: string) => void;
  serviceLevel: ServiceLevel;
  onServiceLevelChange: (serviceLevel: ServiceLevel) => void;
}

/**
 * Muestra la combinación exacta que no tiene precio, para que el vendedor la
 * reporte a JBG sin adivinar. Los tres factores son los que forman la clave de
 * la tarifa: zona de recolección, caja y servicio — el país destino ya no
 * participa del precio.
 */
function TariffNotFoundCard({
  zoneId,
  serviceLevel,
}: {
  zoneId?: string;
  serviceLevel: ServiceLevel;
}) {
  const { control } = useFormContext<PartnerOrderFormValues>();
  const packageType = useWatch<PartnerOrderFormValues, "package.packageType">({
    control,
    name: "package.packageType",
  });

  // Se busca solo la zona en uso: el catálogo se pagina y traerlo entero para
  // resolver un nombre ya no es viable.
  const zoneFilters = useMemo(
    () => (zoneId ? [{ field: "id", filterOperator: "=" as const, value: zoneId }] : []),
    [zoneId],
  );
  const { zones } = useZones({ filters: zoneFilters, enabled: !!zoneId });
  const zone = zones[0];

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="flex items-start gap-3 pt-6">
        <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">
            No se encontró tarifa para esta orden
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1.5 py-1">
              <MapPin className="size-3.5" />
              <span className="text-[10px] uppercase tracking-wide opacity-70">Zona</span>
              {zone ? `${zone.name} · ${zone.state}` : "—"}
            </Badge>
            <Badge variant="secondary" className="gap-1.5 py-1">
              <Package className="size-3.5" />
              <span className="text-[10px] uppercase tracking-wide opacity-70">Caja</span>
              {packageType || "—"}
            </Badge>
            <Badge
              variant="secondary"
              className={`gap-1.5 py-1 ${SERVICE_LEVEL_COLORS[serviceLevel]}`}
            >
              <Gauge className="size-3.5" />
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                Servicio
              </span>
              {SERVICE_LEVEL_LABELS[serviceLevel]}
            </Badge>
            <Badge variant="outline" className="gap-1.5 py-1">
              <Handshake className="size-3.5" />
              <span className="text-[10px] uppercase tracking-wide opacity-70">
                Precio
              </span>
              Socio
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Comunícate con JBG para que se asigne una tarifa a esta combinación, o
            escribe el precio a mano para continuar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartnerPricingStep({
  tariffPrice,
  effectiveTariff,
  onTariffChange,
  isLoadingPrice,
  tariffError,
  refetchPrice,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  orderId,
  zoneId,
  onZoneChange,
  serviceLevel,
  onServiceLevelChange,
}: PartnerPricingStepProps) {
  const { control } = useFormContext<PartnerOrderFormValues>();
  const displayCurrency = useWatch<PartnerOrderFormValues, "shippingService.currency">({
    control,
    name: "shippingService.currency",
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {/* Zona, servicio y monto en una sola tarjeta y en la columna ancha:
            igual que el paso de cobro de HQ. Mover un insumo recotiza al
            instante y el efecto se ve ahí mismo. */}
        <PartnerTariffCard
          tariffPrice={tariffPrice}
          effectiveTariff={effectiveTariff}
          onTariffChange={onTariffChange}
          isLoading={isLoadingPrice}
          error={tariffError}
          onRefetch={refetchPrice}
          fallbackCurrency={displayCurrency}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {onZoneChange && (
              <ZoneSelector zoneId={zoneId} onZoneChange={onZoneChange} label="Zona" />
            )}
            <ServiceLevelSelector value={serviceLevel} onChange={onServiceLevelChange} />
          </div>
        </PartnerTariffCard>

        {tariffError && <TariffNotFoundCard zoneId={zoneId} serviceLevel={serviceLevel} />}

        <PartnerAdditionalCostsCard />
        <SignatureCard collapsible={false} />
      </div>

      <div className="space-y-4">
        <PartnerOrderSummaryCard />
        <PartnerTotalCard
          tariffPrice={effectiveTariff}
          orderId={orderId}
          pendingPayments={pendingPayments}
          onAddPayment={onAddPayment}
          onRemovePayment={onRemovePayment}
          onClearPayments={onClearPayments}
        />
      </div>
    </div>
  );
}
