import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { CarrierLogo } from "@contexts/shared/ui/components/CarrierLogo";
import type { LabelSource } from "@contexts/shipping/ui/labels/labelOptions";
import { MapPin } from "lucide-react";
import type { ReactNode } from "react";
import { OrderProgressBar } from "../OrderProgressBar";
import { CurrencyAmount } from "./CurrencyAmount";
import { LabelPrintMenu } from "./LabelPrintMenu";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { OrderPaymentControl } from "./OrderPaymentControl";

/** Lo que las celdas necesitan de la página y no sale de la orden. */
export interface OrderColumnContext {
  canEdit: (order: OrderListView) => boolean;
  canEditHQ: boolean;
  canDelete: (order: OrderListView) => boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  sendingInvoiceOrderId: string | null;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
  onPrintInvoice: (order: OrderListView) => void;
  onSendInvoiceEmail: (order: OrderListView) => void;
  onEdit: (order: OrderListView) => void;
  onCompleteSale: (order: OrderListView) => void;
  onDelete: (order: OrderListView) => void;
}

export interface OrderColumn {
  id: string;
  /** El nombre en el encabezado y en el menú de columnas. */
  label: string;
  /**
   * Clases que comparten el `<TableHead>` y el `<TableCell>`. Están juntas a
   * propósito: cuando cada uno llevaba las suyas, un `hidden md:table-cell`
   * puesto en uno y no en el otro corría la tabla entera.
   */
  className?: string;
  /** Clases solo de la celda, cuando el contenido las necesita. */
  cellClassName?: string;
  /** La celda tiene controles propios y su clic no debe abrir el detalle. */
  interactive?: boolean;
  /** No se puede ocultar: sin esto no queda forma de operar la fila. */
  fixed?: boolean;
  /** Solo se arma con permiso de ver financieros. */
  requiresFinancials?: boolean;
  cell: (order: OrderListView, ctx: OrderColumnContext) => ReactNode;
}

/**
 * Las columnas de la tabla de órdenes, en orden.
 *
 * El encabezado y el cuerpo se arman de esta misma lista, así que no pueden
 * quedar desfasados: agregar, quitar u ocultar una columna es un solo cambio.
 * El `colSpan` del estado vacío también sale de acá.
 */
