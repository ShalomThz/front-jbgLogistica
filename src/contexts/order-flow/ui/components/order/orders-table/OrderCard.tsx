import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { Badge } from "@contexts/shared/shadcn";
import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
import { CurrencyAmount } from "./CurrencyAmount";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { OrderPaymentControl } from "./OrderPaymentControl";

interface OrderCardProps {
  order: OrderListView;
  isHighlighted?: boolean;
  canEdit: boolean;
  canEditHQ: boolean;
  canDelete: boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  onOpenDetail: (order: OrderListView) => void;
  onPrintLabel: (order: OrderListView, variant: LabelVariant) => void;
  onPrintInvoice: (order: OrderListView) => void;
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
  downloadingLabel,
  downloadingInvoice,
  onOpenDetail,
  onPrintLabel,
  onPrintInvoice,
  onEdit,
  onCompleteSale,
  onDelete,
}: OrderCardProps) => {
  const statusClass =
    order.status === "CANCELLED"
      ? "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300"
      : order.status === "PENDING_HQ_PROCESS"
        ? "bg-yellow-50 dark:bg-yellow-500/15"
        : order.status === "COMPLETED"
          ? "bg-blue-50 dark:bg-blue-500/15"
          : "";

  return (
    <div
      className={`cursor-pointer space-y-3 rounded-lg border p-3 ${isHighlighted ? "animate-flash-order " : ""}${statusClass}`}
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
            {new Date(order.createdAt).toLocaleDateString("es-MX")}
          </div>
        </div>
        <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
          {ORDER_STATUS_LABELS[order.status]}
        </Badge>
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
        <div>
          <div className="text-xs text-muted-foreground">Total guías</div>
          <CurrencyAmount
            money={order.financials.totalPrice}
            date={new Date(order.createdAt)}
            align="start"
          />
        </div>
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
          onPrintLabel={onPrintLabel}
          onPrintInvoice={onPrintInvoice}
          onEdit={onEdit}
          onCompleteSale={onCompleteSale}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
};
