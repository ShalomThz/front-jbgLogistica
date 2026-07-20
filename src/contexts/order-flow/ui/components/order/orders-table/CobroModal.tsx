import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from "@contexts/shared/shadcn";
import { BadgeDollarSign, Check, Trash2, X } from "lucide-react";
import { AddPaymentForm } from "@contexts/order-flow/ui/components/order/orders-table/AddPaymentForm";
import {
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@contexts/shared/domain/schemas/PaymentMethod";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";

/** Abono ya registrado en la orden (solo lectura; no se puede quitar aquí). */
export interface RegisteredPayment {
  amount: MoneyPrimitives;
  method?: PaymentMethod;
  concept?: string | null;
  /** Etiqueta alternativa cuando no hay método (p. ej. el anticipo). */
  label?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** Total a cobrar (moneda de visualización del resumen). */
  total: number | null;
  currency: string;
  /** Saldo pendiente para el atajo "Liquidar saldo" (default: el total). */
  pending?: number | null;
  /** Moneda preseleccionada del abono. */
  defaultCurrency: string;
  /** Abonos ya registrados en la orden (solo lectura). */
  existingPayments: RegisteredPayment[];
  /** Abonos capturados en este paso (locales, se pueden quitar). */
  payments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => Promise<void>;
  onRemovePayment: (index: number) => void;
  isSaving?: boolean;
}

export const CobroModal = ({
  open,
  onClose,
  total,
  currency,
  pending,
  defaultCurrency,
  existingPayments,
  payments,
  onAddPayment,
  onRemovePayment,
  isSaving = false,
}: Props) => {
  const [confirmingRemove, setConfirmingRemove] = useState<number | null>(null);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm flex max-h-[85vh] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="size-5 text-green-600" />
            Cobro
          </DialogTitle>
          <DialogDescription>Registra el pago de la orden.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
        <div className="space-y-1 rounded-md border p-3">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Total a cobrar</span>
            <span className="text-lg font-bold tabular-nums text-emerald-600">
              {total !== null ? `$${total.toFixed(2)} ${currency}` : "—"}
            </span>
          </div>
          {pending != null && (
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">
                {pending < 0 ? "A favor" : "Restante"}
              </span>
              <span
                className={`text-sm font-semibold tabular-nums ${pending < 0 ? "text-emerald-600" : ""}`}
              >
                ${Math.abs(pending).toFixed(2)} {currency}
              </span>
            </div>
          )}
        </div>

        {(existingPayments.length > 0 || payments.length > 0) && (
          <div className="space-y-2">
            <Label>Abonos</Label>
            {existingPayments.map((p, i) => (
              <div
                key={`registered-${i}`}
                className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/[0.08]"
              >
                <div className="min-w-0">
                  <span className="tabular-nums">
                    ${p.amount.amount.toFixed(2)} {p.amount.currency}
                  </span>{" "}
                  · {p.method ? PAYMENT_METHOD_LABELS[p.method] : p.label}
                  {p.concept && (
                    <span className="text-muted-foreground"> · {p.concept}</span>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  Registrado
                </span>
              </div>
            ))}
            {payments.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-md border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm dark:border-emerald-500/30 dark:bg-emerald-500/[0.08]"
              >
                <div className="min-w-0">
                  <span className="tabular-nums">
                    ${p.amount.amount.toFixed(2)} {p.amount.currency}
                  </span>{" "}
                  · {PAYMENT_METHOD_LABELS[p.method]}
                  {p.concept && (
                    <span className="text-muted-foreground"> · {p.concept}</span>
                  )}
                </div>
                {confirmingRemove === i ? (
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="mr-1 text-xs text-muted-foreground">
                      ¿Eliminar?
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-red-600 hover:text-red-700"
                      onClick={() => {
                        onRemovePayment(i);
                        setConfirmingRemove(null);
                      }}
                      aria-label="Confirmar eliminación"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground"
                      onClick={() => setConfirmingRemove(null)}
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
                    onClick={() => setConfirmingRemove(i)}
                    aria-label="Eliminar abono"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <Label>Agregar pago</Label>
          <AddPaymentForm
            defaultCurrency={defaultCurrency}
            onAdd={onAddPayment}
            isSaving={isSaving}
            settlePending={pending ?? total}
          />
        </div>
        </div>

        <DialogFooter className="shrink-0 border-t p-6">
          <Button variant="outline" onClick={onClose}>
            Listo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
