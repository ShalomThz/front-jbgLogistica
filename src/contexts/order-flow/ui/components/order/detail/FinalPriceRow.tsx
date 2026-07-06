import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

interface FinalPriceRowProps {
  totalBilled: MoneyPrimitives;
  /** Anticipo cobrado al crear (caja vacía); muestra el restante por cobrar. */
  advance?: MoneyPrimitives | null;
}

export function FinalPriceRow({ totalBilled, advance }: FinalPriceRowProps) {
  const remaining = advance
    ? Math.max(0, totalBilled.amount - advance.amount)
    : null;

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Total facturado</h4>
      <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 dark:border-emerald-900/50 dark:bg-emerald-950/20">
        <div className="grid grid-cols-3 gap-2">
          <span className="text-sm text-muted-foreground">Total</span>
          <span className="col-span-2 text-sm">{formatMoney(totalBilled)}</span>
        </div>
        {advance && remaining !== null && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm text-muted-foreground">Anticipo pagado</span>
              <span className="col-span-2 text-sm">-{formatMoney(advance)}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <span className="text-sm font-medium">Restante</span>
              <span className="col-span-2 text-sm font-semibold">
                {formatMoney({ amount: remaining, currency: totalBilled.currency })}
              </span>
            </div>
          </>
        )}
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
