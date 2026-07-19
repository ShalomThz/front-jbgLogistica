import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Info, Tag } from "lucide-react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { PendingPaymentControl } from "@contexts/order-flow/ui/components/order/orders-table/PendingPaymentControl";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;
type CostField = (typeof COST_BREAKDOWN_FIELDS)[number];

const COST_LABELS: Record<CostField, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface OrderTotalCardProps {
  onSubmit: () => void;
  isSubmitting: boolean;
  disabled?: boolean;
  /** Orden ya creada: muestra sus abonos ya registrados en el control de pago. */
  orderId?: string;
  /** Abonos capturados en el paso (locales; se suben al finalizar la orden). */
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
}

export function OrderTotalCard({
  onSubmit,
  isSubmitting,
  disabled = false,
  orderId,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
}: OrderTotalCardProps) {
  const { control } = useFormContext<HQOrderFormValues>();
  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });

  // --- all derived values and hooks must be above any early return ---
  const tariffCurrency = shippingService.tariff?.currency ?? shippingService.currency;
  const costsCurrency = shippingService.costBreakdownCurrency;
  const displayCurrency = shippingService.currency;
  const discountCurrency = shippingService.discount?.currency ?? displayCurrency;

  const needsTariffConversion = tariffCurrency !== displayCurrency;
  const needsCostsConversion = costsCurrency !== displayCurrency;
  const needsDiscountConversion = discountCurrency !== displayCurrency;

  const { exchangeRate: tariffExchange } = useExchangeRate({
    from: tariffCurrency,
    to: displayCurrency,
    enabled: needsTariffConversion,
  });
  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: displayCurrency,
    enabled: needsCostsConversion,
  });
  const { exchangeRate: discountExchange } = useExchangeRate({
    from: discountCurrency,
    to: displayCurrency,
    enabled: needsDiscountConversion,
  });

  const tariffConversionRate = needsTariffConversion ? tariffExchange?.rate ?? null : 1;
  const costsConversionRate = needsCostsConversion ? costsExchange?.rate ?? null : 1;
  const discountConversionRate = needsDiscountConversion ? discountExchange?.rate ?? null : 1;

  if (!shippingService.selectedRate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-4 text-muted-foreground text-sm">
            Selecciona un servicio para ver el total
          </div>
        </CardContent>
      </Card>
    );
  }

  const tariffAmount = shippingService.tariff?.amount ?? 0;
  const costsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);
  const discountAmount = parseFloat(shippingService.discount?.amount ?? "") || 0;
  const convertedDiscount = discountConversionRate !== null ? discountAmount * discountConversionRate : null;
  const convertedTariff = tariffConversionRate !== null ? tariffAmount * tariffConversionRate : null;
  const convertedCosts = costsConversionRate !== null ? costsTotal * costsConversionRate : null;
  const grandTotal =
    convertedTariff !== null && convertedCosts !== null
      ? convertedTariff + convertedCosts - (convertedDiscount ?? 0)
      : null;

  return (
    <div className="space-y-4">
      <Card className="font-mono border-dashed border-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Resumen de cobro</CardTitle>
            <Controller
              control={control}
              name="shippingService.currency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="h-7 w-20 text-xs px-2">
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
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          {/* Tarifa asignada (solo lectura) */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tarifa asignada</span>
            <span>${tariffAmount.toFixed(2)} {tariffCurrency}</span>
          </div>

          {/* Costos adicionales */}
          {COST_BREAKDOWN_FIELDS.map((field) => {
            const val = parseFloat(shippingService.costBreakdown[field]);
            if (!val || val <= 0) return null;
            return (
              <div key={field} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{COST_LABELS[field]}</span>
                <span>${val.toFixed(2)} {costsCurrency}</span>
              </div>
            );
          })}

          {/* Descuento (read-only, entered in AdditionalCostsCard) */}
          {discountAmount > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Tag className="size-3" />
                {shippingService.discount?.concept || "Descuento"}
              </span>
              <span className="text-red-600">
                -${discountAmount.toFixed(2)} {discountCurrency}
              </span>
            </div>
          )}

          <div className="my-2 border-t-2 border-dashed border-muted-foreground/40" />

          {/* Total */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">Total</span>
            <div className="flex items-center gap-1.5">
              {grandTotal !== null && displayCurrency !== "MXN" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    >
                      <Info className="size-3.5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="end">
                    <CurrencyConversion amount={grandTotal} from={displayCurrency} />
                  </PopoverContent>
                </Popover>
              )}
              <span className="text-xl font-bold text-emerald-600">
                {grandTotal !== null ? `$${grandTotal.toFixed(2)} ${displayCurrency}` : "Calculando..."}
              </span>
            </div>
          </div>

          <div className="text-xs text-muted-foreground text-right">(Incluye IVA)</div>

          <div className="my-2 border-t-2 border-dashed border-muted-foreground/40" />

          <PendingPaymentControl
            grandTotal={grandTotal}
            currency={displayCurrency}
            orderId={orderId}
            pendingPayments={pendingPayments}
            onAddPayment={onAddPayment}
            onRemovePayment={onRemovePayment}
            onClearPayments={onClearPayments}
          />
        </CardContent>
      </Card>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={onSubmit}
        disabled={isSubmitting || disabled}
      >
        {isSubmitting ? "Confirmando envío..." : "Confirmar envío"}
      </Button>
    </div>
  );
}
