import { useMemo } from "react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { OrderPricingPrimitives } from "@contexts/sales/domain/schemas/order/Order";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import {
  AlertTriangle,
  Gauge,
  Handshake,
  Loader2,
  MapPin,
  RotateCcw,
  Store,
  Users,
} from "lucide-react";
import { ZoneSelector } from "@contexts/pricing/ui/components/zone/ZoneSelector";
import { ServiceLevelSelector } from "../../shared/ServiceLevelSelector";
import { CreateTariffButton } from "@contexts/pricing/ui/components/tariff/CreateTariffButton";
import {
  PRICE_TYPE_LABELS,
  SERVICE_LEVEL_COLORS,
  SERVICE_LEVEL_LABELS,
  priceTypes,
  type PriceType,
  type ServiceLevel,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import { SignatureCard } from "../../shared/SignatureCard";
import { AdditionalCostsCard } from "./AdditionalCostsCard";
import { OrderTotalCard } from "./OrderTotalCard";

interface CobroStepProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  tariff: MoneyPrimitives | null;
  orderId?: string;

  /** Insumos de la tarifa: cambiarlos recotiza en el momento. */
  zoneId: string;
  onZoneChange?: (zoneId: string) => void;
  serviceLevel: ServiceLevel;
  onServiceLevelChange: (serviceLevel: ServiceLevel) => void;
  priceType: PriceType;
  onPriceTypeChange: (priceType: PriceType) => void;
  boxId: string;
  isLoadingTariff: boolean;
  tariffError: string | null;
  /** Lo que sugirió la tabla, para contrastarlo con lo que se va a cobrar. */
  suggestedTariff: MoneyPrimitives | null;
  onTariffChange: (tariff: MoneyPrimitives | null) => void;
  /** Con qué datos tomó la orden la tienda socia, cuando esta venta continúa
   * una orden partner. Null en una orden HQ de mostrador. */
  partnerPricing: OrderPricingPrimitives | null;

  /** Abonos capturados en este paso (locales; se suben al finalizar). */
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
}

const PRICE_TYPE_ICON = { PUBLIC: Users, PARTNER: Handshake } as const;

/**
 * Los insumos de la tarifa viven acá y no en el paso de cotización porque es
 * acá donde el precio se cobra: mover zona, servicio o tipo de precio recotiza
 * al instante y el operador ve el efecto sobre lo que va a cobrar.
 */
