import { useState, type ReactNode } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const CURRENCIES = ["MXN", "USD", "EUR"] as const;

interface Money {
  amount: number;
  currency: string;
}

interface CurrencyAmountProps {
  money: Money | null;
  /** Used to fetch the historical exchange rate for the conversion. */
  date?: Date;
  /** Rendered when `money` is null. If omitted, a null amount is treated as 0. */
  emptyLabel?: ReactNode;
  align?: "start" | "end";
}

/**
 * Renders a money amount with a currency switcher that converts on the fly.
 * Presentational only (no TableCell) so it can be reused in tables and cards.
 */
export function CurrencyAmount({
  money,
  date,
  emptyLabel,
  align = "end",
}: CurrencyAmountProps) {
  const baseCurrency = money?.currency ?? "MXN";
  const [displayCurrency, setDisplayCurrency] = useState<string>(baseCurrency);

  const needsConversion = displayCurrency !== baseCurrency;
  const { exchangeRate, isLoadingRate, isRateError } = useExchangeRate({
    from: baseCurrency,
    to: displayCurrency,
    enabled: needsConversion,
    date,
  });
  const rate = needsConversion ? exchangeRate?.rate ?? null : 1;
  const converted =
    rate !== null ? (money?.amount ?? 0) * rate : null;

  const renderAmount = () => {
    if (money === null && emptyLabel !== undefined) {
      return emptyLabel;
    }
    if (needsConversion && isLoadingRate) {
      return <span className="text-xs text-muted-foreground">Calculando...</span>;
    }
    if (needsConversion && (isRateError || converted === null)) {
      return <span className="text-xs text-destructive">TC no disponible</span>;
    }
    return <>${(converted ?? 0).toFixed(2)} </>;
  };

  return (
    <span className="font-mono">
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
        <DropdownMenuContent align={align} onClick={(e) => e.stopPropagation()}>
          {CURRENCIES.map((c) => (
            <DropdownMenuItem key={c} onClick={() => setDisplayCurrency(c)}>
              {c}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
