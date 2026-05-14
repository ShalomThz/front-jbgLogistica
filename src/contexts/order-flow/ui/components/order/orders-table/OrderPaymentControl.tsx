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

const paidClass =
  "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900";
const unpaidClass =
  "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900";

export const OrderPaymentControl = ({
  order,
  canEdit,
}: OrderPaymentControlProps) => {
  const { updateOrder } = useOrders();
  const isPaid = order.financials.isPaid === true;
  const label = isPaid ? "Pagado" : "No pagado";

  const handleChange = async (paid: boolean) => {
    await updateOrder(order.id, { markAsPaid: paid });
  };

  if (!canEdit) {
    return (
      <Badge variant="outline" className={isPaid ? paidClass : unpaidClass}>
        {label}
      </Badge>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-7 w-25 flex items-center justify-between p-4 text-xs ${
            isPaid
              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/50 dark:hover:text-green-300"
              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-300"
          }`}
        >
          {label}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center">
        <DropdownMenuItem onClick={() => handleChange(true)}>
          Pagado
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChange(false)}>
          No pagado
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
