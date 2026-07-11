import { useState } from "react";
import { Badge, Button, Checkbox, Input } from "@contexts/shared/shadcn";
import { Eye, MapPinOff, PackageOpen, Search } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { OrderDetailDialog } from "@contexts/order-flow/ui/components/order/detail/OrderDetailDialog";
import { needsGeolocationVerification } from "@contexts/shipping/domain/services/shipmentAddressVerification";
import { useHomePickupOrders } from "@contexts/shipping/infrastructure/hooks/routes/useHomePickupOrders";
import { useAlreadyRoutedShipmentIds } from "@contexts/shipping/infrastructure/hooks/routes/useRoutes";
import { ShipmentGeolocationFillerDialog } from "../route/ShipmentGeolocationFillerDialog";

interface Props {
  selectedShipmentIds: string[];
  onChange: (ids: string[]) => void;
  excludedShipmentIds?: Set<string>;
  /** PICKING (recolectar paquete) o BOX_DROP (dejar caja vacía) */
  routeType?: "PICKING" | "BOX_DROP";
}

/**
 * Lista las órdenes con visita pendiente al remitente (recolectar la caja
 * dejada o entregar la caja vacía), sin ruta activa. Muestra la dirección
 * del remitente: ahí ocurre la visita.
 */
export const HomePickupOrderPicker = ({
  selectedShipmentIds,
  onChange,
  excludedShipmentIds,
  routeType = "PICKING",
}: Props) => {
  const [search, setSearch] = useState("");
  const [detailOrder, setDetailOrder] = useState<OrderListView | null>(null);
  const [fillerOrder, setFillerOrder] = useState<OrderListView | null>(null);
  const isBoxDrop = routeType === "BOX_DROP";

  const alreadyRoutedIds = useAlreadyRoutedShipmentIds();
  const { orders: pickupOrdersRaw, isLoading } = useHomePickupOrders(true, routeType);

  const pickupOrders = pickupOrdersRaw.filter((o) => {
    if (!o.shipment) return false;
    if (alreadyRoutedIds.has(o.shipment.id)) return false;
    if (excludedShipmentIds?.has(o.shipment.id)) return false;
    return true;
  });

  const filtered = search.trim()
    ? pickupOrders.filter((o) => {
        const q = search.toLowerCase();
        const tracking = o.shipment?.label?.trackingNumber?.toLowerCase() ?? "";
        const orderNum = (o.references.orderNumber ?? "").toLowerCase();
        const partner = (o.references.partnerOrderNumber ?? "").toLowerCase();
        const sender = o.origin.name.toLowerCase();
        const city = o.origin.address.city.toLowerCase();
        return (
          tracking.includes(q) ||
          orderNum.includes(q) ||
          partner.includes(q) ||
          sender.includes(q) ||
          city.includes(q)
        );
      })
    : pickupOrders;

  const toggle = (shipmentId: string) => {
    onChange(
      selectedShipmentIds.includes(shipmentId)
        ? selectedShipmentIds.filter((id) => id !== shipmentId)
        : [...selectedShipmentIds, shipmentId],
    );
  };

  // Orders whose sender address has no coordinates must be verified first
  const selectable = filtered.filter(
    (o) => !needsGeolocationVerification(o, "PICKUP"),
  );

  const toggleAll = () => {
    const allIds = selectable.map((o) => o.shipment!.id).filter(Boolean);
    onChange(selectedShipmentIds.length === allIds.length ? [] : allIds);
  };

  const allSelected =
    selectable.length > 0 &&
    selectable.every(
      (o) => o.shipment && selectedShipmentIds.includes(o.shipment.id),
    );

  return (
    <>
      <div className="flex flex-col gap-3 h-full">
        {/* Search */}
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar por remitente, ciudad, n° factura o guía…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center py-12 text-sm text-muted-foreground">
            {isBoxDrop
              ? "Cargando órdenes con caja vacía por entregar…"
              : "Cargando órdenes con recolección a domicilio…"}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
            <PackageOpen className="size-9 opacity-25" />
            <p className="text-sm font-medium">
              {pickupOrdersRaw.length === 0
                ? isBoxDrop
                  ? "No hay cajas vacías pendientes de entregar"
                  : "No hay órdenes con recolección a domicilio pendientes"
                : pickupOrders.length === 0
                ? "Todas las órdenes pendientes ya están en otra ruta"
                : "Sin resultados para esa búsqueda"}
            </p>
            {pickupOrdersRaw.length === 0 && (
              <p className="text-xs text-center max-w-xs">
                {isBoxDrop
                  ? 'Solo aplican órdenes que pidieron "dejar caja vacía a domicilio" y aún no la reciben.'
                  : "Solo aplican órdenes pendientes de recolectar: con caja vacía ya entregada o con recolección a domicilio directa."}
              </p>
            )}
          </div>
        ) : (
          <div
            className="flex flex-col gap-2 overflow-y-auto min-h-0"
            style={{ maxHeight: "380px" }}
          >
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
                  {selectedShipmentIds.length} seleccionado
                  {selectedShipmentIds.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Order rows — the pickup point is the sender's address */}
            {filtered.map((order) => {
              const shipmentId = order.shipment!.id;
              const isSelected = selectedShipmentIds.includes(shipmentId);
              const tracking = order.shipment?.label?.trackingNumber;
              const orderRef =
                order.references.orderNumber ??
                order.references.partnerOrderNumber ??
                order.id.slice(0, 10).toUpperCase();
              const needsGeo = needsGeolocationVerification(order, "PICKUP");

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
                  <div
                    className={`flex items-center ${needsGeo ? "opacity-40" : "cursor-pointer"}`}
                    onClick={() => !needsGeo && toggle(shipmentId)}
                  >
                    <Checkbox checked={isSelected} disabled={needsGeo} />
                  </div>

                  <div
                    className={`flex-1 min-w-0 ${needsGeo ? "" : "cursor-pointer"}`}
                    onClick={() => !needsGeo && toggle(shipmentId)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold">
                        {order.origin.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-700"
                      >
                        {isBoxDrop ? "Caja vacía" : "Recolección"}
                      </Badge>
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
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {isBoxDrop ? "Dejar caja en" : "Recoger en"}: {order.origin.address.address1},{" "}
                      {order.origin.address.city},{" "}
                      {order.origin.address.province}
                    </p>
                  </div>

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

      {/* Geolocation filler for senders captured without the map picker */}
      <ShipmentGeolocationFillerDialog
        order={fillerOrder}
        open={!!fillerOrder}
        onClose={() => setFillerOrder(null)}
        kind="PICKUP"
      />
    </>
  );
};
