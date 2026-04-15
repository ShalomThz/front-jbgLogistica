import { useMemo, useState, useTransition } from "react";
import { useNavigate } from "react-router-dom";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { Building2, ChevronLeft, ChevronRight, Plus, RefreshCw, Users } from "lucide-react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@contexts/shared/shadcn";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useShipmentActions } from "@contexts/shipping/infrastructure/hooks/shipments/useShipments";
import type { LabelVariant } from "@contexts/shipping/domain/schemas/value-objects/LabelVariant";
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
import { OrdersTable } from "../components/order/OrdersTable";

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

  const { orders: allOrders } = useOrders();

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

  const handlePrintLabel = async (
    order: OrderListView,
    variant: LabelVariant,
  ) => {
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
      const blob = await shipmentRepository.getLabel(shipment.id, variant);
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
      />

      <OrdersTable
        orders={filtered}
        canEdit={canEdit}
        canEditHQ={canEditHQ}
        canDelete={canDelete}
        downloadingLabel={downloadingLabel}
        downloadingInvoice={downloadingInvoice}
        onOpenDetail={handleOpenDialog}
        onPrintLabel={handlePrintLabel}
        onPrintInvoice={handlePrintInvoice}
        onEdit={(order) => navigate(`/orders/${order.id}/edit`)}
        onCompleteSale={(order) => navigate(`/orders/${order.id}/edit?mode=complete`)}
        onDelete={(order) => setOrderToDelete(order)}
      />

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
          <OrderReport orders={allOrders} boxNames={boxNames} />
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
