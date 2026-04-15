import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { CustomerProfilePrimitives } from "@contexts/sales/domain/schemas/value-objects/CustomerProfile";
import type { BaseOrderFormValues } from "../domain/schemas/NewOrderForm";
import type { HQOrderFormValues } from "../domain/schemas/NewOrderForm";
import type { PartnerOrderFormValues } from "../domain/schemas/NewOrderForm";
import { hqOrderDefaultValues } from "../ui/constants/newOrder.constants";

function mapContact(
  profile: CustomerProfilePrimitives,
): BaseOrderFormValues["sender"] {
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

const mapCostBreakdown = (order: OrderListView) => {
  const cb = order.financials.costBreakdown;
  return {
    insurance: cb.insurance?.amount ? String(cb.insurance.amount) : "",
    tools: cb.tools?.amount ? String(cb.tools.amount) : "",
    additionalCost: cb.additionalCost?.amount ? String(cb.additionalCost.amount) : "",
    wrap: cb.wrap?.amount ? String(cb.wrap.amount) : "",
    tape: cb.tape?.amount ? String(cb.tape.amount) : "",
  };
};

const inferCostBreakdownCurrency = (order: OrderListView): string => {
  const cb = order.financials.costBreakdown;
  const fields = [cb.insurance, cb.tools, cb.additionalCost, cb.wrap, cb.tape];
  const firstWithCurrency = fields.find((f) => f?.currency);
  return firstWithCurrency?.currency ?? hqOrderDefaultValues.shippingService.costBreakdownCurrency;
};

const mapBaseFields = (order: OrderListView) => ({
  orderData: {
    orderNumber: order.references.orderNumber ?? "",
    partnerOrderNumber: order.references.partnerOrderNumber ?? "",
  },
  sender: mapContact(order.origin),
  recipient: mapContact(order.destination),
  pickupAtAddress: order.pickupAtAddress,
  customerSignature: order.customerSignature ?? null,
  shippingService: {
    ...hqOrderDefaultValues.shippingService,
    costBreakdownCurrency: inferCostBreakdownCurrency(order),
    costBreakdown: mapCostBreakdown(order),
  },
});

export function mapOrderToHQFormValues(order: OrderListView): HQOrderFormValues {
  return {
    ...mapBaseFields(order),
    orderType: "HQ",
    package: {
      ...hqOrderDefaultValues.package,
      boxId: order.package.boxId,
      ownership: order.package.ownership,
      length: String(order.package.dimensions.length),
      width: String(order.package.dimensions.width),
      height: String(order.package.dimensions.height),
      dimensionUnit: order.package.dimensions.unit,
      weight: String(order.package.weight.value),
    },
  };
}

export function mapOrderToPartnerFormValues(order: OrderListView): PartnerOrderFormValues {
  return {
    ...mapBaseFields(order),
    orderType: "PARTNER",
    package: {
      boxId: order.package.boxId,
      ownership: order.package.ownership,
      packageType: "",
      length: String(order.package.dimensions.length),
      width: String(order.package.dimensions.width),
      height: String(order.package.dimensions.height),
      dimensionUnit: order.package.dimensions.unit,
    },
  };
}
