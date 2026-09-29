import { orderProgress } from "@contexts/order-flow/domain/services/orderProgress";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { TONE_ROW } from "@contexts/shared/domain/schemas/StatusTone";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@contexts/shared/shadcn";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { LabelSource } from "@contexts/shipping/ui/labels/labelOptions";
import { useMemo } from "react";
import { OrderCard } from "./OrderCard";
import {
  ORDER_COLUMNS,
  visibleOrderColumns,
  type OrderColumnContext,
} from "./orderTableColumns";

/**
 * El color de la fila sale del **tono**, no del estatus de la orden.
 *
 * Es la diferencia con la versión anterior, que pintaba amarillo las por
 * procesar, azul las procesadas y rojo las canceladas: eso gastaba el elemento
 * de más peso visual de la tabla en el dato menos accionable. Ahora el tinte dice
 * de quién es la pelota —ámbar espera a alguien, azul se mueve solo, verde llegó,
 * rojo se cortó— y coincide con la barra, el encabezado del detalle y el badge,
 * porque los cuatro leen `SHIPMENT_STATUS_TONE`.
 *
 * La cancelada se tiñe **y** se atenúa: el rojo dice qué pasó, la opacidad que
 * ya no va a pasar nada más.
 */
const ROW_CLASS = (order: OrderListView): string =>
  cn(
    TONE_ROW[orderProgress(order).tone],
    order.status === "CANCELLED" && "opacity-60",
  );

interface OrdersTableProps {
  orders: OrderListView[];
  highlightOrderId?: string;
  canEdit: (order: OrderListView) => boolean;
  canEditHQ: boolean;
  canDelete: (order: OrderListView) => boolean;
  canViewFinancials: boolean;
  /** Qué columnas escondió el usuario. El estado vive en la página, junto al
   * menú que lo cambia, que está en la barra de herramientas. */
  isHidden: (columnId: string) => boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  sendingInvoiceOrderId: string | null;
  onOpenDetail: (order: OrderListView) => void;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
  onPrintInvoice: (order: OrderListView) => void;
  onSendInvoiceEmail: (order: OrderListView) => void;
  onEdit: (order: OrderListView) => void;
  onCompleteSale: (order: OrderListView) => void;
  onDelete: (order: OrderListView) => void;
}

export const OrdersTable = ({
  orders,
  highlightOrderId,
  canEdit,
  canEditHQ,
  canDelete,
  canViewFinancials,
  isHidden,
  downloadingLabel,
  downloadingInvoice,
  sendingInvoiceOrderId,
  onOpenDetail,
  onPrintLabel,
  onPrintInvoice,
  onSendInvoiceEmail,
  onEdit,
  onCompleteSale,
  onDelete,
}: OrdersTableProps) => {
  const visible = useMemo(
    () =>
      visibleOrderColumns(ORDER_COLUMNS, canViewFinancials, isHidden),
    [canViewFinancials, isHidden],
  );

  const ctx: OrderColumnContext = {
    canEdit,
    canEditHQ,
    canDelete,
    downloadingLabel,
    downloadingInvoice,
    sendingInvoiceOrderId,
    onPrintLabel,
    onPrintInvoice,
    onSendInvoiceEmail,
    onEdit,
    onCompleteSale,
    onDelete,
  };

  return (
    <>
      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden min-h-0 overflow-auto">
        {orders.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-muted-foreground">
            No se encontraron órdenes.
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isHighlighted={order.id === highlightOrderId}
              canEdit={canEdit(order)}
              canEditHQ={canEditHQ}
              canDelete={canDelete(order)}
              canViewFinancials={canViewFinancials}
              downloadingLabel={downloadingLabel}
              downloadingInvoice={downloadingInvoice}
              sendingInvoiceOrderId={sendingInvoiceOrderId}
              onOpenDetail={onOpenDetail}
              onPrintLabel={onPrintLabel}
              onPrintInvoice={onPrintInvoice}
              onSendInvoiceEmail={onSendInvoiceEmail}
              onEdit={onEdit}
              onCompleteSale={onCompleteSale}
              onDelete={onDelete}
            />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden rounded-lg border md:block min-h-0 overflow-hidden [&>div]:max-h-full [&>div]:overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              {visible.map((column) => (
                <TableHead key={column.id} className={column.className}>
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visible.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className={cn(
                    "cursor-pointer",
                    order.id === highlightOrderId && "animate-flash-order",
                    ROW_CLASS(order),
                  )}
                  onClick={() => onOpenDetail(order)}
                >
                  {visible.map((column) => (
                    <TableCell
                      key={column.id}
                      className={cn(column.className, column.cellClassName)}
                      onClick={
                        column.interactive
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {column.cell(order, ctx)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
