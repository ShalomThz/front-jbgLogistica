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

interface TotalShippingCellProps {
  financials: OrderListView["financials"];
}

export function TotalShippingCell({ financials }: TotalShippingCellProps) {
  const { totalPrice } = financials;
  const sourceCurrency = totalPrice?.currency ?? "MXN";
  const [displayCurrency, setDisplayCurrency] = useState<string>(sourceCurrency);

  const needsConversion = displayCurrency !== sourceCurrency;
  const { exchangeRate, isLoadingRate, isRateError } = useExchangeRate({
    from: sourceCurrency,
    to: displayCurrency,
    enabled: needsConversion,
  });
  const rate = needsConversion ? exchangeRate?.rate ?? null : 1;
  const converted = rate !== null ? (totalPrice?.amount ?? 0) * rate : null;

  const renderAmount = () => {
    if (needsConversion && isLoadingRate) {
      return <span className="text-xs text-muted-foreground">Calculando...</span>;
    }
    if (needsConversion && (isRateError || converted === null)) {
      return <span className="text-xs text-destructive">TC no disponible</span>;
    }
    return <>${(converted ?? 0).toFixed(2)} </>;
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
