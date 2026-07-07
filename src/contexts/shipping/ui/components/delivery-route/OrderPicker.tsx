import { useState } from "react";
import { Badge, Button, Checkbox, Input } from "@contexts/shared/shadcn";
import { Eye, MapPinOff, Package, Search } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { Filter } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { useAuth } from "@contexts/iam/infrastructure/hooks/auth/useAuth";
import { shippingPolicies } from "@contexts/shared/domain/policies/shipping.policy";
import { OrderDetailDialog } from "@contexts/order-flow/ui/components/order/detail/OrderDetailDialog";
import { needsGeolocationVerification } from "@contexts/shipping/domain/services/shipmentAddressVerification";
import { useAlreadyRoutedShipmentIds } from "@contexts/shipping/infrastructure/hooks/routes/useRoutes";
import { ShipmentGeolocationFillerDialog } from "../route/ShipmentGeolocationFillerDialog";

interface Props {
  selectedShipmentIds: string[];
  onChange: (ids: string[]) => void;
  excludedShipmentIds?: Set<string>;
}

export const OrderPicker = ({ selectedShipmentIds, onChange, excludedShipmentIds }: Props) => {
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderListView | null>(null);
  const [fillerOrder, setFillerOrder] = useState<OrderListView | null>(null);

  const alreadyRoutedIds = useAlreadyRoutedShipmentIds();
  const { user } = useAuth();

  // El picker de rutas solo ofrece órdenes de la tienda propia; con
  // CAN_LIST_ALL_ROUTE_ORDERS se ofrecen las de todas las tiendas.
  const storeScopeFilters: Filter[] =
    user && !shippingPolicies.listAllRouteOrders(user)
      ? [{ field: "store.id", filterOperator: "=", value: user.store.id }]
      : [];

  const { orders: fulfilledRaw, isLoading } = useOrders({
    filters: [
      { field: "shipment.status", filterOperator: "=", value: "FULFILLED" },
      ...storeScopeFilters,
    ],
    limit: 100,
    disableStoreScope: true,
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

  // Orders without a routable destination cannot be selected until verified
  const selectable = filtered.filter(
    (o) => !needsGeolocationVerification(o, "DELIVERY"),
  );

  const toggleAll = () => {
    const allIds = selectable.map((o) => o.shipment!.id).filter(Boolean);
    onChange(
      selectedShipmentIds.length === allIds.length ? [] : allIds,
    );
  };

  const allSelected =
    selectable.length > 0 &&
    selectable.every((o) => o.shipment && selectedShipmentIds.includes(o.shipment.id));

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
              const needsGeo = needsGeolocationVerification(order, "DELIVERY");

              return (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 rounded-md border px-3 py-3 transition-colors ${
                    isSelected
                      ? "border-primary/40 bg-primary/5"
                      : needsGeo
                      ? "border-amber-200 bg-amber-50/40"
                      : "hover:bg-muted/40"
                  }`}
                >
                  {/* Checkbox — clicking anywhere on the row toggles */}
                  <div
                    className={`flex items-center ${needsGeo ? "opacity-40" : "cursor-pointer"}`}
                    onClick={() => !needsGeo && toggle(shipmentId)}
                  >
                    <Checkbox checked={isSelected} disabled={needsGeo} />
                  </div>

                  {/* Order info — clicking toggles too */}
                  <div
                    className={`flex-1 min-w-0 ${needsGeo ? "" : "cursor-pointer"}`}
                    onClick={() => !needsGeo && toggle(shipmentId)}
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
                      {needsGeo && (
                        <Badge
                          variant="outline"
                          className="text-[10px] h-4 px-1.5 gap-0.5 border-amber-300 text-amber-700"
                        >
                          <MapPinOff className="size-2.5" />
                          Falta ubicación
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

                  {/* Actions */}
                  {needsGeo && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1.5 text-xs shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50 hover:text-amber-800"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFillerOrder(order);
                      }}
                    >
                      <MapPinOff className="size-3.5" />
                      Ubicar en mapa
                    </Button>
                  )}
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

      {/* Geolocation filler for orders captured without the map picker */}
      <ShipmentGeolocationFillerDialog
        order={fillerOrder}
        open={!!fillerOrder}
        onClose={() => setFillerOrder(null)}
        kind="DELIVERY"
      />
    </>
  );
};
