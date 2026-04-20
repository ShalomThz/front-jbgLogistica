import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
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
  markAsPaid: boolean;
  onMarkAsPaidChange: (value: boolean) => void;
}

export function PartnerTotalCard({ tariffPrice, markAsPaid, onMarkAsPaidChange }: PartnerTotalCardProps) {
  const { control } = useFormContext<PartnerOrderFormValues>();
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

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {tariffPrice && (
            <div className="flex justify-between text-sm">
              <span>Precio del servicio</span>
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

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Estado de pago</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-7 w-28 flex items-center justify-between px-3 text-xs">
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

          <div className="rounded-lg bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">Total a cobrar</span>
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
        </div>
      </CardContent>
    </Card>
  );
}
