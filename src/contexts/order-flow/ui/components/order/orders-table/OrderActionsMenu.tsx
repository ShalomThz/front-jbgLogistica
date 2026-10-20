import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@contexts/shared/shadcn";
import {
  canInvoice,
  canInvoicePartner,
  type InvoiceVariant,
} from "@contexts/sales/ui/invoices/invoiceActions";
import {
  isBeforeSale,
  labelCreationOf,
} from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import {
  availableLabelOptions,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { Loader2, Mail, MoreHorizontal, Package, Pencil, Printer } from "lucide-react";
import {
  DisabledReason,
  LABEL_PENDING_REASON,
  SALE_PROCESSED_REASON,
} from "../DisabledReason";

interface OrderActionsMenuProps {
  order: OrderListView;
  canEdit: boolean;
  canEditHQ: boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  sendingInvoiceOrderId: string | null;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
  onPrintInvoice: (order: OrderListView, variant?: InvoiceVariant) => void;
  onSendInvoiceEmail: (order: OrderListView) => void;
  onEdit: (order: OrderListView) => void;
  onCompleteSale: (order: OrderListView) => void;
}

export const OrderActionsMenu = ({
  order,
  canEdit,
  canEditHQ,
  downloadingLabel,
  downloadingInvoice,
  sendingInvoiceOrderId,
  onPrintLabel,
  onPrintInvoice,
  onSendInvoiceEmail,
  onEdit,
  onCompleteSale,
}: OrderActionsMenuProps) => {
  const isOpen = order.status !== "COMPLETED" && order.status !== "CANCELLED";
  // Con la guía en creación no se entra a completar la venta (ver EditOrderPage).
  const labelPending =
    !!order.shipment && labelCreationOf(order.shipment) === "pending";
  // "Editar orden" de una HQ es completar la venta; la del socio, su
  // formulario, que ya no se abre cuando HQ eligió la paquetería (el back
  // rechaza cambiar los datos de la guía).
  const saleProcessed =
    order.type === "PARTNER" &&
    !!order.shipment &&
    !isBeforeSale(order.shipment.status);
  const editBlockReason = labelPending
    ? LABEL_PENDING_REASON
    : saleProcessed
      ? SALE_PROCESSED_REASON
      : null;
  const canPrintInvoice = canInvoice(order);
  const canPrintPartnerInvoice = canInvoicePartner(order);
  const { user } = useAuth();
  // Sin el permiso el back rechaza la descarga: no se ofrecen etiquetas.
  const labelOptions =
    user && shippingPolicies.viewLabel(user) && order.shipment
      ? availableLabelOptions(order.shipment, order, user.store.type)
      : [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {canEdit && isOpen && (
          <DisabledReason
            reason={editBlockReason}
            className="block"
          >
            <DropdownMenuItem
              className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
              disabled={!!editBlockReason}
              onClick={() => onEdit(order)}
            >
              <Pencil className="size-4" />
              Editar orden
            </DropdownMenuItem>
          </DisabledReason>
        )}
        {order.type === "PARTNER" && canEditHQ && isOpen && (
          <DisabledReason
            reason={labelPending ? LABEL_PENDING_REASON : null}
            className="block"
          >
            <DropdownMenuItem
              className="bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:focus:bg-green-950/50"
              disabled={labelPending}
              onClick={() => onCompleteSale(order)}
            >
              <Package className="size-4" />
              Completar venta
            </DropdownMenuItem>
          </DisabledReason>
        )}
        {(labelOptions.length > 0 || canPrintInvoice || canPrintPartnerInvoice) && (
          <>
            <DropdownMenuSeparator />
            {labelOptions.map((option) => (
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
            {/* La del socio no depende de que JBG haya procesado la orden: es
                la que él le entrega a su cliente el mismo día. */}
            {canPrintPartnerInvoice && (
              <DropdownMenuItem
                disabled={downloadingInvoice === order.id}
                onClick={() => onPrintInvoice(order, "partner")}
              >
                <Printer className="size-4" />
                Imprimir factura de agente
              </DropdownMenuItem>
            )}
            {canPrintInvoice && (
              <>
                <DropdownMenuItem
                  disabled={downloadingInvoice === order.id}
                  onClick={() => onPrintInvoice(order, "jbg")}
                >
                  <Printer className="size-4" />
                  Imprimir factura
                </DropdownMenuItem>
                {canEdit && order.origin.email && (
                  <DropdownMenuItem
                    disabled={sendingInvoiceOrderId === order.id}
                    onClick={() => onSendInvoiceEmail(order)}
                  >
                    {sendingInvoiceOrderId === order.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                    {sendingInvoiceOrderId === order.id
                      ? "Enviando factura..."
                      : "Enviar factura por correo"}
                  </DropdownMenuItem>
                )}
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
