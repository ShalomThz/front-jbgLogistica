import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Label,
  Progress,
  Separator,
  Skeleton,
} from "@contexts/shared/shadcn";
import { AlertTriangle, CheckCircle2, Edit, MapPin, Package, RefreshCw, Truck, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { calculateTotal, calculateBillableWeight } from "@contexts/order-flow/domain/services/packageCalculations";
import { OrderShipmentSection } from "../order/OrderShipmentSection";
import { OrderLabelSection } from "../order/OrderLabelSection";

const JBG_SERVICE_NAME = "JBG Logistics";

interface RateStepProps {
  rates: RatePrimitives[];
  isLoadingRates: boolean;
  tariffNotFound: boolean;
  ratesError: string | null;
  onRefetch: () => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  fulfilledShipment: ShipmentPrimitives | null;
  onFinish: () => void;
}

export function RateStep({
  rates,
  isLoadingRates,
  tariffNotFound,
  ratesError,
  onRefetch,
  onSubmit,
  onBack,
  isSubmitting,
  fulfilledShipment,
  onFinish,
}: RateStepProps) {
  const { setValue, control } = useFormContext<NewOrderFormValues>();

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
              <OrderLabelSection label={fulfilledShipment.label} />
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

            {/* Tariff not found warning */}
            {tariffNotFound && !isLoadingRates && (
              <div className="flex items-center gap-2 py-3 px-3 my-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-xs">
                  No se encontró una tarifa configurada para esta combinación de zona, caja y país destino. El precio de JBG Logistics no fue ajustado.
                </p>
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
                    <div className="col-span-3 flex items-center">
                      <div className="font-medium text-sm">{rate.serviceName}</div>
                    </div>

                    <div className="col-span-3 flex items-center">
                      <div className="space-y-1">
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
                          ${rate.price.amount.toFixed(2)} {rate.price.currency}
                        </div>
                        {rate.insuranceFee.amount > 0 && (
                          <div className="text-xs text-muted-foreground">
                            Seguro: ${rate.insuranceFee.amount.toFixed(2)}
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
                  <span className="absolute right-2.5 top-2.5 text-sm text-muted-foreground">MXN</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* SOS Protection */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Controller
                control={control}
                name="shippingService.sosProtection"
                render={({ field }) => (
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <div className="space-y-2 flex-1">
                <div className="font-medium text-sm">SOS Protección</div>
                <div className="text-xs text-muted-foreground">
                  Protege el envío ante robo, daño y más. Al usar la opción, aceptas los{" "}
                  <Button variant="link" className="h-auto p-0 text-xs text-blue-600">
                    términos y condiciones
                  </Button>
                  .
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Valor declarado</Label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-2.5 text-xs text-muted-foreground">$</span>
                    <Input
                      {...control.register("shippingService.sosValue")}
                      className="pl-6 text-xs"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Declara un valor entre $100 MXN y $100,000 MXN.
                  </div>
                </div>
              </div>
            </div>
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
                    <span>${shippingService.selectedRate.price.amount.toFixed(2)} {shippingService.selectedRate.price.currency}</span>
                  </div>

                  {shippingService.sosProtection && (
                    <div className="flex justify-between text-sm">
                      <span>SOS Protección</span>
                      <span>$14.00 MXN</span>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between font-bold">
                    <span>Monto total:</span>
                    <div className="text-right">
                      <div className="text-blue-600">${calculateTotal(shippingService).toFixed(2)} MXN</div>
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
