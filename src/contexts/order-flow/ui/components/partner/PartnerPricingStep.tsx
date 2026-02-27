import {
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
  Separator,
} from "@contexts/shared/shadcn";
import { AlertTriangle, Loader2, MapPin, Package, RefreshCw, User } from "lucide-react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { NewOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;
type CostField = (typeof COST_BREAKDOWN_FIELDS)[number];

const COST_LABELS: Record<CostField, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerPricingStepProps {
  tariffPrice: MoneyPrimitives | null;
  isLoadingPrice: boolean;
  tariffError: string | null;
  refetchPrice: () => void;
}

export function PartnerPricingStep({ tariffPrice, isLoadingPrice, tariffError, refetchPrice }: PartnerPricingStepProps) {
  const { register, control } = useFormContext<NewOrderFormValues>();

  const shippingService = useWatch<NewOrderFormValues, "shippingService">({ name: "shippingService" });
  const sender = useWatch<NewOrderFormValues, "sender">({ name: "sender" });
  const recipient = useWatch<NewOrderFormValues, "recipient">({ name: "recipient" });
  const pkg = useWatch<NewOrderFormValues, "package">({ name: "package" });

  const currency = shippingService.currency;

  const totalCosts = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cost Breakdown Inputs */}
      <div className="lg:col-span-2 space-y-4">
        {/* Tariff error alert */}
        {tariffError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  No se encontró tarifa para esta orden
                </p>
                <p className="text-sm text-muted-foreground">
                  Comunícate con JBG para que se asigne una tarifa a esta zona y destino antes de continuar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md shadow-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Costos adicionales</CardTitle>
            <p className="text-sm text-muted-foreground">
              Agrega los costos adicionales para esta orden. La tarifa base será calculada automáticamente.
            </p>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label className="text-xs">Moneda</Label>
              <Controller
                control={control}
                name="shippingService.currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-48">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    <span className="absolute right-2.5 top-2.5 text-xs text-muted-foreground">{currency}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sidebar Summary */}
      <div className="space-y-4">
        {/* Tariff */}
        <Card className={tariffError ? "border-destructive" : ""}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Tarifa</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={() => refetchPrice()}
                disabled={isLoadingPrice}
              >
                <RefreshCw className={`size-3.5 ${isLoadingPrice ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {isLoadingPrice ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <p className="text-sm">Buscando tarifa...</p>
              </div>
            ) : tariffError ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-sm">Sin tarifa asignada</p>
              </div>
            ) : tariffPrice ? (
              <div className="text-2xl font-bold text-primary">
                ${tariffPrice.amount.toFixed(2)} <span className="text-sm font-normal text-muted-foreground">{tariffPrice.currency}</span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No se pudo obtener la tarifa
              </p>
            )}
          </CardContent>
        </Card>

        {/* Shipment Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumen de orden</CardTitle>
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
                {pkg.packageType && <div>Caja: {pkg.packageType}</div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total costs */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {COST_BREAKDOWN_FIELDS.map((field) => {
                const val = parseFloat(shippingService.costBreakdown[field]);
                if (!val || val <= 0) return null;
                return (
                  <div key={field} className="flex justify-between text-sm">
                    <span>{COST_LABELS[field]}</span>
                    <span>${val.toFixed(2)} {currency}</span>
                  </div>
                );
              })}

              {totalCosts > 0 && (
                <>
                  <Separator />
                  <div className="flex justify-between font-bold">
                    <span>Costos adicionales:</span>
                    <span className="text-blue-600">${totalCosts.toFixed(2)} {currency}</span>
                  </div>
                </>
              )}

              {totalCosts === 0 && (
                <p className="text-center text-sm text-muted-foreground py-2">
                  Sin costos adicionales
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
