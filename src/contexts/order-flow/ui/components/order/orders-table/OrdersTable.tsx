import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { BOX_CYCLE_STATUS_LABELS } from "@contexts/shipping/domain/schemas/shipment/ShipmentStatuses";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_VARIANT,
} from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import {
  availableLabelOptionsByGroup,
  type LabelSource,
} from "@contexts/shipping/ui/labels/labelOptions";
import { CarrierLogo } from "@contexts/shared/ui/components/CarrierLogo";
import { MapPin, Printer } from "lucide-react";
import { TotalBilledCell } from "./TotalBilledCell";
import { TotalShippingCell } from "./TotalShippingCell";
import { OrderActionsMenu } from "./OrderActionsMenu";
import { OrderPaymentControl } from "./OrderPaymentControl";
import { OrderCard } from "./OrderCard";

interface OrdersTableProps {
  orders: OrderListView[];
  highlightOrderId?: string;
  canEdit: (order: OrderListView) => boolean;
  canEditHQ: boolean;
  canDelete: (order: OrderListView) => boolean;
  canViewFinancials: boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  onOpenDetail: (order: OrderListView) => void;
  onPrintLabel: (order: OrderListView, source: LabelSource) => void;
  onPrintInvoice: (order: OrderListView) => void;
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
  downloadingLabel,
  downloadingInvoice,
  onOpenDetail,
  onPrintLabel,
  onPrintInvoice,
  onEdit,
  onCompleteSale,
  onDelete,
}: OrdersTableProps) => {
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
              onOpenDetail={onOpenDetail}
              onPrintLabel={onPrintLabel}
              onPrintInvoice={onPrintInvoice}
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
              <TableHead className="hidden md:table-cell">Creado por</TableHead>
              <TableHead>Compañía</TableHead>
              <TableHead className="hidden md:table-cell">Rastreo</TableHead>
              <TableHead className="hidden md:table-cell">Cliente</TableHead>
              <TableHead className="hidden md:table-cell">Destinatario</TableHead>
              <TableHead className="hidden md:table-cell">Destino</TableHead>
              <TableHead className="hidden sm:table-cell">Ref. JBG</TableHead>
              <TableHead className="hidden lg:table-cell">Ref. Agente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Creacion</TableHead>
              <TableHead>Pago</TableHead>
              {canViewFinancials && (
                <TableHead className="text-right">Total guías</TableHead>
              )}
              <TableHead className="text-right">Total facturado</TableHead>
              <TableHead className="w-12.5">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={canViewFinancials ? 14 : 13}
                  className="h-24 text-center text-muted-foreground"
                >
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer ${order.id === highlightOrderId ? "animate-flash-order " : ""}${order.status === "CANCELLED" ? "bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-500/15 dark:text-red-300 dark:hover:bg-red-500/25" : order.status === "PENDING_HQ_PROCESS" ? "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/25" : order.status === "COMPLETED" ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25" : ""}`}
                  onClick={() => onOpenDetail(order)}
                >
                  <TableCell className="hidden md:table-cell text-xs max-w-35">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div>
                          <div className="truncate font-medium">
                            {order.createdBy.name}
                          </div>
                          <div className="truncate text-muted-foreground">
                            {order.store.name}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <div>{order.createdBy.name}</div>
                        <div className="opacity-80">
                          Tienda: {order.store.name}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs">
                    {order.shipment?.label?.trackingUrl ? (
                      <a
                        href={order.shipment.label.trackingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MapPin className="size-3.5" />
                        Ver rastreo
                      </a>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">{order.origin.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.origin.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div>
                      <div className="font-medium">{order.destination.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {order.destination.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
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
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    <div className="flex items-center gap-1">
                      {order.shipment?.label && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                              disabled={downloadingLabel === order.id}
                              title="Imprimir etiqueta JBG Cargo"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Printer className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {availableLabelOptionsByGroup(
                              order.shipment,
                              "cargo",
                            ).map((option) => (
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <span>{order.references.orderNumber ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    <div className="flex items-center gap-1">
                      {order.shipment?.label && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 shrink-0 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/50"
                              disabled={downloadingLabel === order.id}
                              title="Imprimir etiqueta JBG Agente"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Printer className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {availableLabelOptionsByGroup(
                              order.shipment,
                              "agente",
                            ).map((option) => (
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <span>{order.references.partnerOrderNumber ?? "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                        {ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                      {order.shipment && BOX_CYCLE_STATUS_LABELS[order.shipment.status] && (
                        <Badge
                          variant="outline"
                          className="border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400"
                        >
                          {BOX_CYCLE_STATUS_LABELS[order.shipment.status]}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    <div>{new Date(order.createdAt).toLocaleDateString("es-MX")}</div>
                    <div>
                      {new Date(order.createdAt).toLocaleTimeString("es-MX", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <OrderPaymentControl order={order} canEdit={canEdit(order)} />
                  </TableCell>
                  {canViewFinancials && (
                    <TotalShippingCell financials={order.financials} createdAt={order.createdAt} />
                  )}
                  <TotalBilledCell financials={order.financials} />
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <OrderActionsMenu
                      order={order}
                      canEdit={canEdit(order)}
                      canEditHQ={canEditHQ}
                      canDelete={canDelete(order)}
                      downloadingLabel={downloadingLabel}
                      downloadingInvoice={downloadingInvoice}
                      onPrintLabel={onPrintLabel}
                      onPrintInvoice={onPrintInvoice}
                      onEdit={onEdit}
                      onCompleteSale={onCompleteSale}
                      onDelete={onDelete}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
};
