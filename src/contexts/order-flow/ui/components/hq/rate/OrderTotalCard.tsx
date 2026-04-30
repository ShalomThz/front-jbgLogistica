import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { ChevronDown, Info } from "lucide-react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
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
  markAsPaid: boolean;
  onMarkAsPaidChange: (value: boolean) => void;
  disabled?: boolean;
}

export function OrderTotalCard({ onSubmit, isSubmitting, markAsPaid, onMarkAsPaidChange, disabled = false }: OrderTotalCardProps) {
  const { setValue, control } = useFormContext<HQOrderFormValues>();
  const shippingService = useWatch<HQOrderFormValues, "shippingService">({ name: "shippingService" });

  const tariffCurrency = shippingService.tariff?.currency ?? shippingService.currency;
  const costsCurrency = shippingService.costBreakdownCurrency;
  const displayCurrency = shippingService.currency;

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

  const handleTariffChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setValue("shippingService.tariff", { amount, currency: tariffCurrency });
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

  const tariffAmount = shippingService.tariff?.amount ?? 0;
  const costsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const convertedTariff = tariffConversionRate !== null ? tariffAmount * tariffConversionRate : null;
  const convertedCosts = costsConversionRate !== null ? costsTotal * costsConversionRate : null;
  const grandTotal = convertedTariff !== null && convertedCosts !== null ? convertedTariff + convertedCosts : null;

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
          {/* Tarifa asignada */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tarifa asignada</span>
            <div className="relative w-40">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={tariffAmount || ""}
                onChange={(e) => handleTariffChange(e.target.value)}
                className="h-7 pl-5 pr-12 text-xs text-right"
                placeholder="0.00"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{tariffCurrency}</span>
            </div>
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

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado de pago</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={`h-7 w-28 flex items-center justify-between px-3 text-xs ${
                    markAsPaid
                      ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800"
                      : "border-red-300 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                  }`}
                >
                  {markAsPaid ? "Pagado" : "No pagado"}
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onMarkAsPaidChange(true)}>Pagado</DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMarkAsPaidChange(false)}>No pagado</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
