import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { orderProgress } from "@contexts/order-flow/domain/services/orderProgress";
import { TONE_ROW } from "@contexts/shared/domain/schemas/StatusTone";
import { cn } from "@contexts/shared/shadcn/lib/utils";
import type { LabelSource } from "@contexts/shipping/ui/labels/labelOptions";
import { OrderProgressBar } from "../OrderProgressBar";
import { CurrencyAmount } from "./CurrencyAmount";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { OrderPaymentControl } from "./OrderPaymentControl";

interface OrderCardProps {
  order: OrderListView;
  isHighlighted?: boolean;
  canEdit: boolean;
  canEditHQ: boolean;
  canDelete: boolean;
  canViewFinancials: boolean;
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

const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

export const OrderCard = ({
  order,
  isHighlighted,
  canEdit,
  canEditHQ,
  canDelete,
  canViewFinancials,
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
}: OrderCardProps) => {
  return (
    <div
      className={cn(
        "cursor-pointer space-y-3 rounded-lg border p-3",
        isHighlighted && "animate-flash-order",
        // Misma regla que las filas de la tabla: el tinte sale del tono, no del
        // estatus de la orden. Ver ROW_CLASS en OrdersTable.
        TONE_ROW[orderProgress(order).tone],
        order.status === "CANCELLED" && "opacity-60",
      )}
      onClick={() => onOpenDetail(order)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-medium">
            {order.shipment?.provider?.providerName ?? "—"}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {order.createdBy.name} · {order.store.name}
          </div>
          <div className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleDateString("es-MX")}{" "}
            {new Date(order.createdAt).toLocaleTimeString("es-MX", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <OrderProgressBar order={order} className="shrink-0 items-end" />
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Cliente</div>
          <div className="truncate">{order.origin.name}</div>
        </div>
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">Destinatario</div>
          <div className="truncate">{order.destination.name}</div>
        </div>
        <div className="col-span-2 min-w-0">
          <div className="text-xs text-muted-foreground">Destino</div>
          <div className="truncate">
            {order.destination.address.city},{" "}
            {order.destination.address.province}
          </div>
        </div>
        {(order.references.orderNumber ||
          order.references.partnerOrderNumber) && (
          <div className="col-span-2 flex gap-4">
            <div>
              <div className="text-xs text-muted-foreground">Ref. JBG</div>
              <div>{order.references.orderNumber ?? "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Ref. Agente</div>
              <div>{order.references.partnerOrderNumber ?? "—"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-end justify-between gap-2 border-t pt-2 text-sm">
        {canViewFinancials && (
          <div>
            <div className="text-xs text-muted-foreground">Total guías</div>
            <CurrencyAmount
              money={order.financials.totalPrice}
              date={new Date(order.createdAt)}
              align="start"
            />
          </div>
        )}
        <div className="text-right">
          <div className="text-xs text-muted-foreground">Total facturado</div>
          <CurrencyAmount
            money={order.financials.totalBilled}
            emptyLabel="—"
            align="end"
          />
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-2"
        onClick={stopPropagation}
      >
        <OrderPaymentControl order={order} canEdit={canEdit} />
        <OrderActionsMenu
          order={order}
          canEdit={canEdit}
          canEditHQ={canEditHQ}
          canDelete={canDelete}
          downloadingLabel={downloadingLabel}
          downloadingInvoice={downloadingInvoice}
          sendingInvoiceOrderId={sendingInvoiceOrderId}
          onPrintLabel={onPrintLabel}
          onPrintInvoice={onPrintInvoice}
          onSendInvoiceEmail={onSendInvoiceEmail}
          onEdit={onEdit}
          onCompleteSale={onCompleteSale}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
