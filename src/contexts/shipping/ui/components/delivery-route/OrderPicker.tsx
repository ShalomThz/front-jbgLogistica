import { useState } from "react";
import { Badge, Button, Checkbox, Input } from "@contexts/shared/shadcn";
import { Eye, Package, Search } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { OrderDetailDialog } from "@contexts/order-flow/ui/components/order/detail/OrderDetailDialog";
import { useAlreadyRoutedShipmentIds } from "@contexts/shipping/infrastructure/hooks/routes/useRoutes";

interface Props {
  selectedShipmentIds: string[];
  onChange: (ids: string[]) => void;
  excludedShipmentIds?: Set<string>;
}

export const OrderPicker = ({ selectedShipmentIds, onChange, excludedShipmentIds }: Props) => {
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderListView | null>(null);

  const alreadyRoutedIds = useAlreadyRoutedShipmentIds();

  const { orders: fulfilledRaw, isLoading } = useOrders({
    filters: [{ field: "shipment.status", filterOperator: "=", value: "FULFILLED" }],
    limit: 100,
  });

  const fulfilled = fulfilledRaw.filter((o) => {
    if (!o.shipment) return false;
    if (alreadyRoutedIds.has(o.shipment.id)) return false;
    if (excludedShipmentIds?.has(o.shipment.id)) return false;
    return true;
  });

  const filtered = search.trim()
    ? fulfilled.filter((o) => {
        const q = search.toLowerCase();
        const tracking = o.shipment?.label?.trackingNumber?.toLowerCase() ?? "";
        const orderNum = (o.references.orderNumber ?? "").toLowerCase();
        const partner = (o.references.partnerOrderNumber ?? "").toLowerCase();
        const dest = o.destination.name.toLowerCase();
        return (
          tracking.includes(q) ||
          orderNum.includes(q) ||
          partner.includes(q) ||
          dest.includes(q)
        );
      })
    : fulfilled;

  const toggle = (shipmentId: string) => {
    onChange(
      selectedShipmentIds.includes(shipmentId)
        ? selectedShipmentIds.filter((id) => id !== shipmentId)
        : [...selectedShipmentIds, shipmentId],
    );
  };

  const toggleAll = () => {
    const allIds = filtered
      .map((o) => o.shipment!.id)
      .filter(Boolean);
    onChange(
      selectedShipmentIds.length === allIds.length ? [] : allIds,
    );
  };

  const allSelected =
    filtered.length > 0 &&
    filtered.every((o) => o.shipment && selectedShipmentIds.includes(o.shipment.id));

  return (
    <>
      <div className="flex flex-col gap-3 h-full">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por destino, n° factura o guía…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
            Cargando órdenes listas para despachar…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <Package className="size-9 opacity-25" />
            <p className="text-sm font-medium">
              {fulfilledRaw.length === 0
                ? "No hay órdenes con envío FULFILLED"
                : fulfilled.length === 0
                ? "Todas las órdenes FULFILLED ya están en otra ruta"
                : "Sin resultados para esa búsqueda"}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto min-h-0" style={{ maxHeight: "380px" }}>
            {/* Select-all header */}
            <div
              className="flex items-center gap-2.5 rounded-md border bg-muted/30 px-3 py-2 cursor-pointer select-none hover:bg-muted/50 transition-colors"
              onClick={toggleAll}
            >
              <Checkbox checked={allSelected} />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Seleccionar todos ({filtered.length})
              </span>
              {selectedShipmentIds.length > 0 && (
                <span className="ml-auto text-xs text-primary font-medium">
                  {selectedShipmentIds.length} seleccionado{selectedShipmentIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Order rows */}
            {filtered.map((order) => {
              const shipmentId = order.shipment!.id;
              const isSelected = selectedShipmentIds.includes(shipmentId);
              const tracking = order.shipment?.label?.trackingNumber;
              const orderRef =
                order.references.orderNumber ??
                order.references.partnerOrderNumber ??
                order.id.slice(0, 10).toUpperCase();
              const provider = order.shipment?.provider?.providerName;

              return (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {/* Checkbox — clicking anywhere on the row toggles */}
                  <div
                    className="flex items-center cursor-pointer"
                    onClick={() => toggle(shipmentId)}
                  >
                    <Checkbox checked={isSelected} />
                  </div>

                  {/* Order info — clicking toggles too */}
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => toggle(shipmentId)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {order.destination.name}
                      </span>
                      {provider && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {provider}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-xs text-muted-foreground">
                        Factura: <span className="font-mono">{orderRef}</span>
                      </span>
                      {tracking && (
                        <span className="text-xs text-muted-foreground">
                          · Guía: <span className="font-mono">{tracking}</span>
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        · {order.destination.address.city},{" "}
                        {order.destination.address.province}
                      </span>
                    </div>
                  </div>

                  {/* Details button */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1.5 text-xs shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDetailOrder(order);
                    }}
                  >
                    <Eye className="size-3.5" />
                    Detalles
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order detail dialog — nested inside the picker so it layers correctly */}
      <OrderDetailDialog
        order={detailOrder}
        open={!!detailOrder}
        onClose={() => setDetailOrder(null)}
      />
    </>
  );
};
