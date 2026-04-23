import { useState } from "react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  TableCell,
} from "@contexts/shared/shadcn";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const COST_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;
const CURRENCIES = ["MXN", "USD", "EUR"] as const;

interface TotalBilledCellProps {
  financials: OrderListView["financials"];
}

export function TotalBilledCell({ financials }: TotalBilledCellProps) {
  const { tariff, costBreakdown } = financials;
  const baseCurrency = tariff?.currency ?? "MXN";
  const [displayCurrency, setDisplayCurrency] = useState<string>(baseCurrency);

  const costItems = COST_FIELDS
    .map((f) => costBreakdown[f])
    .filter((m): m is MoneyPrimitives => m !== null);

  const costsCurrency = costItems[0]?.currency ?? baseCurrency;
  const needsCostConversion = costItems.length > 0 && costsCurrency !== baseCurrency;

  const costRate = useExchangeRate({
    from: costsCurrency,
    to: baseCurrency,
    enabled: needsCostConversion,
  });

  const costConversionRate = needsCostConversion ? costRate.exchangeRate?.rate ?? null : 1;
  const costsTotal = costItems.reduce((sum, m) => sum + m.amount, 0);
  const convertedCosts = costConversionRate !== null ? costsTotal * costConversionRate : null;
  const grandTotalBase =
    convertedCosts !== null ? (tariff?.amount ?? 0) + convertedCosts : null;

  const needsDisplayConversion = displayCurrency !== baseCurrency;
  const displayRate = useExchangeRate({
    from: baseCurrency,
    to: displayCurrency,
    enabled: needsDisplayConversion,
  });
  const displayConversionRate = needsDisplayConversion ? displayRate.exchangeRate?.rate ?? null : 1;
  const grandTotalDisplay =
    grandTotalBase !== null && displayConversionRate !== null
      ? grandTotalBase * displayConversionRate
      : null;

  const isLoading =
    (needsCostConversion && costRate.isLoadingRate) ||
    (needsDisplayConversion && displayRate.isLoadingRate);
  const hasError =
    (needsCostConversion && costRate.isRateError) ||
    (needsDisplayConversion && displayRate.isRateError);

  const renderAmount = () => {
    if (isLoading) {
      return <span className="text-xs text-muted-foreground">Calculando...</span>;
    }
    if (hasError || grandTotalDisplay === null) {
      return <span className="text-xs text-destructive">TC no disponible</span>;
    }
    return <>${grandTotalDisplay.toFixed(2)} </>;
  };

  return (
    <TableCell className="text-right font-mono">
      {renderAmount()}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1 text-xs text-muted-foreground font-normal"
          >
            {displayCurrency}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {CURRENCIES.map((c) => (
            <DropdownMenuItem key={c} onClick={() => setDisplayCurrency(c)}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
}