export function CobroStep({
  onSubmit,
  isSubmitting,
  tariff,
  orderId,
  zoneId,
  onZoneChange,
  serviceLevel,
  onServiceLevelChange,
  priceType,
  onPriceTypeChange,
  boxId,
  isLoadingTariff,
  tariffError,
  suggestedTariff,
  onTariffChange,
  partnerPricing,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
}: CobroStepProps) {
  // Solo la zona de la cotización del socio, no el catálogo entero.
  const partnerZoneFilters = useMemo(
    () =>
      partnerPricing
        ? [{ field: "id", filterOperator: "=" as const, value: partnerPricing.zoneId }]
        : [],
    [partnerPricing],
  );
  const { zones: partnerZones } = useZones({
    filters: partnerZoneFilters,
    enabled: !!partnerPricing,
  });
  const partnerZoneName = partnerZones[0]?.name;

  const noTariff = !isLoadingTariff && (!!tariffError || !tariff);
  const currency = tariff?.currency ?? suggestedTariff?.currency ?? "MXN";
  const wasEdited =
    !!suggestedTariff && !!tariff && suggestedTariff.amount !== tariff.amount;

  // Vaciar el campo es cero, no "sin override": si fuera null volvería a
  // aparecer la sugerencia mientras se borra. Mismo criterio que el flujo
  // partner, y cero deja el botón de cobrar deshabilitado.
  const handleAmountChange = (raw: string) => {
    const amount = Number.parseFloat(raw);
    onTariffChange({
      amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
      currency,
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6 flex-1 min-h-0 overflow-auto p-2">
      <div className="lg:col-span-2 space-y-4">
        {/* La orden ya venía cotizada por el socio. Se muestra tal cual quedó
            registrada para no re-cotizar a ciegas: si acá se elige otra zona o
            servicio, es una decisión, no un descuido. */}
        {partnerPricing && (
          <Card className="border-sky-500/40 bg-sky-500/5 shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Store className="size-4" />
                Datos con los que la tienda socia tomó la orden
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Cotizado el{" "}
                {new Date(partnerPricing.quotedAt).toLocaleString("es-MX")}
              </p>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="gap-1.5 py-1">
                <MapPin className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  Zona
                </span>
                {partnerZoneName ?? partnerPricing.zoneId}
              </Badge>
              <Badge
                variant="secondary"
                className={`gap-1.5 py-1 ${SERVICE_LEVEL_COLORS[partnerPricing.serviceLevel]}`}
              >
                <Gauge className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  Servicio
                </span>
                {SERVICE_LEVEL_LABELS[partnerPricing.serviceLevel]}
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1">
                <Handshake className="size-3.5" />
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  Precio
                </span>
                {PRICE_TYPE_LABELS[partnerPricing.priceType]}
              </Badge>
              <Badge variant="outline" className="gap-1.5 py-1 font-mono">
                <span className="text-[10px] uppercase tracking-wide opacity-70">
                  Tarifa
                </span>
                ${partnerPricing.price.amount.toFixed(2)}{" "}
                {partnerPricing.price.currency}
              </Badge>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Tarifa</CardTitle>
            <p className="text-sm text-muted-foreground">
              Zona de recolección, servicio y a quién se le cobra.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <ZoneSelector
                zoneId={zoneId || undefined}
                onZoneChange={onZoneChange ?? (() => undefined)}
                disabled={!onZoneChange}
                label="Zona"
              />
              <ServiceLevelSelector
                value={serviceLevel}
                onChange={onServiceLevelChange}
              />
              <div className="space-y-1">
                <Label htmlFor="price-type" className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  Tipo de precio
                </Label>
                <Select
                  value={priceType}
                  onValueChange={(v) => onPriceTypeChange(v as PriceType)}
                >
                  <SelectTrigger id="price-type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTypes.map((type) => {
                      const Icon = PRICE_TYPE_ICON[type];
                      return (
                        <SelectItem key={type} value={type}>
                          <span className="flex items-center gap-2">
                            <Icon className="size-3.5" />
                            {PRICE_TYPE_LABELS[type]}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border bg-muted/30 px-4 py-3">
              {isLoadingTariff ? (
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Buscando tarifa...
                </span>
              ) : noTariff ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-sm text-destructive">
                    <AlertTriangle className="size-4 shrink-0" />
                    No hay tarifa para esta combinación
                  </span>
                  {!!zoneId && !!boxId && (
                    <CreateTariffButton
                      zoneId={zoneId}
                      boxId={boxId}
                      serviceLevel={serviceLevel}
                      variant="outline"
                    />
                  )}
                </div>
              ) : null}

              {!isLoadingTariff && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <Label
                      htmlFor="tariff-amount"
                      className="text-sm text-muted-foreground"
                    >
                      Tarifa {PRICE_TYPE_LABELS[priceType].toLowerCase()}
                    </Label>
                    {wasEdited && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 gap-1 px-2 text-xs"
                        onClick={() => onTariffChange(null)}
                      >
                        <RotateCcw className="size-3" />
                        Volver a ${suggestedTariff!.amount.toFixed(2)}
                      </Button>
                    )}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="tariff-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={tariff?.amount || ""}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      className="h-11 pl-6 pr-14 text-lg font-bold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      {currency}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <AdditionalCostsCard />
        <SignatureCard />
      </div>

      <div className="space-y-4 lg:sticky lg:top-0">
        <OrderTotalCard
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          disabled={!tariff || tariff.amount <= 0}
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
