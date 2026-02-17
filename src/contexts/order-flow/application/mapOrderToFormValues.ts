import type { OrderPrimitives } from "@contexts/sales/domain/schemas/order/Order";
import type { CustomerProfilePrimitives } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";
import { newOrderDefaultValues } from "../ui/constants/newOrder.constants";

function mapContact(
  profile: CustomerProfilePrimitives,
): NewOrderFormValues["sender"] {
  const { geolocation: _, ...addressWithoutGeo } = profile.address as Record<
    string,
    unknown
  >;

  return {
    id: profile.id,
    name: profile.name,
    company: profile.company,
    email: profile.email,
    phone: profile.phone,
    address: {
      address1: (addressWithoutGeo.address1 as string) ?? "",
      address2: (addressWithoutGeo.address2 as string) ?? "",
      city: (addressWithoutGeo.city as string) ?? "",
      province: (addressWithoutGeo.province as string) ?? "",
      zip: (addressWithoutGeo.zip as string) ?? "",
      country: (addressWithoutGeo.country as string) ?? "MX",
      reference: (addressWithoutGeo.reference as string) ?? "",
    },
    save: false,
  };
}

export function mapOrderToFormValues(
  order: OrderPrimitives,
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
