import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@contexts/shared/shadcn";
import { useState } from "react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerBreakdownCardProps {
  partnerPrice: MoneyPrimitives;
  costBreakdown?: CostBreakdownPrimitives;
}

export function PartnerBreakdownCard({ partnerPrice, costBreakdown }: PartnerBreakdownCardProps) {
  const tariffCurrency = partnerPrice.currency;
  const [displayCurrency, setDisplayCurrency] = useState(tariffCurrency);

  const costsCurrency = costBreakdown
    ? COST_BREAKDOWN_FIELDS.map((f) => costBreakdown[f]?.currency).find(Boolean) ?? tariffCurrency
    : tariffCurrency;

  // Convertir costos a moneda de la tarifa para calcular el total base
  const needsCostsConversion = costsCurrency !== tariffCurrency;
  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: tariffCurrency,
    enabled: needsCostsConversion,
  });
  const costsConversionRate = needsCostsConversion ? costsExchange?.rate ?? null : 1;

  // Convertir total base a la moneda de display
  const needsDisplayConversion = tariffCurrency !== displayCurrency;
  const { exchangeRate: displayExchange } = useExchangeRate({
    from: tariffCurrency,
    to: displayCurrency,
    enabled: needsDisplayConversion,
  });
  const displayConversionRate = needsDisplayConversion ? displayExchange?.rate ?? null : 1;

  const extrasCost = costBreakdown
    ? COST_BREAKDOWN_FIELDS.reduce((sum, field) => sum + (costBreakdown[field]?.amount ?? 0), 0)
    : 0;

  const convertedExtras = costsConversionRate !== null ? extrasCost * costsConversionRate : null;
  const baseTotal = convertedExtras !== null ? partnerPrice.amount + convertedExtras : null;
  const displayTotal = baseTotal !== null && displayConversionRate !== null ? baseTotal * displayConversionRate : null;

  return (
    <Card className="border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-500/15">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Cobro del Agente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex justify-between text-sm">
          <span>Tarifa cobrada por el agente</span>
          <span>${partnerPrice.amount.toFixed(2)} {tariffCurrency}</span>
        </div>

        {costBreakdown && (
          <>
            {COST_BREAKDOWN_FIELDS.map((field) => {
              const money = costBreakdown[field];
              if (!money || money.amount <= 0) return null;
              return (
                <div key={field} className="flex justify-between text-sm text-muted-foreground">
                  <span>{COST_LABELS[field]}</span>
                  <span>${money.amount.toFixed(2)} {money.currency}</span>
                </div>
              );
            })}
            <Separator />
          </>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total cobrado por el agente</span>
          <Select value={displayCurrency} onValueChange={setDisplayCurrency}>
            <SelectTrigger className="h-6 w-20 text-xs px-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MXN">MXN</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="text-lg font-bold">
          {displayTotal !== null ? `$${displayTotal.toFixed(2)} ${displayCurrency}` : "Calculando..."}
        </div>
        {needsDisplayConversion && baseTotal !== null && (
          <div className="text-xs text-muted-foreground">
            (${baseTotal.toFixed(2)} {tariffCurrency})
          </div>
        )}
      </CardContent>
    </Card>
  );
}
