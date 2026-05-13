import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

interface FinalPriceRowProps {
  totalBilled: MoneyPrimitives;
}

export function FinalPriceRow({ totalBilled }: FinalPriceRowProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Total facturado</h4>
      <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="col-span-2 text-sm">{formatMoney(totalBilled)}</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground" />
          <div className="col-span-2">
            <CurrencyConversion amount={totalBilled.amount} from={totalBilled.currency} />
          </div>
        </div>
      </div>
    </div>
  );
}