export const ORDER_COLUMNS: OrderColumn[] = [
  // Primera a propósito: es lo que se busca al abrir la pantalla, y en la
  // columna de la izquierda se escanea en vertical sin cruzar la tabla.
  {
    id: "status",
    label: "Estado",
    cell: (order) => <OrderProgressBar order={order} />,
  },
  {
    id: "createdBy",
    label: "Creado por",
    className: "hidden md:table-cell",
    cellClassName: "text-xs max-w-35",
    cell: (order) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <div className="truncate font-medium">{order.createdBy.name}</div>
            <div className="truncate text-muted-foreground">
              {order.store.name}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div>{order.createdBy.name}</div>
          <div className="opacity-80">Tienda: {order.store.name}</div>
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    id: "company",
    label: "Compañía",
    cell: (order) => (
      <div className="flex items-center gap-2.5">
        <CarrierLogo
          name={order.shipment?.provider?.providerName}
          className="size-9 shrink-0 rounded object-contain"
        />
        <div className="text-sm">
          <div className="font-medium">
            {order.shipment?.provider?.providerName ?? "—"}
          </div>
          <div className="text-xs text-muted-foreground">
            {order.shipment?.label?.trackingNumber ??
              "No. de guía no disponible"}
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "tracking",
    label: "Rastreo",
    className: "hidden md:table-cell",
    cellClassName: "text-xs",
    cell: (order) =>
      order.shipment?.label?.trackingUrl ? (
        <a
          href={order.shipment.label.trackingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <MapPin className="size-3.5" />
          Ver rastreo
        </a>
      ) : (
        "—"
      ),
  },
  {
    id: "customer",
    label: "Cliente",
    className: "hidden md:table-cell",
    cell: (order) => (
      <div>
        <div className="font-medium">{order.origin.name}</div>
        <div className="text-xs text-muted-foreground">{order.origin.phone}</div>
      </div>
    ),
  },
  {
    id: "recipient",
    label: "Destinatario",
    className: "hidden md:table-cell",
    cell: (order) => (
      <div>
        <div className="font-medium">{order.destination.name}</div>
        <div className="text-xs text-muted-foreground">
          {order.destination.phone}
        </div>
      </div>
    ),
  },
  {
    id: "destination",
    label: "Destino",
    className: "hidden md:table-cell",
    cell: (order) => (
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-sm cursor-help">
            {order.destination.address.city},{" "}
            {order.destination.address.province}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-0.5">
            <div>{order.destination.address.address1}</div>
            {order.destination.address.address2 && (
              <div>{order.destination.address.address2}</div>
            )}
            <div>
              {order.destination.address.city},{" "}
              {order.destination.address.province}{" "}
              {order.destination.address.zip}
            </div>
            <div>{order.destination.address.country}</div>
            {order.destination.address.reference && (
              <div className="pt-1 italic opacity-80">
                Ref: {order.destination.address.reference}
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    ),
  },
  {
    id: "jbgRef",
    label: "Ref. JBG",
    className: "hidden sm:table-cell",
    cellClassName: "text-xs",
    cell: (order, ctx) => (
      <div className="flex items-center gap-1">
        <LabelPrintMenu
          order={order}
          group="cargo"
          title="Imprimir etiqueta JBG Cargo"
          downloadingLabel={ctx.downloadingLabel}
          onPrintLabel={ctx.onPrintLabel}
        />
        <span>{order.references.orderNumber ?? "—"}</span>
      </div>
    ),
  },
  {
    id: "partnerRef",
    label: "Ref. Agente",
    className: "hidden lg:table-cell",
    cellClassName: "text-xs",
    cell: (order, ctx) => (
      <div className="flex items-center gap-1">
        <LabelPrintMenu
          order={order}
          group="agente"
          title="Imprimir etiqueta JBG Agente"
          downloadingLabel={ctx.downloadingLabel}
          onPrintLabel={ctx.onPrintLabel}
        />
        <span>{order.references.partnerOrderNumber ?? "—"}</span>
      </div>
    ),
  },
  {
    id: "createdAt",
    label: "Creación",
    className: "hidden lg:table-cell",
    cellClassName: "text-xs text-muted-foreground",
    cell: (order) => (
      <>
        <div>{new Date(order.createdAt).toLocaleDateString("es-MX")}</div>
        <div>
          {new Date(order.createdAt).toLocaleTimeString("es-MX", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </>
    ),
  },
  {
    // "Pago" a secas no decía a quién: en una orden de socio hay dos libros, y
    // éste es el de lo que se le paga a JBG. El del agente con su cliente vive
    // en el detalle, en su propia pestaña.
    id: "payment",
    label: "Pago JBG",
    interactive: true,
    cell: (order, ctx) => (
      <OrderPaymentControl order={order} canEdit={ctx.canEdit(order)} />
    ),
  },
  {
    id: "totalShipping",
    label: "Total guías",
    className: "text-right",
    requiresFinancials: true,
    cell: (order) => (
      <CurrencyAmount
        money={order.financials.totalPrice}
        date={new Date(order.createdAt)}
      />
    ),
  },
  {
    id: "totalBilled",
    label: "Total facturado",
    className: "text-right",
    cell: (order) => (
      <CurrencyAmount money={order.financials.totalBilled} emptyLabel="—" />
    ),
  },
  {
    id: "actions",
    label: "Acciones",
    className: "w-12.5",
    interactive: true,
    fixed: true,
    cell: (order, ctx) => (
      <OrderActionsMenu
        order={order}
        canEdit={ctx.canEdit(order)}
        canEditHQ={ctx.canEditHQ}
        canDelete={ctx.canDelete(order)}
        downloadingLabel={ctx.downloadingLabel}
        downloadingInvoice={ctx.downloadingInvoice}
        sendingInvoiceOrderId={ctx.sendingInvoiceOrderId}
        onPrintLabel={ctx.onPrintLabel}
        onPrintInvoice={ctx.onPrintInvoice}
        onSendInvoiceEmail={ctx.onSendInvoiceEmail}
        onEdit={ctx.onEdit}
        onCompleteSale={ctx.onCompleteSale}
        onDelete={ctx.onDelete}
      />
    ),
  },
];

/**
 * Las que el permiso habilita. Vive acá y no duplicado en la tabla y en el menú
 * de columnas —el menú ofrece estas, la tabla arma las visibles de entre
 * estas— porque si cada uno lo resolviera por su lado podrían discrepar y
 * quedaría una columna ofrecida que no se arma, o al revés.
 */
export function allowedOrderColumns(
  columns: OrderColumn[],
  canViewFinancials: boolean,
): OrderColumn[] {
  return columns.filter(
    (column) => !column.requiresFinancials || canViewFinancials,
  );
}

/** Las permitidas que además el usuario no escondió. Las fijas nunca se van. */
export function visibleOrderColumns(
  columns: OrderColumn[],
  canViewFinancials: boolean,
  isHidden: (columnId: string) => boolean,
): OrderColumn[] {
  return allowedOrderColumns(columns, canViewFinancials).filter(
    (column) => column.fixed || !isHidden(column.id),
  );
}
