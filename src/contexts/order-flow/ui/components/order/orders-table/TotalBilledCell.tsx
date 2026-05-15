import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { TableCell } from "@contexts/shared/shadcn";
import { CurrencyAmount } from "./CurrencyAmount";

interface TotalBilledCellProps {
  financials: OrderListView["financials"];
}

export function TotalBilledCell({ financials }: TotalBilledCellProps) {
  return (
    <TableCell className="text-right">
      <CurrencyAmount money={financials.totalBilled} emptyLabel="—" />
    </TableCell>
  );
}
