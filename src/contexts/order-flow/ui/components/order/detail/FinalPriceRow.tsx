import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const COST_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

interface FinalPriceRowProps {
  finalPrice: MoneyPrimitives;
  costBreakdown: ShipmentPrimitives["costBreakdown"];
}

export function FinalPriceRow({ finalPrice, costBreakdown }: FinalPriceRowProps) {
  const baseCurrency = finalPrice.currency;

  const costItems = costBreakdown
    ? COST_FIELDS.map((f) => costBreakdown[f]).filter(Boolean) as MoneyPrimitives[]
    : [];

  const costsCurrency = costItems[0]?.currency ?? baseCurrency;
  const needsConversion = costsCurrency !== baseCurrency;

  const { exchangeRate } = useExchangeRate({
    from: costsCurrency,
    to: baseCurrency,
    enabled: needsConversion,
  });
  const conversionRate = needsConversion ? exchangeRate?.rate ?? null : 1;

  const costsTotal = costItems.reduce((sum, m) => sum + m.amount, 0);
  const convertedCosts = conversionRate !== null ? costsTotal * conversionRate : null;
  const grandTotal = convertedCosts !== null ? finalPrice.amount + convertedCosts : null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Precio final</h4>
      <div className="rounded-md border p-3 space-y-1">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="col-span-2 text-sm">
            {grandTotal !== null ? formatMoney({ amount: grandTotal, currency: baseCurrency }) : "Calculando..."}
          </span>
        </div>
        {grandTotal !== null && (
          <div className="grid grid-cols-3 gap-2">
            <span className="text-sm text-muted-foreground" />
            <div className="col-span-2">
              <CurrencyConversion amount={grandTotal} from={baseCurrency} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
