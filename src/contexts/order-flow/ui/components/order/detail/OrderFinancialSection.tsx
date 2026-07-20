import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { OrderFinancialsPrimitives } from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { Badge } from "@contexts/shared/shadcn";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_LABELS,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import { CurrencyConversion } from "@contexts/shared/ui/components/CurrencyConversion";
import { Receipt, Truck } from "lucide-react";

function MoneyRow({
  label,
  value,
  negative = false,
}: {
  label: string;
  value: string;
  negative?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={`text-sm tabular-nums ${negative ? "text-red-600 dark:text-red-400" : ""}`}
      >
        {negative ? "−" : ""}
        {value}
      </span>
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
  financials: OrderFinancialsPrimitives;
  /** Reveals the pricing breakdown and JBG's carrier costs. The billed
   * total and payment status are always shown regardless. */
  canViewFinancials: boolean;
}

/** Cobro al cliente (tarifa + extras − descuento = total facturado, anticipo,
 * estado del pago) separado de los costos internos de JBG (guía del carrier).
 * Son dinero en sentidos opuestos: mezclarlos no suma a ningún total. */
export const OrderFinancialSection = ({
  rate,
  financials,
  canViewFinancials,
}: OrderFinancialSectionProps) => {
  const { tariff, totalBilled, discount, costBreakdown, payments } =
    financials;

  const status = resolvePaymentStatus(financials);

  // Saldo en la moneda del total (null con monedas mixtas → no se resta).
  const remaining = resolveBilledBalance(financials)?.pending ?? null;

  // Semáforo del pago (config compartida); PAID muestra el método si existe.
  const paymentBadge = {
    label:
      status === "PAID" && financials.paymentMethod
        ? `Pagado · ${PAYMENT_METHOD_LABELS[financials.paymentMethod] ?? financials.paymentMethod}`
        : PAYMENT_STATUS_LABELS[status],
    className: PAYMENT_STATUS_BADGE_CLASS[status],
  };

  const hasExtras = Object.values(costBreakdown).some(Boolean);
  const breakdownRows =
    canViewFinancials && (tariff || hasExtras || discount.amount);

  // Costos internos: solo guías reales del carrier (JBG_RATE cotiza en $0)
  const hasCarrierCost = rate !== null && rate.price.amount > 0;

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-emerald-200 dark:border-emerald-900/50">
        <div className="flex items-center justify-between gap-2 border-b border-emerald-200 bg-emerald-50/60 px-4 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            <Receipt className="size-4" />
            Cobro al cliente
          </h4>
          <Badge variant="outline" className={paymentBadge.className}>
            {paymentBadge.label}
          </Badge>
        </div>

        {breakdownRows && (
          <div className="space-y-1.5 px-4 py-3">
            {tariff && <MoneyRow label="Tarifa" value={formatMoney(tariff)} />}
            {Object.entries(costBreakdown).map(([key, value]) =>
              value ? (
                <MoneyRow
                  key={key}
                  label={COST_LABELS[key] ?? key}
                  value={formatMoney(value)}
                />
              ) : null,
            )}
            {discount.amount && (
              <MoneyRow
                label={`Descuento${discount.concept ? ` (${discount.concept})` : ""}`}
                value={formatMoney(discount.amount)}
                negative
              />
            )}
          </div>
        )}

        {totalBilled && (
          <div className="border-t border-emerald-200 bg-emerald-50/60 px-4 py-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                Total facturado
              </span>
              <span className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                {formatMoney(totalBilled)}
              </span>
            </div>
            <div className="flex justify-end">
              <CurrencyConversion
                amount={totalBilled.amount}
                from={totalBilled.currency}
              />
            </div>
          </div>
        )}

        {(payments.length > 0 || financials.paymentConcept) && (
          <div className="space-y-1.5 border-t border-emerald-200 px-4 py-3 dark:border-emerald-900/50">
            {payments.map((p) => (
              <MoneyRow
                key={p.id}
                label={`Abono · ${PAYMENT_METHOD_LABELS[p.method] ?? p.method}${p.concept ? ` (${p.concept})` : ""}`}
                value={formatMoney(p.amount)}
                negative
              />
            ))}
            {remaining !== null && totalBilled && remaining !== 0 && (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-medium">
                  {remaining > 0 ? "Restante" : "Saldo a favor"}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMoney({
                    amount: Math.abs(remaining),
                    currency: totalBilled.currency,
                  })}
                </span>
              </div>
            )}
            {financials.paymentConcept && (
              <p className="text-xs text-muted-foreground">
                Concepto: {financials.paymentConcept}
              </p>
            )}
          </div>
        )}
      </div>

      {canViewFinancials && hasCarrierCost && rate && (
        <div className="overflow-hidden rounded-lg border">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/50 px-4 py-2.5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold">
              <Truck className="size-4 text-muted-foreground" />
              Costos JBG
            </h4>
            <span className="text-xs text-muted-foreground">{rate.serviceName}</span>
          </div>
          <div className="space-y-1.5 px-4 py-3">
            <MoneyRow label="Guía" value={formatMoney(rate.price)} />
            {rate.insuranceFee.amount > 0 && (
              <MoneyRow
                label="Seguro del carrier"
                value={formatMoney(rate.insuranceFee)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
