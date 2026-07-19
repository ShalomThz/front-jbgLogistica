import { useState } from "react";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import {
  PAYMENT_STATUS_BUTTON_CLASS,
  PAYMENT_STATUS_LABELS,
  type PaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import { CobroModal, type RegisteredPayment } from "./CobroModal";

interface Props {
  /** Total a cobrar (en la moneda de visualización). */
  grandTotal: number | null;
  currency: string;
  /** Abonos capturados en el paso (locales; se suben al finalizar/crear). */
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
  /** Orden ya existente: muestra sus abonos ya registrados (p. ej. cobrados en
   * partner) y los cuenta hacia el pagado/saldo. */
  orderId?: string;
}

/**
 * Control de pago del resumen (HQ y partner): estado + pagado/saldo derivados de
 * los abonos ya registrados en la orden + los abonos locales aún sin subir, con
 * un dropdown cuyo "Pagado" abre el modal de cobro. Pagado/Saldo solo se muestran
 * cuando todos los abonos están en la moneda de visualización (el front no
 * convierte monedas; el backend lo recalcula con FX).
 */
export const PendingPaymentControl = ({
  grandTotal,
  currency,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  orderId,
}: Props) => {
  const [cobroModalOpen, setCobroModalOpen] = useState(false);
  const { data: order } = useOrder(orderId);

  // Abonos ya persistidos en la orden (solo lectura).
  const existingPayments: RegisteredPayment[] = order
    ? order.financials.payments.map((p) => ({
        amount: p.amount,
        method: p.method,
        concept: p.concept,
      }))
    : [];

  const allAmounts = [
    ...existingPayments.map((p) => p.amount),
    ...pendingPayments.map((p) => p.amount),
  ];
  const hasMixedCurrency = allAmounts.some((a) => a.currency !== currency);
  const paid = hasMixedCurrency
    ? null
    : allAmounts.reduce((sum, a) => sum + a.amount, 0);
  const saldo = paid !== null && grandTotal !== null ? grandTotal - paid : null;
  const status: PaymentStatus =
    allAmounts.length === 0
      ? "UNPAID"
      : paid !== null && grandTotal !== null && paid >= grandTotal
        ? "PAID"
        : "PARTIALLY_PAID";

  return (
    <div className="space-y-2">
      {allAmounts.length > 0 && paid !== null && (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pagado</span>
            <span className="tabular-nums">
              ${paid.toFixed(2)} {currency}
            </span>
          </div>
          {saldo !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {saldo > 0 ? "Saldo a deber" : "Saldo a favor"}
              </span>
              <span
                className={`tabular-nums ${saldo < 0 ? "text-emerald-600" : ""}`}
              >
                ${Math.abs(saldo).toFixed(2)} {currency}
              </span>
            </div>
          )}
        </>
      )}
      {allAmounts.length > 0 && paid === null && (
        <p className="text-xs text-muted-foreground">
          Abonos en distintas monedas: el saldo se calcula al finalizar.
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Estado de pago</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`h-7 flex items-center justify-between gap-1 px-3 text-xs ${PAYMENT_STATUS_BUTTON_CLASS[status]}`}
            >
              {PAYMENT_STATUS_LABELS[status]}
              <ChevronDown className="h-3 w-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setCobroModalOpen(true)}>
              Pagado
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onClearPayments}>
              No pagado
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <CobroModal
        open={cobroModalOpen}
        onClose={() => setCobroModalOpen(false)}
        total={grandTotal}
        currency={currency}
        pending={saldo}
        defaultCurrency={currency}
        existingPayments={existingPayments}
        payments={pendingPayments}
        onAddPayment={async (data) => onAddPayment(data)}
        onRemovePayment={onRemovePayment}
      />
    </div>
  );
};
