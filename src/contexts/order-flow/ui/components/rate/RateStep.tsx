import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Progress,
  Separator,
  Skeleton,
} from "@contexts/shared/shadcn";
import { ChevronDown, Edit, MapPin, Package, RefreshCw, Truck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { SignaturePad } from "@contexts/shared/ui/components/SignaturePad";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";
import { OrderTotalCard } from "./OrderTotalCard";
import { OrderSuccessView } from "../order/OrderSuccessView";

import ampmLogo from "@/assets/carriers/ampm.png";
import dhlLogo from "@/assets/carriers/dhl.png";
import estafetaLogo from "@/assets/carriers/estafeta.png";
import fedexLogo from "@/assets/carriers/fedex.png";
import jtExpressLogo from "@/assets/carriers/jt-express.png";
import ninetyMinutesLogo from "@/assets/carriers/ninetyminutes.png";
import paquetexpressLogo from "@/assets/carriers/paquetexpress.png";
import redpackLogo from "@/assets/carriers/redpack.png";
import upsLogo from "@/assets/carriers/ups.jpeg";
import jbgLogo from "@/assets/carriers/jbg.png";

const JBG_SERVICE_NAME = "JBG Logistics";

const CARRIER_LOGOS: Record<string, string> = {
  AMPM: ampmLogo,
  DHL: dhlLogo,
  ESTAFETA: estafetaLogo,
  FEDEX: fedexLogo,
  "J&T EXPRESS": jtExpressLogo,
  "99 MINUTOS": ninetyMinutesLogo,
  PAQUETEXPRESS: paquetexpressLogo,
  REDPACK: redpackLogo,
  UPS: upsLogo,
  "JBG LOGISTICS": jbgLogo,
};

const parseServiceName = (serviceName: string) => {
  const parts = serviceName.split(" - ");
  return { carrier: parts[0], service: parts.slice(1).join(" - ") || parts[0] };
};

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;
type CostField = (typeof COST_BREAKDOWN_FIELDS)[number];

const COST_LABELS: Record<CostField, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface RateStepProps {
  rates: RatePrimitives[];
  isLoadingRates: boolean;
  ratesError: string | null;
  onRefetch: () => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  fulfilledShipment: ShipmentPrimitives | null;
  onFinish: () => void;
  onCreateAnother?: () => void;
  partnerPrice?: MoneyPrimitives | null;
  partnerCostBreakdown?: CostBreakdownPrimitives;
}

export function RateStep({
  rates,
  isLoadingRates,
  ratesError,
  onRefetch,
  onSubmit,
  onBack,
  isSubmitting,
  fulfilledShipment,
  onFinish,
  onCreateAnother,
  partnerPrice,
  partnerCostBreakdown,
}: RateStepProps) {
  const { setValue, register, control } = useFormContext<HQOrderFormValues>();

  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });
  const sender = useWatch<HQOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<HQOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<HQOrderFormValues, "package">({ name: "package" });

  const [costsOpen, setCostsOpen] = useState(true);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [signatureOpen, setSignatureOpen] = useState(true);
  const extraCostsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const [loadingProgress, setLoadingProgress] = useState(0);
  useEffect(() => {
    if (!isLoadingRates) {
      setLoadingProgress(0);
      return;
    }
    setLoadingProgress(10);
    const interval = setInterval(() => {
      setLoadingProgress((prev) => (prev >= 85 ? 85 : prev + 5));
    }, 400);
    return () => clearInterval(interval);
  }, [isLoadingRates]);

  const handleRateSelection = (rate: RatePrimitives) => {
    setValue("shippingService.selectedRate", rate);
  };

  if (fulfilledShipment) {
    return (
      <OrderSuccessView
        shipment={fulfilledShipment}
        onFinish={onFinish}
        onCreateAnother={onCreateAnother}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Rate Selection */}
      <div className="lg:col-span-2">
        {isLoadingRates && (
          <Progress value={loadingProgress} className="mb-2 h-1" />
        )}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Truck className="size-4" />
                Selecciona un servicio de paquetería
              </CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onRefetch}
                disabled={isLoadingRates}
                className="h-7 gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isLoadingRates ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-0 pt-0">
            {/* Headers */}
            <div className="grid grid-cols-12 gap-3 pb-3 text-xs font-medium text-muted-foreground border-b">
              <div className="col-span-3">Paquetería</div>
              <div className="col-span-3">Servicio</div>
              <div className="col-span-3">Entrega estimada</div>
              <div className="col-span-3 text-right">Precio</div>
            </div>

            {/* Loading */}
            {isLoadingRates && (
              <div className="space-y-0">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="grid grid-cols-12 gap-3 py-4 border-b">
                    <div className="col-span-3"><Skeleton className="h-4 w-24" /></div>
                    <div className="col-span-3"><Skeleton className="h-4 w-20" /></div>
                    <div className="col-span-3"><Skeleton className="h-4 w-16" /></div>
                    <div className="col-span-3 flex justify-end"><Skeleton className="h-4 w-20" /></div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {ratesError && (
              <div className="py-8 text-center text-sm text-destructive">
                Error al cargar tarifas: {ratesError}
              </div>
            )}

            {/* Empty */}
            {!isLoadingRates && !ratesError && rates.length === 0 && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No se encontraron tarifas disponibles para este envío.
              </div>
            )}

            {/* Rate Options */}
            {!isLoadingRates && rates.length > 0 && (
              <div className="space-y-0">
                {rates.map((rate) => (
                  <div
                    key={rate.id}
                    className={`grid grid-cols-12 gap-3 py-4 border-b cursor-pointer transition-colors ${shippingService.selectedRate?.id === rate.id
                      ? "bg-primary/5 border-primary"
                      : "hover:bg-muted/50"
                      }`}
                    onClick={() => handleRateSelection(rate)}
                  >
                    <div className="col-span-3 flex items-center gap-2">
                      {(() => {
                        const { carrier } = parseServiceName(rate.serviceName);
                        const logo = CARRIER_LOGOS[carrier.toUpperCase()];
                        return logo ? (
                          <img src={logo} alt={carrier} className="size-6 object-contain rounded" />
                        ) : null;
                      })()}
                      <div className="font-medium text-sm">{parseServiceName(rate.serviceName).carrier}</div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      <div className="space-y-1">
                        <div className="text-sm">{parseServiceName(rate.serviceName).service}</div>
                        {rate.isOcurre && (
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            <span>Ocurre (sucursal)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      {rate.estimatedDays != null && (
                        <div className="text-sm text-muted-foreground">
                          {rate.estimatedDays} día{rate.estimatedDays !== 1 ? "s" : ""} hábil{rate.estimatedDays !== 1 ? "es" : ""}
                        </div>
                      )}
                    </div>

                    <div className="col-span-3 flex items-center justify-end">
                      <div className="text-right">
                        <div className="font-bold">
                          ${rate.price.amount.toFixed(2)} {rate.serviceName === JBG_SERVICE_NAME ? shippingService.currency : rate.price.currency}
                        </div>
                        {rate.insuranceFee.amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Seguro: ${rate.insuranceFee.amount.toFixed(2)} {rate.serviceName === JBG_SERVICE_NAME ? shippingService.currency : rate.price.currency}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Costos adicionales — Collapsible, debajo de la tabla */}
        <Card>
          <button
            type="button"
            onClick={() => setCostsOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <span className="text-sm font-semibold">Costos adicionales</span>
            <div className="flex items-center gap-2">
              {extraCostsTotal > 0 && (
                <span className="text-xs font-medium text-muted-foreground">${extraCostsTotal.toFixed(2)}</span>
              )}
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${costsOpen ? "rotate-180" : ""}`} />
            </div>
          </button>
          {costsOpen && (
            <CardContent className="pt-0 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {COST_BREAKDOWN_FIELDS.map((field) => (
                  <div key={field} className="space-y-1">
                    <Label className="text-xs">{COST_LABELS[field]}</Label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        {...register(`shippingService.costBreakdown.${field}`)}
                        className="pl-6 text-xs"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Firma — Collapsible */}
        {shippingService.selectedRate && (
          <Card>
            <button
              type="button"
              onClick={() => setSignatureOpen((v) => !v)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
            >
              <span className="text-sm font-semibold">Firma del cliente</span>
              <ChevronDown className={`size-4 text-muted-foreground transition-transform ${signatureOpen ? "rotate-180" : ""}`} />
            </button>
            {signatureOpen && (
              <CardContent className="pt-0 pb-4">
                <Controller
                  control={control}
                  name="customerSignature"
                  render={({ field }) => (
                    <SignaturePad onSignatureChange={field.onChange} />
                  )}
                />
              </CardContent>
            )}
          </Card>
        )}
      </div>

      {/* Sidebar Summary */}
      <div className="space-y-4">
        {/* Partner Breakdown + Margin */}
        {partnerPrice && (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-500/15">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Cobro del Agente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-0">
              <div className="flex justify-between text-sm">
                <span>Tarifa cobrada por el agente</span>
                <span>${partnerPrice.amount.toFixed(2)} {partnerPrice.currency}</span>
              </div>

              {partnerCostBreakdown && (() => {
                const extrasCost = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
                  const money = partnerCostBreakdown[field];
                  return sum + (money?.amount ?? 0);
                }, 0);
                const partnerTotal = partnerPrice.amount + extrasCost;
                return (
                  <>
                    {COST_BREAKDOWN_FIELDS.map((field) => {
                      const money = partnerCostBreakdown[field];
                      if (!money || money.amount <= 0) return null;
                      return (
                        <div key={field} className="flex justify-between text-sm text-muted-foreground">
                          <span>{COST_LABELS[field]}</span>
                          <span>${money.amount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total cobrado</span>
                      <span className="text-lg font-bold">${partnerTotal.toFixed(2)} {partnerPrice.currency}</span>
                    </div>
                  </>
                );
              })()}

              {!partnerCostBreakdown && (
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total cobrado</span>
                  <span className="text-lg font-bold">${partnerPrice.amount.toFixed(2)} {partnerPrice.currency}</span>
                </div>
              )}

            </CardContent>
          </Card>
        )}

        {/* Shipment Summary — Collapsible */}
        <Card>
          <button
            type="button"
            onClick={() => setSummaryOpen((v) => !v)}
            className="flex w-full items-center justify-between px-6 py-4 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Resumen de envío</span>
              <span
                role="button"
                onClick={(e) => { e.stopPropagation(); onBack(); }}
                className="inline-flex items-center text-xs text-primary hover:text-primary/80 cursor-pointer"
              >
                <Edit className="size-3 mr-1" />
                Editar
              </span>
            </div>
            <ChevronDown className={`size-4 text-muted-foreground transition-transform ${summaryOpen ? "rotate-180" : ""}`} />
          </button>
          {summaryOpen && (
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
                  <div>Peso a cotizar: {calculateBillableWeight(pkg).toFixed(2)} kg</div>
                </div>
              </div>

              {shippingService.selectedRate && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <Truck className="size-3" />
                      Servicio seleccionado
                    </div>
                    <div className="text-sm font-medium">{shippingService.selectedRate.serviceName}</div>
                    {shippingService.selectedRate.estimatedDays != null && (
                      <div className="text-xs text-muted-foreground">
                        {shippingService.selectedRate.estimatedDays} día{shippingService.selectedRate.estimatedDays !== 1 ? "s" : ""} hábil{shippingService.selectedRate.estimatedDays !== 1 ? "es" : ""}
                      </div>
                    )}
                    {shippingService.selectedRate.isOcurre && (
                      <Badge variant="secondary" className="text-xs">Ocurre</Badge>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          )}
        </Card>

        {/* Total + Button */}
        <OrderTotalCard onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </div>
    </div>
  );
}
