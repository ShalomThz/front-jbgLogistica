import { useState } from "react";
import { Badge, Button, Label } from "@contexts/shared/shadcn";
import { Check, Coins, Receipt, Trash2, X } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_SURFACE,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import { CloverCheckoutPanel } from "./CloverCheckoutPanel";
import { useCloverCheckout } from "@contexts/sales/infrastructure/hooks/orders/useCloverCheckout";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";

const formatMoney = (amount: number, currency: string) =>
  `$${amount.toFixed(2)} ${currency}`;

const microLabel =
  "text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

interface Props {
  order: OrderListView;
  onRemovePayment: (paymentId: string) => Promise<void>;
  isSaving: boolean;
}

/** Cuerpo del libro de abonos a JBG: solo lo que se **mira** —el resumen y la
 * lista—. Registrar un abono es otra tarea y vive en `AddPaymentDialog`, que se
 * abre desde el footer; "marcar como no pagado" también está en el footer.
 *
 * Solo lo usa `PaymentLedgerDialog`, y por eso el layout asume el ancho del
 * diálogo. Si algún día vuelve a montarse en una columna angosta, las dos
 * columnas de acá hay que condicionarlas: `lg:` mira el viewport, no el
 * contenedor, así que en una pantalla ancha se partiría igual. */
