import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { OrderFinancialsPrimitives } from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { Badge } from "@contexts/shared/shadcn";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_SURFACE,
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
  const balance = resolveBilledBalance(financials);
  const remaining = balance?.pending ?? null;

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
      {/* El color lo pone el estado del pago —rojo, ámbar, verde—, no el dueño
          de la plata: de quién es lo dicen el ícono y el título. */}
      <div
        className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 ${PAYMENT_STATUS_SURFACE[status].card}`}
      >
        <div className="space-y-1">
          <h4
            className={`flex items-center gap-2 text-base font-semibold ${PAYMENT_STATUS_SURFACE[status].accent}`}
          >
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${PAYMENT_STATUS_SURFACE[status].iconBg}`}
            >
              <Receipt
                className={`size-4 ${PAYMENT_STATUS_SURFACE[status].accent}`}
              />
            </span>
            {/* "Cobro al cliente" era ambiguo: en una orden de socio el cliente
                de JBG **es** el socio. Nombrar a quien cobra lo resuelve para
                los dos tipos de orden. */}
            Cobro de JBG
          </h4>
          <p className="text-xs text-muted-foreground">
            Lo que JBG cobra por esta orden y lo que ya se le pagó.
          </p>
        </div>
        <Badge variant="outline" className={paymentBadge.className}>
          {paymentBadge.label}
        </Badge>
      </div>

      {/* Las tres cifras. Con monedas mixtas `resolveBilledBalance` devuelve
          null a propósito —sumar sin convertir daría un número falso—, así que
          pagado y saldo muestran una raya en vez de inventar el dato. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Total facturado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {totalBilled ? formatMoney(totalBilled) : "—"}
          </p>
          {totalBilled && (
            <CurrencyConversion
              amount={totalBilled.amount}
              from={totalBilled.currency}
            />
          )}
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Pagado</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {balance && totalBilled
              ? formatMoney({
                  amount: balance.paid,
                  currency: totalBilled.currency,
                })
              : "—"}
          </p>
        </div>
        {/* La tarjeta del saldo lleva el mismo semáforo que el badge: es lo
            primero que se busca al abrir la pestaña. */}
        <div
          className={`rounded-xl border p-4 ${
            remaining === null ? "" : PAYMENT_STATUS_SURFACE[status].card
          }`}
        >
          <p className="text-xs text-muted-foreground">
            {remaining !== null && remaining < 0 ? "Saldo a favor" : "Saldo"}
          </p>
          <p
            className={`mt-1 text-2xl font-bold tabular-nums ${
              remaining === null ? "" : PAYMENT_STATUS_SURFACE[status].accent
            }`}
          >
            {remaining === null || !totalBilled
              ? "—"
              : remaining === 0
                ? "Saldado"
                : formatMoney({
                    amount: Math.abs(remaining),
                    currency: totalBilled.currency,
                  })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* El desglose sigue detrás del permiso: la tarifa y los extras son
            cómo JBG arma su precio, no solo cuánto salió. */}
        {breakdownRows && (
          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-muted/40 px-4 py-2.5">
              <h5 className="text-sm font-semibold">Desglose</h5>
            </div>
            <div className="space-y-2 px-4 py-3">
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
              {totalBilled && (
                <>
                  <div className="border-t pt-2" />
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-sm font-semibold">
                      Total facturado
                    </span>
                    <span className="text-sm font-bold tabular-nums">
                      {formatMoney(totalBilled)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* El libro de JBG. Vacío se dice, no se deja en blanco. */}
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
            <h5 className="text-sm font-semibold">Abonos a JBG</h5>
            {payments.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {payments.length}
              </Badge>
            )}
          </div>
          <div className="space-y-2 px-4 py-3">
            {payments.length === 0 ? (
              <p className="py-2 text-sm text-muted-foreground">
                Todavía no se registró ningún abono.
              </p>
            ) : (
              payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-2 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate">
                      {PAYMENT_METHOD_LABELS[p.method] ?? p.method}
                    </p>
                    {p.concept && (
                      <p className="truncate text-xs text-muted-foreground">
                        {p.concept}
                      </p>
                    )}
                  </div>
                  <span className="shrink-0 tabular-nums">
                    {formatMoney(p.amount)}
                  </span>
                </div>
              ))
            )}
            {financials.paymentConcept && (
              <p className="border-t pt-2 text-xs text-muted-foreground">
                Concepto: {financials.paymentConcept}
              </p>
            )}
          </div>
        </div>
      </div>

      {canViewFinancials && hasCarrierCost && rate && (
        <div className="overflow-hidden rounded-xl border">
          <div className="flex items-center justify-between gap-2 border-b bg-muted/40 px-4 py-2.5">
            <h5 className="flex items-center gap-1.5 text-sm font-semibold">
              <Truck className="size-4 text-muted-foreground" />
              {/* Plata en el sentido contrario: lo que a JBG le cuesta mover el
                  paquete, no lo que cobra. Por eso está fuera del desglose y no
                  suma a ningún total de arriba. */}
              Costos JBG · lo que le cuesta la guía
            </h5>
            <span className="text-xs text-muted-foreground">{rate.serviceName}</span>
          </div>
          <div className="space-y-2 px-4 py-3">
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
