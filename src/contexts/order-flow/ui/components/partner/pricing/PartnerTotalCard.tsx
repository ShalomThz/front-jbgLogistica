import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { HelpCircle } from "lucide-react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { PendingPaymentControl } from "@contexts/order-flow/ui/components/order/orders-table/PendingPaymentControl";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerTotalCardProps {
  tariffPrice: MoneyPrimitives | null;
  orderId?: string;
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
}

export function PartnerTotalCard({
  tariffPrice,
  orderId,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
}: PartnerTotalCardProps) {
  const { control, register } = useFormContext<PartnerOrderFormValues>();
  const shippingService = useWatch<PartnerOrderFormValues, "shippingService">({ name: "shippingService" });

  const displayCurrency = shippingService.currency;
  const tariffCurrency = tariffPrice?.currency ?? displayCurrency;
  const costsCurrency = shippingService.costBreakdownCurrency;

  const needsTariffConversion = tariffCurrency !== displayCurrency;
  const needsCostsConversion = costsCurrency !== displayCurrency;

  const { exchangeRate: tariffExchange } = useExchangeRate({
    from: tariffCurrency,
    to: displayCurrency,
    enabled: needsTariffConversion,
  });
  const tariffConversionRate = needsTariffConversion ? tariffExchange?.rate ?? null : 1;

  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: displayCurrency,
    enabled: needsCostsConversion,
  });
  const costsConversionRate = needsCostsConversion ? costsExchange?.rate ?? null : 1;

  const tariffAmount = tariffPrice?.amount ?? 0;
  const costsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const convertedTariff = tariffConversionRate !== null ? tariffAmount * tariffConversionRate : null;
  const convertedCosts = costsConversionRate !== null ? costsTotal * costsConversionRate : null;
  const grandTotal = convertedTariff !== null && convertedCosts !== null ? convertedTariff + convertedCosts : null;

  // El libro de abonos se concilia en la MONEDA DE FACTURACIÓN (la de la
  // tarifa), no en la de visualización: el backend calcula totalBilled así, y
  // redondear el saldo en otra moneda antes de convertirlo pierde bastante más
  // que un centavo — por eso liquidar dejaba la orden en parcial.
  //
  // El número grande sigue mostrándose en la moneda elegida; lo que cambia es
  // contra qué se cobra.
  const needsCostsToTariff = costsCurrency !== tariffCurrency;
  const { exchangeRate: costsToTariffExchange } = useExchangeRate({
    from: costsCurrency,
    to: tariffCurrency,
    enabled: needsCostsToTariff,
  });
  const costsToTariffRate = needsCostsToTariff
    ? (costsToTariffExchange?.rate ?? null)
    : 1;
  const billedTotal =
    costsToTariffRate !== null ? tariffAmount + costsTotal * costsToTariffRate : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Desglose de costos</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {tariffPrice && (
            <div className="flex justify-between text-sm">
              {/* Explícito: en esta card ahora conviven dos montos de dos
                  relaciones distintas, y "precio del servicio" no decía cuál. */}
              <span>Tarifa JBG</span>
              <span>${tariffAmount.toFixed(2)} {tariffCurrency}</span>
            </div>
          )}

          {COST_BREAKDOWN_FIELDS.map((field) => {
            const val = parseFloat(shippingService.costBreakdown[field]);
            if (!val || val <= 0) return null;
            return (
              <div key={field} className="flex justify-between text-sm text-muted-foreground">
                <span>{COST_LABELS[field]}</span>
                <span>${val.toFixed(2)} {costsCurrency}</span>
              </div>
            );
          })}

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              {/* "Total a cobrar" quedó ambiguo al entrar el cobro al cliente
                  del socio: cobrar, ¿a quién? Éste es el que el socio le paga
                  a JBG. */}
              <span className="text-sm font-medium text-muted-foreground">Total a pagar a JBG</span>
              <Controller
                control={control}
                name="shippingService.currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-6 w-20 text-xs px-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MXN">MXN</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {grandTotal !== null ? `$${grandTotal.toFixed(2)} ${displayCurrency}` : "Calculando..."}
            </div>
            {(needsTariffConversion || needsCostsConversion) && grandTotal !== null && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {needsTariffConversion && (
                  <div>Servicio: ${tariffAmount.toFixed(2)} {tariffCurrency}</div>
                )}
                {needsCostsConversion && costsTotal > 0 && (
                  <div>Costos: ${costsTotal.toFixed(2)} {costsCurrency}</div>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Debajo del total y no arriba: primero lo que el socio le debe a
              JBG, después lo que él le cobra por su lado. Los dos montos son de
              relaciones distintas y ninguno entra en el otro. */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium">Cobro a tu cliente</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  Es el monto que sale en la factura que le entregas a tu
                  cliente, en lugar de la tarifa JBG. No cambia lo que le pagas
                  a JBG ni tus abonos. Opcional: sin esto la orden se crea igual
                  y solo queda sin factura.
                </TooltipContent>
              </Tooltip>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-10 pl-6 pr-14 font-semibold"
                {...register("partnerSale")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {tariffCurrency}
              </span>
            </div>
          </div>

          <Separator />

          <PendingPaymentControl
            grandTotal={billedTotal}
            currency={tariffCurrency}
            orderId={orderId}
            pendingPayments={pendingPayments}
            onAddPayment={onAddPayment}
            onRemovePayment={onRemovePayment}
            onClearPayments={onClearPayments}
          />
        </div>
      </CardContent>
    </Card>
  );
}
