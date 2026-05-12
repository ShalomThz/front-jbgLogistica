import { useState } from "react";
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

const CURRENCIES = ["MXN", "USD", "EUR"] as const;

interface TotalBilledCellProps {
  financials: OrderListView["financials"];
}

export function TotalBilledCell({ financials }: TotalBilledCellProps) {
  const { totalBilled } = financials;
  const baseCurrency = totalBilled?.currency ?? "MXN";
  const [displayCurrency, setDisplayCurrency] = useState<string>(baseCurrency);

  const needsConversion = displayCurrency !== baseCurrency;
  const { exchangeRate, isLoadingRate, isRateError } = useExchangeRate({
    from: baseCurrency,
    to: displayCurrency,
    enabled: needsConversion,
  });
  const rate = needsConversion ? exchangeRate?.rate ?? null : 1;
  const displayAmount =
    totalBilled !== null && rate !== null ? totalBilled.amount * rate : null;

  const renderAmount = () => {
    if (totalBilled === null) {
      return "—";
    }
    if (needsConversion && isLoadingRate) {
      return <span className="text-xs text-muted-foreground">Calculando...</span>;
    }
    if (needsConversion && (isRateError || displayAmount === null)) {
      return <span className="text-xs text-destructive">TC no disponible</span>;
    }
    return <>${(displayAmount ?? 0).toFixed(2)} </>;
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
