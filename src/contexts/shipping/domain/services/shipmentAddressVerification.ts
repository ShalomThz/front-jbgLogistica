import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { GeolocationPrimitives } from "@contexts/shared/domain/schemas/address/Geolocation";

/** Which routing address of the shipment the geolocation refers to */
export type ShipmentGeolocationKind = "PICKUP" | "DELIVERY";

/**
 * Ungeocoded addresses are stored with latitude/longitude 0 and no placeId
 * (orders created without the map picker). Those cannot be routed.
 */
export const hasUsableGeolocation = (
  geolocation: GeolocationPrimitives | null | undefined,
): boolean => {
  if (!geolocation) return false;
  if (geolocation.placeId) return true;
  return geolocation.latitude !== 0 || geolocation.longitude !== 0;
};

/**
 * The geolocation a route stop would use for this order:
 * the shipment's verified coordinates when present, otherwise the order
 * address (sender for PICKUP, recipient for DELIVERY).
 */
export const routingGeolocation = (
  order: OrderListView,
  kind: ShipmentGeolocationKind,
): GeolocationPrimitives | null => {
  const verified =
    kind === "PICKUP"
      ? order.shipment?.pickupGeolocation
      : order.shipment?.deliveryGeolocation;
  if (verified && hasUsableGeolocation(verified)) return verified;

  const address =
    kind === "PICKUP" ? order.origin.address : order.destination.address;
  return address.geolocation ?? null;
};

/** True when the order needs the geolocation filler before joining a route */
export const needsGeolocationVerification = (
  order: OrderListView,
  kind: ShipmentGeolocationKind,
): boolean => !hasUsableGeolocation(routingGeolocation(order, kind));
