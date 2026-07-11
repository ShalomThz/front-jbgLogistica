import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import {
  availableLabelOptions,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { MoreHorizontal, Package, Pencil, Printer, Trash2 } from "lucide-react";

interface OrderActionsMenuProps {
  order: OrderListView;
  canEdit: boolean;
  canEditHQ: boolean;
  canDelete: boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
  onPrintInvoice: (order: OrderListView) => void;
  onEdit: (order: OrderListView) => void;
  onCompleteSale: (order: OrderListView) => void;
  onDelete: (order: OrderListView) => void;
}

export const OrderActionsMenu = ({
  order,
  canEdit,
  canEditHQ,
  canDelete,
  downloadingLabel,
  downloadingInvoice,
  onPrintLabel,
  onPrintInvoice,
  onEdit,
  onCompleteSale,
  onDelete,
}: OrderActionsMenuProps) => {
  const isOpen = order.status !== "COMPLETED" && order.status !== "CANCELLED";
  // The invoice is generated on demand from the order, so it is available
  // once the order has been priced (numbered + tariff + billed total).
  const canPrintInvoice = Boolean(
    order.references.orderNumber &&
      order.financials.tariff &&
      order.financials.totalBilled,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && isOpen && (
          <DropdownMenuItem
            className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
            onClick={() => onEdit(order)}
          >
            <Pencil className="size-4" />
            Editar orden
          </DropdownMenuItem>
        )}
        {order.type === "PARTNER" && canEditHQ && isOpen && (
          <DropdownMenuItem
            className="bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:focus:bg-green-950/50"
            onClick={() => onCompleteSale(order)}
          >
            <Package className="size-4" />
            Completar venta
          </DropdownMenuItem>
        )}
        {(order.shipment || canPrintInvoice) && (
          <>
            <DropdownMenuSeparator />
            {order.shipment &&
              availableLabelOptions(order.shipment, order).map((option) => (
                <DropdownMenuItem
                  key={option.id}
                  className={option.className}
                  disabled={downloadingLabel === order.id}
                  onClick={() => onPrintLabel(order, option.source)}
                >
                  <Printer className="size-4" />
                  Imprimir {option.title}
                </DropdownMenuItem>
              ))}
            {canPrintInvoice && (
              <DropdownMenuItem
                disabled={downloadingInvoice === order.id}
                onClick={() => onPrintInvoice(order)}
              >
                <Printer className="size-4" />
                Imprimir factura
              </DropdownMenuItem>
            )}
          </>
        )}
        {canDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="bg-red-50 text-red-700 focus:bg-red-100 focus:text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:focus:bg-red-950/50"
              onClick={() => onDelete(order)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
