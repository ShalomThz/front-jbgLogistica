import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { CustomerProfilePrimitives } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";
import { newOrderDefaultValues } from "../ui/constants/newOrder.constants";

function mapContact(
  profile: CustomerProfilePrimitives,
): NewOrderFormValues["sender"] {
  const addr = profile.address;

  return {
    id: profile.id,
    name: profile.name,
    company: profile.company,
    email: profile.email,
    phone: profile.phone,
    address: {
      address1: addr.address1 ?? "",
      address2: addr.address2 ?? "",
      city: addr.city ?? "",
      province: addr.province ?? "",
      zip: addr.zip ?? "",
      country: addr.country ?? "MX",
      reference: addr.reference ?? "",
      geolocation: addr.geolocation ?? { latitude: 0, longitude: 0, placeId: null },
    },
    save: false,
  };
}

export function mapOrderToFormValues(
  order: OrderListView,
): NewOrderFormValues {
  return {
    orderType: order.type,
    orderData: {
      orderNumber: order.references.orderNumber ?? "",
      partnerOrderNumber: order.references.partnerOrderNumber ?? "",
    },
    sender: mapContact(order.origin),
    recipient: mapContact(order.destination),
    package: {
      ...newOrderDefaultValues.package,
      boxId: order.package.boxId,
      ownership: order.package.ownership,
      length: String(order.package.dimensions.length),
      width: String(order.package.dimensions.width),
      height: String(order.package.dimensions.height),
      dimensionUnit: order.package.dimensions.unit,
      weight: String(order.package.weight.value),
    },
    shippingService: { ...newOrderDefaultValues.shippingService },
  };
}
