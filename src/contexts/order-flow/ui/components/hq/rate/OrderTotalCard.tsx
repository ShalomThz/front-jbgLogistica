import {
  Button,
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
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const JBG_SERVICE_NAME = "JBG Logistics";

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
}

export function OrderTotalCard({ onSubmit, isSubmitting }: OrderTotalCardProps) {
  const { setValue, control } = useFormContext<HQOrderFormValues>();
  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });

  const isJBGRate = shippingService.selectedRate?.serviceName === JBG_SERVICE_NAME;
  const rateCurrency = shippingService.selectedRate?.price.currency ?? shippingService.currency;
  const costsCurrency = shippingService.costBreakdownCurrency;
  const displayCurrency = shippingService.currency;

  const needsRateConversion = rateCurrency !== displayCurrency;
  const needsCostsConversion = costsCurrency !== displayCurrency;

  const { exchangeRate: rateExchange } = useExchangeRate({
    from: rateCurrency,
    to: displayCurrency,
    enabled: needsRateConversion,
  });
  const rateConversionRate = needsRateConversion ? rateExchange?.rate ?? null : 1;

  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: displayCurrency,
    enabled: needsCostsConversion,
  });
  const costsConversionRate = needsCostsConversion ? costsExchange?.rate ?? null : 1;

  const handleCustomPriceChange = (value: string) => {
    if (!shippingService.selectedRate) return;
    const amount = parseFloat(value) || 0;
    setValue("shippingService.selectedRate", {
      ...shippingService.selectedRate,
      price: { ...shippingService.selectedRate.price, amount },
    });
  };

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

  const rateAmount = shippingService.selectedRate.price.amount;
  const costsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const convertedRate = rateConversionRate !== null ? rateAmount * rateConversionRate : null;
  const convertedCosts = costsConversionRate !== null ? costsTotal * costsConversionRate : null;
  const grandTotal = convertedRate !== null && convertedCosts !== null ? convertedRate + convertedCosts : null;

  return (
    <div className="space-y-4">
      <Card>
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
          {/* Precio del servicio */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Precio del servicio</span>
            {isJBGRate ? (
              <div className="relative w-28">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={rateAmount ?? ""}
                  onChange={(e) => handleCustomPriceChange(e.target.value)}
                  className="h-7 pl-5 pr-12 text-xs text-right"
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{rateCurrency}</span>
              </div>
            ) : (
              <span className="text-sm">${rateAmount.toFixed(2)} {rateCurrency}</span>
            )}
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

          <Separator />

          {/* Total */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-xl font-bold text-blue-600">
              {grandTotal !== null ? `$${grandTotal.toFixed(2)} ${displayCurrency}` : "Calculando..."}
            </span>
          </div>

          {grandTotal !== null && (
            <div className="flex justify-end">
              <CurrencyConversion amount={grandTotal} from={displayCurrency} />
            </div>
          )}

          <div className="text-xs text-muted-foreground text-right">(Incluye IVA)</div>
        </CardContent>
      </Card>

      <Button
        className="w-full bg-blue-600 hover:bg-blue-700"
        onClick={onSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Confirmando envío..." : "Confirmar envío"}
      </Button>
    </div>
  );
}
