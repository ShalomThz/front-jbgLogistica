import { useState } from "react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { Badge, Button } from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_BUTTON_CLASS,
  PAYMENT_STATUS_LABELS,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { PaymentLedgerDialog } from "./PaymentLedgerDialog";

interface OrderPaymentControlProps {
  order: OrderListView;
  canEdit: boolean;
}

/** Etiqueta de saldo pendiente para el badge (solo si es calculable y > 0). */
const resolvePendingLabel = (order: OrderListView): string | null => {
  const balance = resolveBilledBalance(order.financials);
  if (!balance || balance.pending <= 0) return null;
  const currency = order.financials.totalBilled?.currency ?? "";
  return `Saldo $${balance.pending.toFixed(2)} ${currency}`;
};

export const OrderPaymentControl = ({
  order,
  canEdit,
}: OrderPaymentControlProps) => {
  const { addPayment, removePayment, clearPayments, isSavingPayment } =
    useOrders({
      enabled: false,
    });
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const status = resolvePaymentStatus(order.financials);

  const pendingLabel = resolvePendingLabel(order);
  const statusLabel =
    status === "PARTIALLY_PAID" && pendingLabel
      ? `Parcial · ${pendingLabel}`
      : PAYMENT_STATUS_LABELS[status];

  if (!canEdit) {
    return (
      <Badge variant="outline" className={PAYMENT_STATUS_BADGE_CLASS[status]}>
        {statusLabel}
      </Badge>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={`h-7 flex items-center justify-between gap-1 p-4 text-xs ${PAYMENT_STATUS_BUTTON_CLASS[status]}`}
        onClick={() => setLedgerOpen(true)}
      >
        {statusLabel}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </Button>
      <PaymentLedgerDialog
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        order={order}
        onAddPayment={(data) => addPayment(order.id, data)}
        onRemovePayment={(paymentId) => removePayment(order.id, paymentId)}
        onClearPayments={() => clearPayments(order.id)}
        isSaving={isSavingPayment}
      />
    </>
  );
};