export const PaymentLedgerPanel = ({
  order,
  onRemovePayment,
  isSaving,
}: Props) => {
  const { financials } = order;
  const billedCurrency = financials.totalBilled?.currency ?? "USD";
  const isUSD = billedCurrency === "USD";

  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(
    null,
  );

  const status = resolvePaymentStatus(order.financials);

  const {
    exchangeRate: rateData,
    isLoadingRate,
    isRateError,
    rateError,
  } = useExchangeRate({
    from: billedCurrency,
    to: "USD",
    enabled: !isUSD && Boolean(financials.totalBilled),
  });

  const rateToUsd = isUSD ? 1 : (rateData?.rate ?? null);
  const ratesForBilled =
    !isUSD && rateToUsd ? { USD: 1 / rateToUsd } : undefined;

  const balance = resolveBilledBalance(financials, ratesForBilled);

  // Equivalente de saldo pendiente en USD calculado de forma simétrica al backend
  const outstandingInUsd = (() => {
    if (!financials.totalBilled) return 0;
    if (isUSD) return Math.max(0, balance?.pending ?? 0);
    if (!rateToUsd) return 0;

    const totalInUsd = financials.totalBilled.amount * rateToUsd;
    const totalInCents = Math.ceil(totalInUsd * 100);
    const paidInUsd = financials.payments.reduce((sum, p) => {
      if (p.amount.currency === "USD") return sum + p.amount.amount;
      return sum + p.amount.amount * rateToUsd;
    }, 0);
    const paidInCents = Math.round(paidInUsd * 100);
    return Math.max(0, totalInCents - paidInCents) / 100;
  })();

  const canUseClover =
    financials.totalBilled !== null &&
    (status !== "PAID" || Boolean(order.id));
  const clover = useCloverCheckout(order.id, canUseClover);

  const showCloverPanel =
    canUseClover &&
    (clover.checkout?.status === "PENDING" ||
      (status !== "PAID" &&
        (isUSD ? (balance ? balance.pending > 0 : true) : true)));

  const surface = PAYMENT_STATUS_SURFACE[status];

  return (
    // Dos columnas en pantallas anchas: a la izquierda en qué anda el pago, a la
    // derecha lo que se hace con él. Apiladas, había que bajar hasta el fondo
    // para agregar un abono y volver arriba para ver si ya alcanzaba.
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        {/* Resumen. El encabezado con el destinatario es lo que lo distingue
            del libro del agente: los dos dicen "abonos" y sin esto se leían
            como el mismo. */}
        <div className="overflow-hidden rounded-xl border">
          <div
            className={`flex items-center gap-2 border-b px-4 py-2.5 ${surface.card}`}
          >
            <Receipt className={`size-4 ${surface.accent}`} />
            <span className={`text-sm font-semibold ${surface.accent}`}>
              Se le paga a JBG
            </span>
          </div>

          <div className="space-y-3 bg-muted/30 p-4">
            <div>
              <div className={microLabel}>Total facturado</div>
              <div className="text-2xl font-bold tabular-nums">
                {financials.totalBilled
                  ? formatMoney(
                      financials.totalBilled.amount,
                      financials.totalBilled.currency,
                    )
                  : "—"}
              </div>
            </div>

            {balance && (
              <div className="grid grid-cols-2 gap-3 border-t border-dashed pt-3">
                <div>
                  <div className={microLabel}>Pagado</div>
                  <div className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatMoney(balance.paid, billedCurrency)}
                  </div>
                </div>
                <div className="text-right">
                  <div className={microLabel}>
                    {balance.pending < 0 ? "A favor" : "Saldo"}
                  </div>
                  <div
                    className={`font-semibold tabular-nums ${
                      balance.pending < 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : balance.pending > 0
                          ? "text-red-600 dark:text-red-400"
                          : ""
                    }`}
                  >
                    {formatMoney(Math.abs(balance.pending), billedCurrency)}
                  </div>
                </div>
              </div>
            )}

            {/* El estado abajo y a lo ancho: arriba competía con la cifra
                grande y las dos se leían a medias. */}
            <Badge
              variant="outline"
              className={`w-full justify-center ${PAYMENT_STATUS_BADGE_CLASS[status]}`}
            >
              {PAYMENT_STATUS_LABELS[status]}
            </Badge>
          </div>
        </div>

        {showCloverPanel && (
          <CloverCheckoutPanel
            key={`${order.id}-${outstandingInUsd.toFixed(2)}-${billedCurrency}`}
            outstanding={outstandingInUsd}
            billedCurrency={billedCurrency}
            billedPending={balance?.pending ?? financials.totalBilled?.amount ?? 0}
            exchangeRate={rateToUsd}
            isLoadingRate={!isUSD && isLoadingRate}
            rateError={
              !isUSD && isRateError
                ? (rateError ?? "No se pudo obtener el tipo de cambio")
                : null
            }
            checkout={clover.checkout}
            onCreate={clover.createCheckout}
            origin={order.origin}
            destination={order.destination}
            onSendEmail={clover.sendCheckoutEmail}
            isLoading={clover.isLoading}
            isSendingEmail={clover.isSendingCheckoutEmail}
            error={clover.error}
          />
        )}
      </div>

      <div className="space-y-4 lg:col-span-3">
      {/* Lista de abonos */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className={microLabel}>Abonos a JBG</Label>
          {financials.payments.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {financials.payments.length}
            </Badge>
          )}
        </div>
        {financials.payments.length === 0 && (
          <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            Aún no se le abonó nada a JBG.
          </div>
        )}
        {financials.payments.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-3 py-2.5 text-sm transition-colors hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/[0.08] dark:hover:bg-emerald-500/[0.12]"
          >
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
              <Coins className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-medium tabular-nums">
                {formatMoney(p.amount.amount, p.amount.currency)}
              </div>
              <div className="truncate text-xs text-muted-foreground">
                {PAYMENT_METHOD_LABELS[p.method]}
                {p.concept && ` · ${p.concept}`} ·{" "}
                {new Date(p.date).toLocaleDateString()}
              </div>
            </div>
            {p.externalReference ? (
              <Badge variant="outline" className="shrink-0">
                Confirmado
              </Badge>
            ) : confirmingRemoveId === p.id ? (
              <div className="flex shrink-0 items-center gap-1">
                <span className="mr-1 text-xs text-muted-foreground">
                  ¿Eliminar?
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-red-600 hover:text-red-700"
                  disabled={isSaving}
                  onClick={async () => {
                    await onRemovePayment(p.id);
                    setConfirmingRemoveId(null);
                  }}
                  aria-label="Confirmar eliminación"
                >
                  <Check className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground"
                  disabled={isSaving}
                  onClick={() => setConfirmingRemoveId(null)}
                  aria-label="Cancelar"
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={isSaving}
                onClick={() => setConfirmingRemoveId(p.id)}
                aria-label="Eliminar abono"
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        ))}
      </div>

      </div>
    </div>
  );
};
