import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { TableCell } from "@contexts/shared/shadcn";
import { CurrencyAmount } from "./CurrencyAmount";

interface TotalShippingCellProps {
  financials: OrderListView["financials"];
  createdAt: string;
}

export function TotalShippingCell({ financials, createdAt }: TotalShippingCellProps) {
  return (
    <TableCell className="text-right">
      <CurrencyAmount money={financials.totalPrice} date={new Date(createdAt)} />
    </TableCell>
  );
}
