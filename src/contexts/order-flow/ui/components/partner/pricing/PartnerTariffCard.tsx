import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@contexts/shared/shadcn";
import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

interface PartnerTariffCardProps {
  /** Valor obtenido automáticamente (o null si no hay tarifa asignada). */
  tariffPrice: MoneyPrimitives | null;
  /** Valor realmente usado: la tarifa automática, o la que el vendedor escribió a mano. */
  effectiveTariff: MoneyPrimitives | null;
  isLoading: boolean;
  error: string | null;
  onRefetch: () => void;
  onTariffChange: (value: MoneyPrimitives) => void;
  /** Moneda a usar cuando aún no hay ninguna tarifa (ni automática ni manual). */
  fallbackCurrency: string;
}

export function PartnerTariffCard({
  tariffPrice,
  effectiveTariff,
  isLoading,
  error,
  onRefetch,
  onTariffChange,
  fallbackCurrency,
}: PartnerTariffCardProps) {
  const currency = effectiveTariff?.currency ?? tariffPrice?.currency ?? fallbackCurrency;
  const amount = effectiveTariff?.amount ?? 0;

  const handleAmountChange = (value: string) => {
    const parsed = parseFloat(value);
    onTariffChange({ amount: Number.isFinite(parsed) && parsed >= 0 ? parsed : 0, currency });
  };

  return (
    <Card className={error ? "border-destructive" : ""}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Tarifa</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={onRefetch}
            disabled={isLoading}
          >
            <RefreshCw className={`size-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            <p className="text-sm">Buscando tarifa...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="text-sm">Sin tarifa asignada — ingresa el precio manualmente</p>
              </div>
            )}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={amount || ""}
                onChange={(e) => handleAmountChange(e.target.value)}
                className="h-10 pl-6 pr-14 text-lg font-bold"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {currency}
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
