import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
import { ChevronDown, MoreHorizontal, Package, Pencil, Printer, Trash2 } from "lucide-react";
import { useOrders } from "../../../../sales/infrastructure/hooks/orders/userOrders";

interface OrdersTableProps {
  orders: OrderListView[];
  canEdit: (order: OrderListView) => boolean;
  canEditHQ: boolean;
  canDelete: (order: OrderListView) => boolean;
  downloadingLabel: string | null;
  downloadingInvoice: string | null;
  onOpenDetail: (order: OrderListView) => void;
  onPrintLabel: (order: OrderListView, variant: LabelVariant) => void;
  onPrintInvoice: (order: OrderListView) => void;
  onEdit: (order: OrderListView) => void;
  onCompleteSale: (order: OrderListView) => void;
  onDelete: (order: OrderListView) => void;
}

export const OrdersTable = ({
  orders,
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
}: OrdersTableProps) => {

  const { updateOrder } = useOrders()

  const handlePaymentStatusChange = async (order: OrderListView, isPaid: boolean) => {
    await updateOrder(order.id, { markAsPaid: isPaid });
  };

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="hidden md:table-cell">Creado por</TableHead>
            <TableHead>Compañía</TableHead>
            <TableHead className="hidden md:table-cell">Cliente</TableHead>
            <TableHead className="hidden md:table-cell">Destinatario</TableHead>
            <TableHead className="hidden md:table-cell">Destino</TableHead>
            <TableHead className="hidden sm:table-cell">Ref. JBG</TableHead>
            <TableHead className="hidden lg:table-cell">Ref. Agente</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="hidden lg:table-cell">Creacion</TableHead>
            <TableHead>Pago</TableHead>
            <TableHead className="text-right">Total guías</TableHead>
            <TableHead className="text-right">Total facturado</TableHead>
            <TableHead className="w-12.5">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                No se encontraron órdenes.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className={`cursor-pointer ${order.status === "PENDING_HQ_PROCESS" ? "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/25" : order.status === "COMPLETED" ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25" : ""}`}
                onClick={() => onOpenDetail(order)}
              >
                <TableCell className="hidden md:table-cell text-xs max-w-35">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <div className="truncate font-medium">{order.createdBy.name}</div>
                        <div className="truncate text-muted-foreground">{order.store.name}</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <div>{order.createdBy.name}</div>
                      <div className="opacity-80">Tienda: {order.store.name}</div>
                    </TooltipContent>
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {order.shipment?.provider?.providerName ?? "—"}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div>
                    <div className="font-medium">{order.origin.name}</div>
                    <div className="text-xs text-muted-foreground">{order.origin.phone}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div>
                    <div className="font-medium">{order.destination.name}</div>
                    <div className="text-xs text-muted-foreground">{order.destination.phone}</div>
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-sm cursor-help">
                        {order.destination.address.city}, {order.destination.address.province}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-0.5">
                        <div>{order.destination.address.address1}</div>
                        {order.destination.address.address2 && (
                          <div>{order.destination.address.address2}</div>
                        )}
                        <div>
                          {order.destination.address.city}, {order.destination.address.province}{" "}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-blue-600 hover:bg-blue-100 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/50"
                        disabled={downloadingLabel === order.id}
                        title="Imprimir etiqueta JBG Cargo"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintLabel(order, "cargo");
                        }}
                      >
                        <Printer className="size-3.5" />
                      </Button>
                    )}
                    <span>{order.references.orderNumber ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs">
                  <div className="flex items-center gap-1">
                    {order.shipment?.label && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 shrink-0 text-orange-600 hover:bg-orange-100 hover:text-orange-700 dark:text-orange-400 dark:hover:bg-orange-950/50"
                        disabled={downloadingLabel === order.id}
                        title="Imprimir etiqueta JBG Agente"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPrintLabel(order, "agente");
                        }}
                      >
                        <Printer className="size-3.5" />
                      </Button>
                    )}
                    <span>{order.references.partnerOrderNumber ?? "—"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {canEdit(order) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-25 flex items-center justify-between p-4 text-xs"
                        >
                          {order.financials.isPaid === true ? "Pagado" : "No pagado"}
                          <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="center">
                        <DropdownMenuItem onClick={() => handlePaymentStatusChange(order, true)}>
                          Pagado
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handlePaymentStatusChange(order, false)}>
                          No pagado
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (<div>  {order.financials.isPaid === true ? "Pagado" : "No pagado"}</div>)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${order.financials.totalPrice?.amount.toFixed(2) ?? "0.00"}
                </TableCell>
                <TableCell className="text-right font-mono">
                  ${(
                    (order.financials.totalPrice?.amount ?? 0) +
                    (order.financials.costBreakdown.insurance?.amount ?? 0) +
                    (order.financials.costBreakdown.tools?.amount ?? 0) +
                    (order.financials.costBreakdown.additionalCost?.amount ?? 0) +
                    (order.financials.costBreakdown.wrap?.amount ?? 0) +
                    (order.financials.costBreakdown.tape?.amount ?? 0)
                  ).toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit(order) && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                          onClick={() => onEdit(order)}
                        >
                          <Pencil className="size-4" />
                          Editar orden
                        </DropdownMenuItem>
                      )}
                      {order.type === "PARTNER" && canEditHQ && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                        <DropdownMenuItem
                          className="bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:focus:bg-green-950/50"
                          onClick={() => onCompleteSale(order)}
                        >
                          <Package className="size-4" />
                          Completar venta
                        </DropdownMenuItem>
                      )}
                      {(order.shipment?.label || order.invoiceId) && (
                        <>
                          <DropdownMenuSeparator />
                          {order.shipment?.label && (
                            <>
                              <DropdownMenuItem
                                className="bg-blue-50 text-blue-700 focus:bg-blue-100 focus:text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 dark:focus:bg-blue-950/50"
                                disabled={downloadingLabel === order.id}
                                onClick={() => onPrintLabel(order, "cargo")}
                              >
                                <Printer className="size-4" />
                                Imprimir etiqueta JBG Cargo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="bg-orange-50 text-orange-700 focus:bg-orange-100 focus:text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 dark:focus:bg-orange-950/50"
                                disabled={downloadingLabel === order.id}
                                onClick={() => onPrintLabel(order, "agente")}
                              >
                                <Printer className="size-4" />
                                Imprimir etiqueta JBG Agente
                              </DropdownMenuItem>
                            </>
                          )}
                          {order.invoiceId && (
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
                      {canDelete(order) && (
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
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
