import { useMemo, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { Building2, ChevronLeft, ChevronRight, MoreHorizontal, Package, Pencil, Plus, Printer, RefreshCw, Trash2, Users } from "lucide-react";
import {
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@contexts/shared/shadcn";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { ORDER_STATUS_LABELS, ORDER_STATUS_VARIANT } from "@contexts/sales/domain/schemas/order/OrderStatusConfig";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import { shipmentRepository } from "@contexts/shipping/infrastructure/services/shipments/shipmentRepository";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { useBoxes } from "@contexts/inventory/infrastructure/hooks/boxes/useBoxes";
import { orderPolicies } from "@contexts/shared/domain/policies/order.policy";
import { useOrderFilters } from "../hooks/orders/useOrderFilters";
import { useOrderDialog } from "../hooks/orders/useOrderDialog";
import { OrderDetailDialog } from "../components/order/detail/OrderDetailDialog";
import { OrderDeleteDialog } from "../components/order/OrderDeleteDialog";
import { OrderFilters } from "../components/order/OrderFilters";
import { OrderReport } from "../components/order/OrderReport";
import { exportOrders } from "@contexts/order-flow/domain/services/exportOrders";

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

  const {
    selectedOrderId,
    selectedOrder,
    handleOpenDialog,
    handleCloseDialog,
  } = useOrderDialog(orders);

  const [orderToDelete, setOrderToDelete] = useState<OrderListView | null>(null);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [downloadingLabel, setDownloadingLabel] = useState<string | null>(null);
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);

  const handlePrintLabel = async (order: OrderListView) => {
    const shipment = order.shipment;
    if (!shipment?.label) return;
    setDownloadingLabel(order.id);
    try {
      const label = shipment.label;
      if (!label.documentUrl.startsWith("/")) {
        const printWindow = window.open(label.documentUrl, "_blank");
        printWindow?.print();
        return;
      }
      const blob = await shipmentRepository.getLabel(shipment.id);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
    } finally {
      setDownloadingLabel(null);
    }
  };

  const handlePrintInvoice = async (order: OrderListView) => {
    if (!order.invoiceId) return;
    setDownloadingInvoice(order.id);
    try {
      const blob = await orderRepository.getInvoicePdf(order.invoiceId);
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, "_blank");
      printWindow?.addEventListener("load", () => printWindow.print());
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
    handleCloseDialog();
  };

  const handleCancelShipment = async (shipmentId: string) => {
    await cancelShipment(shipmentId);
    handleCloseDialog();
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

      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">Ordenes</TabsTrigger>
          <TabsTrigger value="reports">Reportes</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
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
        onExport={() => exportOrders(filtered)}
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
              <TableHead className="w-[50px]">Acciones</TableHead>
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
                  onClick={() => handleOpenDialog(order)}
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
                            onClick={() => navigate(`/orders/${order.id}/edit`)}
                          >
                            <Pencil className="size-4" />
                            Editar orden
                          </DropdownMenuItem>
                        )}
                        {order.type === "PARTNER" && canEditHQ && order.status !== "COMPLETED" && order.status !== "CANCELLED" && (
                          <DropdownMenuItem
                            className="bg-green-50 text-green-700 focus:bg-green-100 focus:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:focus:bg-green-950/50"
                            onClick={() => navigate(`/orders/${order.id}/edit?mode=complete`)}
                          >
                            <Package className="size-4" />
                            Completar venta
                          </DropdownMenuItem>
                        )}
                        {(order.shipment?.label || order.invoiceId) && (
                          <>
                            <DropdownMenuSeparator />
                            {order.shipment?.label && (
                              <DropdownMenuItem
                                disabled={downloadingLabel === order.id}
                                onClick={() => handlePrintLabel(order)}
                              >
                                <Printer className="size-4" />
                                Imprimir etiqueta
                              </DropdownMenuItem>
                            )}
                            {order.invoiceId && (
                              <DropdownMenuItem
                                disabled={downloadingInvoice === order.id}
                                onClick={() => handlePrintInvoice(order)}
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
                              onClick={() => setOrderToDelete(order)}
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

        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <OrderReport orders={orders} />
        </TabsContent>
      </Tabs>

      <OrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrderId}
        onClose={handleCloseDialog}
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
                <span className="font-semibold">Oficina JBG Cargo</span>
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
                <span className="font-semibold">Agentes Autorizados</span>
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
