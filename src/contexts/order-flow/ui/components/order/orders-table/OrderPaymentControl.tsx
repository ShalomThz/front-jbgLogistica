import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import { ChevronDown } from "lucide-react";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";

interface OrderPaymentControlProps {
  order: OrderListView;
  canEdit: boolean;
}

type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

const STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "No pagado",
  PARTIALLY_PAID: "Anticipo",
  PAID: "Pagado",
};

const badgeClass: Record<PaymentStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  UNPAID:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
};

const buttonClass: Record<PaymentStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/50 dark:hover:text-green-300",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950/50 dark:hover:text-amber-300",
  UNPAID:
    "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-300",
};

/** Órdenes guardadas antes de paymentStatus lo derivan de isPaid + advance. */
const resolveStatus = (order: OrderListView): PaymentStatus =>
  order.financials.paymentStatus ??
  (order.financials.isPaid
    ? "PAID"
    : order.financials.advance
      ? "PARTIALLY_PAID"
      : "UNPAID");

export const OrderPaymentControl = ({
  order,
  canEdit,
}: OrderPaymentControlProps) => {
  const { updateOrder } = useOrders();
  const status = resolveStatus(order);
  const hasAdvance = !!order.financials.advance;

  const handleChange = async (paid: boolean) => {
    await updateOrder(order.id, { markAsPaid: paid });
  };

  if (!canEdit) {
    return (
      <Badge variant="outline" className={badgeClass[status]}>
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-7 w-25 flex items-center justify-between p-4 text-xs ${buttonClass[status]}`}
        >
          {STATUS_LABELS[status]}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={() => handleChange(true)}>
          Pagado
        </DropdownMenuItem>
        {/* Desmarcar el pago regresa al estado natural: con anticipo cobrado
            la orden queda parcialmente pagada, no "no pagada" */}
        <DropdownMenuItem onClick={() => handleChange(false)}>
          {hasAdvance ? "Anticipo (no liquidado)" : "No pagado"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
