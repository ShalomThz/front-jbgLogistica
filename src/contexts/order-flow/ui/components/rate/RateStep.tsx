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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Skeleton,
} from "@contexts/shared/shadcn";
import { CheckCircle2, Edit, MapPin, Package, RefreshCw, Truck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { calculateTotal, calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";
import { OrderShipmentSection } from "../order/OrderShipmentSection";
import { OrderLabelSection } from "../order/OrderLabelSection";

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
  partnerPrice?: MoneyPrimitives | null;
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
  partnerPrice,
}: RateStepProps) {
  const { setValue, register, control } = useFormContext<NewOrderFormValues>();

  const shippingService = useWatch<NewOrderFormValues, "shippingService">({ name: "shippingService" });
  const sender = useWatch<NewOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<NewOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<NewOrderFormValues, "package">({ name: "package" });

  const isJBGRate = shippingService.selectedRate?.serviceName === JBG_SERVICE_NAME;

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

  const handleCustomPriceChange = (value: string) => {
    if (!shippingService.selectedRate) return;
    const amount = parseFloat(value) || 0;
    setValue("shippingService.selectedRate", {
      ...shippingService.selectedRate,
      price: { ...shippingService.selectedRate.price, amount },
    });
  };

  if (fulfilledShipment) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-green-600">
              <CheckCircle2 className="size-5" />
              Envío creado exitosamente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <OrderShipmentSection shipment={fulfilledShipment} />
            {fulfilledShipment.label && (
              <OrderLabelSection
                label={fulfilledShipment.label}
                shipmentId={fulfilledShipment.id}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onFinish}>Ir a órdenes</Button>
        </div>
      </div>
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
      </div>

      {/* Sidebar Summary */}
      <div className="space-y-4">
        {/* Partner Price */}
        {partnerPrice && (
          <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-500/15">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Precio cobrado por el partner</span>
                <span className="text-lg font-bold">${partnerPrice.amount.toFixed(2)} {partnerPrice.currency}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Shipment Summary: sender, recipient, package */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resumen de envío</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="h-auto p-0 text-xs text-primary hover:text-primary/80"
              >
                <Edit className="size-3 mr-1" />
                Editar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            {/* Sender */}
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

            {/* Recipient */}
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

            {/* Package */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <Package className="size-3" />
                Paquete
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div>{pkg.length} x {pkg.width} x {pkg.height} {pkg.dimensionUnit}</div>
                <div>Peso a cotizar: {calculateBillableWeight(pkg).toFixed(2)} kg</div>
                {pkg.quantity && Number(pkg.quantity) > 1 && (
                  <div>Cantidad: {pkg.quantity}</div>
                )}
              </div>
            </div>

            {/* Selected service */}
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
        </Card>

        {/* JBG Custom Price */}
        {isJBGRate && (
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="font-medium text-sm">Precio personalizado</div>
                <p className="text-xs text-muted-foreground">
                  Puedes ajustar el precio de envío para JBG Logistics.
                </p>
                <div className="relative">
                  <span className="absolute left-2.5 top-2.5 text-sm text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={shippingService.selectedRate?.price.amount ?? ""}
                    onChange={(e) => handleCustomPriceChange(e.target.value)}
                    className="pl-6"
                    placeholder="0.00"
                  />
                  <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">{shippingService.currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Costos adicionales */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Costos adicionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
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
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {shippingService.selectedRate && (
                <>
                  <div className="flex justify-between text-sm">
                    <span>Precio del envío</span>
                    <span>${shippingService.selectedRate.price.amount.toFixed(2)} {isJBGRate ? shippingService.currency : shippingService.selectedRate.price.currency}</span>
                  </div>

                  {COST_BREAKDOWN_FIELDS.map((field) => {
                    const val = parseFloat(shippingService.costBreakdown[field]);
                    if (!val || val <= 0) return null;
                    return (
                      <div key={field} className="flex justify-between text-sm">
                        <span>{COST_LABELS[field]}</span>
                        <span>${val.toFixed(2)} {isJBGRate ? shippingService.currency : shippingService.selectedRate!.price.currency}</span>
                      </div>
                    );
                  })}

                  <Separator />

                  {isJBGRate && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs">Moneda</Label>
                        <Controller
                          control={control}
                          name="shippingService.currency"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="MXN">MXN - Peso mexicano</SelectItem>
                                <SelectItem value="USD">USD - Dólar americano</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <Separator />
                    </>
                  )}

                  <div className="flex justify-between font-bold">
                    <span>Monto total:</span>
                    <div className="text-right">
                      <div className="text-blue-600">${calculateTotal(shippingService).toFixed(2)} {isJBGRate ? shippingService.currency : shippingService.selectedRate.price.currency}</div>
                      <div className="text-xs text-muted-foreground">(Incluye IVA)</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creando envío..." : "Crear envío"}
                  </Button>
                </>
              )}

              {!shippingService.selectedRate && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  Selecciona un servicio para ver el total
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
