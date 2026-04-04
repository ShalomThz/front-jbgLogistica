import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

interface CurrencyConversionProps {
  amount: number;
  from: string;
  to?: string;
}

export function CurrencyConversion({ amount, from, to = "MXN" }: CurrencyConversionProps) {
  const { exchangeRate, isLoadingRate } = useExchangeRate({ from, to, enabled: amount > 0 });

  if (from === to) return null;

  if (isLoadingRate) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" />
      </span>
    );
  }

  if (!exchangeRate) return null;

  const converted = amount * exchangeRate.rate;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ArrowRightLeft className="size-3" />
      ${converted.toFixed(2)} {to}
      <span className="opacity-60">(1 {from} = {exchangeRate.rate.toFixed(2)} {to})</span>
    </span>
  );
}
