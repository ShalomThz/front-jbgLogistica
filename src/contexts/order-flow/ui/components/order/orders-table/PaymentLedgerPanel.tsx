import { useState } from "react";
import { Badge, Button, Label } from "@contexts/shared/shadcn";
import { Check, Coins, Trash2, X } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_LABELS,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { AddPaymentForm } from "./AddPaymentForm";

const formatMoney = (amount: number, currency: string) =>
  `$${amount.toFixed(2)} ${currency}`;

const microLabel =
  "text-[10px] font-medium uppercase tracking-wide text-muted-foreground";

interface Props {
  order: OrderListView;
  onAddPayment: (data: AddPaymentRequest) => Promise<void>;
  onRemovePayment: (paymentId: string) => Promise<void>;
  onClearPayments: () => Promise<void>;
  isSaving: boolean;
}

/** Cuerpo del libro de abonos: resumen, lista, alta de abono y "marcar no
 * pagado". Se usa inline (resumen HQ) y dentro del diálogo (tabla de órdenes). */
export const PaymentLedgerPanel = ({
  order,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  isSaving,
}: Props) => {
  const { financials } = order;
  const billedCurrency = financials.totalBilled?.currency ?? "MXN";

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [confirmingRemoveId, setConfirmingRemoveId] = useState<string | null>(
    null,
  );

  const status = resolvePaymentStatus(order.financials);

  const hasAnyPayment = status !== "UNPAID" || financials.payments.length > 0;

  const balance = resolveBilledBalance(financials);

  const handleClearPayments = async () => {
    await onClearPayments();
    setConfirmingClear(false);
  };

  return (
    <div className="space-y-4">
      {/* Resumen */}
      <div className="rounded-xl border bg-muted/30 p-4">
        <div className="flex items-start justify-between gap-2">
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
          <Badge
            variant="outline"
            className={PAYMENT_STATUS_BADGE_CLASS[status]}
          >
            {PAYMENT_STATUS_LABELS[status]}
          </Badge>
        </div>
        {balance && (
          <div className="mt-3 grid grid-cols-2 gap-3 border-t border-dashed pt-3">
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
      </div>

      {/* Lista de abonos */}
      <div className="space-y-2">
        <Label className={microLabel}>Abonos registrados</Label>
        {financials.payments.length === 0 && (
          <div className="rounded-lg border border-dashed py-6 text-center text-sm text-muted-foreground">
            Aún no hay abonos registrados.
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
            {confirmingRemoveId === p.id ? (
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

      {/* Agregar pago */}
      <div className="space-y-3 rounded-xl border bg-muted/30 p-4">
        <Label className={microLabel}>Agregar pago</Label>
        <AddPaymentForm
          defaultCurrency={billedCurrency}
          onAdd={onAddPayment}
          isSaving={isSaving}
          settlePending={balance?.pending}
        />
      </div>

      {/* Marcar como no pagado */}
      {hasAnyPayment &&
        (confirmingClear ? (
          <div className="flex items-center justify-end gap-2">
            <span className="mr-auto text-xs text-muted-foreground">
              ¿Borrar todos los abonos?
            </span>
            <Button
              variant="destructive"
              size="sm"
              disabled={isSaving}
              onClick={handleClearPayments}
            >
              Sí, no pagado
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={isSaving}
              onClick={() => setConfirmingClear(false)}
            >
              Cancelar
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-destructive hover:text-destructive"
            disabled={isSaving}
            onClick={() => setConfirmingClear(true)}
          >
            <Trash2 className="size-4" />
            Marcar como no pagado
          </Button>
        ))}
    </div>
  );
};
