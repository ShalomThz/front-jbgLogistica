import { useMemo, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { Building2, ChevronLeft, ChevronRight, FileText, Package, Pencil, Plus, RefreshCw, Tag, Trash2, Users } from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { orderPolicies } from "@contexts/shared/custom/policies/order.policy";
import { useOrderFilters } from "../hooks/useOrderFilters";
import { OrderDetailDialog } from "../components/order/OrderDetailDialog";
import { OrderDeleteDialog } from "../components/order/OrderDeleteDialog";
import { OrderFilters } from "../components/order/OrderFilters";

const LIMIT_OPTIONS = [10, 20, 50];

export const OrdersPage = () => {
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);

  const {
    orders,
    pagination,
    totalPages,
    isLoading,
    refetch,
    deleteOrder,
    isDeleting,
  } = useOrders({ page, limit });

  const { cancelShipment, isCancelling } = useShipmentActions();
  const { user } = useAuth();
  const { boxes: allBoxes } = useBoxes();

  const boxNames = useMemo(
    () => new Map(allBoxes.map((b) => [b.id, b.name])),
    [allBoxes],
  );

  const { filters, setFilter, resetFilters, filtered, options } = useOrderFilters(orders, { boxNames });

  const [selectedOrder, setSelectedOrder] = useState<OrderListView | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<OrderListView | null>(null);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const handleDownloadLabel = async (order: OrderListView) => {
    const shipment = order.shipment;
    if (!shipment?.label) return;
    setDownloadingLabel(order.id);
    try {
      const label = shipment.label;
      if (!label.documentUrl.startsWith("/")) {
        window.open(label.documentUrl, "_blank");
        return;
      }
      const blob = await shipmentRepository.getLabel(shipment.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${order.references.orderNumber ?? order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingLabel(null);
    }
  };

  const handleDownloadInvoice = async (order: OrderListView) => {
    if (!order.invoiceId) return;
    setDownloadingInvoice(order.id);
    try {
      const blob = await orderRepository.getInvoicePdf(order.invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${order.references.orderNumber ?? order.id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const canCreatePartner = user ? orderPolicies.createPartner(user) : false;
  const canCreateHQ = user ? orderPolicies.createHQ(user) : false;
  const canEditPartner = user ? orderPolicies.editPartner(user) : false;
  const canEditHQ = user ? orderPolicies.editHQ(user) : false;
  const canDeletePartner = user ? orderPolicies.deletePartner(user) : false;
  const canDeleteHQ = user ? orderPolicies.deleteHQ(user) : false;

  const canEdit = (order: OrderListView) =>
    order.type === "PARTNER" ? canEditPartner : canEditHQ;
  const canDelete = (order: OrderListView) =>
    order.type === "PARTNER" ? canDeletePartner : canDeleteHQ;

  const handleCreateOrder = () => {
    if (canCreatePartner && canCreateHQ) {
      setShowNewOrderDialog(true);
      return;
    }
    if (canCreateHQ) {
      startTransition(() => navigate("/orders/new/hq"));
      return;
    }
    startTransition(() => navigate("/orders/new/partner"));
  };

  const handleDelete = async () => {
    if (!orderToDelete) return;
    await deleteOrder(orderToDelete.id);
    setOrderToDelete(null);
    setSelectedOrder(null);
  };

  const handleCancelShipment = async (shipmentId: string) => {
    await cancelShipment(shipmentId);
    setSelectedOrder(null);
  };

  const from = pagination ? pagination.offset + 1 : 0;
  const to = pagination ? pagination.offset + orders.length : 0;
  const total = pagination?.total ?? 0;

  if (isLoading || isPending) {
    return <PageLoader text={isPending ? "Cargando nueva orden..." : "Cargando órdenes..."} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => { resetFilters(); refetch(); }}>
            <RefreshCw className="size-4" />
          </Button>
          {(canCreatePartner || canCreateHQ) && (
            <Button onClick={handleCreateOrder}>
              <Plus className="size-4" />
              Crear Orden
            </Button>
          )}
        </div>
      </div>

      <OrderFilters
        filters={filters}
        options={options}
        limit={limit}
        limitOptions={LIMIT_OPTIONS}
        setFilter={setFilter}
        onLimitChange={(v) => {
          setLimit(v);
          setPage(1);
        }}
        onResetAndRefetch={() => { resetFilters(); refetch(); }}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Destinatario</TableHead>
              <TableHead className="hidden md:table-cell">Destino</TableHead>
              <TableHead className="hidden sm:table-cell">Ref. JBG</TableHead>
              <TableHead className="hidden lg:table-cell">Ref. Agente</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="hidden lg:table-cell">Creacion</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron órdenes.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((order) => (
                <TableRow
                  key={order.id}
                  className={`cursor-pointer ${order.status === "PENDING_HQ_PROCESS" ? "bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-500/15 dark:hover:bg-yellow-500/25" : order.status === "COMPLETED" ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-500/15 dark:hover:bg-blue-500/25" : ""}`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.destination.name}</div>
                      <div className="text-xs text-muted-foreground">{order.destination.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="text-sm">
                      {order.destination.address.city}, {order.destination.address.province}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-xs">
                    {order.references.orderNumber ?? "—"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs">
                    {order.references.partnerOrderNumber ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={ORDER_STATUS_VARIANT[order.status]}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString("es-MX")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${order.financials.totalPrice?.amount.toFixed(2) ?? "0.00"}
                  </TableCell>
                  <TableCell>
                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center gap-1">
                        {canEdit(order) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-blue-500 hover:text-blue-700"
                                disabled={order.status === "COMPLETED" || order.status === "CANCELLED"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}/edit`);
                                }}
                              >
                                <Pencil className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar orden</TooltipContent>
                          </Tooltip>
                        )}
                        {order.type === "PARTNER" && canEditHQ && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-purple-500 hover:text-purple-700"
                                disabled={order.status === "COMPLETED" || order.status === "CANCELLED"}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/orders/${order.id}/edit?mode=complete`);
                                }}
                              >
                                <Package className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Completar venta</TooltipContent>
                          </Tooltip>
                        )}
                        {order.shipment?.label && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-orange-500 hover:text-orange-700"
                                disabled={downloadingLabel === order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadLabel(order);
                                }}
                              >
                                <Tag className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Descargar etiqueta</TooltipContent>
                          </Tooltip>
                        )}
                        {order.invoiceId && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-green-600 hover:text-green-800"
                                disabled={downloadingInvoice === order.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadInvoice(order);
                                }}
                              >
                                <FileText className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Descargar factura</TooltipContent>
                          </Tooltip>
                        )}
                        {canDelete(order) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8 text-red-500 hover:text-red-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOrderToDelete(order);
                                }}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar orden</TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {from}-{to} de {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="size-4" />
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!pagination.hasMore}
            >
              Siguiente
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onDelete={(order) => setOrderToDelete(order)}
        isDeleting={isDeleting}
        onCancelShipment={handleCancelShipment}
        isCancelling={isCancelling}
      />

      <OrderDeleteDialog
        order={orderToDelete}
        open={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />

      <Dialog open={showNewOrderDialog} onOpenChange={setShowNewOrderDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Orden</DialogTitle>
            <DialogDescription>
              Selecciona el tipo de orden que deseas crear
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              className="cursor-pointer rounded-lg border p-4 text-left transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => {
                setShowNewOrderDialog(false);
                startTransition(() => navigate("/orders/new/hq"));
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Building2 className="size-5 text-primary" />
                </div>
                <span className="font-semibold">Orden JBG</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Orden completa con cotización de envío, peso, producto y guía.
              </p>
            </button>
            <button
              type="button"
              className="cursor-pointer rounded-lg border p-4 text-left transition-all hover:shadow-md hover:border-primary/50"
              onClick={() => {
                setShowNewOrderDialog(false);
                startTransition(() => navigate("/orders/new/partner"));
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <Users className="size-5 text-primary" />
                </div>
                <span className="font-semibold">Orden Agente</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Orden simplificada: contactos, dimensiones y creación directa.
              </p>
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
