import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { DiscountPrimitives } from "@contexts/sales/domain/schemas/value-objects/Discount";
import { FinalPriceRow } from "./FinalPriceRow";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 min-w-0 text-sm break-words">{value}</span>
    </div>
  );
}

function formatMoney(money: MoneyPrimitives) {
  return `$${money.amount.toFixed(2)} ${money.currency}`;
}

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface OrderFinancialSectionProps {
  rate: ShipmentPrimitives["rate"];
  costBreakdown: ShipmentPrimitives["costBreakdown"];
  totalBilled: MoneyPrimitives | null;
  tariff: MoneyPrimitives | null;
  discount: DiscountPrimitives;
  /** Anticipo cobrado por caja vacía; habilita la fila de restante. */
  advance?: MoneyPrimitives | null;
  /** Reveals internal cost figures (guías, tariff, insurance, breakdown).
   * The billed total is always shown regardless. */
  canViewFinancials: boolean;
}

export const OrderFinancialSection = ({
  rate,
  costBreakdown,
  totalBilled,
  tariff,
  discount,
  advance,
  canViewFinancials,
}: OrderFinancialSectionProps) => {
  return (
    <div className="space-y-4">
      {canViewFinancials && rate && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Tarifa</h4>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <DetailRow label="Total guías" value={formatMoney(rate.price)} />
            {tariff && <DetailRow label="Costo de la tarifa" value={formatMoney(tariff)} />}
            {discount.amount && (
              <DetailRow
                label="Descuento"
                value={`-${formatMoney(discount.amount)}${discount.concept ? ` (${discount.concept})` : ""}`}
              />
            )}
            <DetailRow label="Seguro" value={formatMoney(rate.insuranceFee)} />
          </div>
        </div>
      )}

      {canViewFinancials && costBreakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">Desglose de extras</h4>
          <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3 space-y-1 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            {Object.entries(costBreakdown).map(([key, value]) =>
              value ? (
                <DetailRow
                  key={key}
                  label={COST_LABELS[key] ?? key}
                  value={formatMoney(value)}
                />
              ) : null,
            )}
          </div>
        </div>
      )}

      {totalBilled && <FinalPriceRow totalBilled={totalBilled} advance={advance} />}
    </div>
  );
};
