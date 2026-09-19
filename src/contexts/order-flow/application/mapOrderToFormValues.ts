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
    customerNumber: profile.customerNumber ?? null,
    photo: null,
    name: profile.name,
    company: profile.company,
    email: profile.email,
    phone: profile.phone,
    // La orden guarda un solo teléfono. Si el contacto es un cliente ya dado de
    // alta, `ContactColumn` trae el extra de su ficha al volver a elegirlo.
    secondaryPhone: "",

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

/** El desglose del socio a su cliente, no el de JBG. Misma forma, otra plata. */
const mapPartnerSaleCostBreakdown = (order: OrderListView) => {
  const cb = order.financials.partnerSale?.costBreakdown;
  return {
    insurance: cb?.insurance?.amount ? String(cb.insurance.amount) : "",
    tools: cb?.tools?.amount ? String(cb.tools.amount) : "",
    additionalCost: cb?.additionalCost?.amount
      ? String(cb.additionalCost.amount)
      : "",
    wrap: cb?.wrap?.amount ? String(cb.wrap.amount) : "",
    tape: cb?.tape?.amount ? String(cb.tape.amount) : "",
  };
};

const inferCostBreakdownCurrency = (order: OrderListView): string => {
  const cb = order.financials.costBreakdown;
  const fields = [cb.insurance, cb.tools, cb.additionalCost, cb.wrap, cb.tape];
  const firstWithCurrency = fields.find((f) => f?.currency);
  return firstWithCurrency?.currency ?? hqOrderDefaultValues.shippingService.costBreakdownCurrency;
};

const mapDiscount = (order: OrderListView) => {
  const d = order.financials.discount;
  return {
    amount: d.amount?.amount ? String(d.amount.amount) : "",
    currency: d.amount?.currency ?? hqOrderDefaultValues.shippingService.discount.currency,
    concept: d.concept ?? "",
  };
};

const mapBaseFields = (order: OrderListView) => ({
  orderData: {
    orderNumber: order.references.orderNumber ?? "",
    partnerOrderNumber: order.references.partnerOrderNumber ?? "",
  },
  sender: mapContact(order.origin),
  recipient: mapContact(order.destination),
  emptyBoxDelivery: order.emptyBoxDelivery,
  homePickup: order.homePickup,
  customerSignature: order.customerSignature ?? null,
  // El formulario trabaja con cadena y la orden guarda `null`. El `??` cubre
  // además las órdenes anteriores al campo, que no traen la clave.
  notes: order.notes ?? "",
  shippingService: {
    ...hqOrderDefaultValues.shippingService,
    costBreakdownCurrency: inferCostBreakdownCurrency(order),
    costBreakdown: mapCostBreakdown(order),
    discount: mapDiscount(order),
  },
});

export function mapOrderToHQFormValues(order: OrderListView): HQOrderFormValues {
  const base = mapBaseFields(order);
  return {
    ...base,
    orderType: "HQ",
    shippingService: {
      ...base.shippingService,
      selectedRate: null,
      tariff: order.financials.tariff,
      shippingMode: order.shipment?.shippingMode ?? "GROUND",
    },
    package: {
      ...hqOrderDefaultValues.package,
      boxId: order.package.boxId,
      ownership: order.package.ownership,
      length: String(order.package.dimensions.length),
      width: String(order.package.dimensions.width),
      height: String(order.package.dimensions.height),
      dimensionUnit: order.package.dimensions.unit,
      weight: String(order.package.weight.value),
      photos: order.package.photos ?? [],
    },
  };
}

export function mapOrderToPartnerFormValues(order: OrderListView): PartnerOrderFormValues {
  return {
    ...mapBaseFields(order),
    orderType: "PARTNER",
    // Vacío cuando la orden no lo tiene: las anteriores al campo y las que se
    // crearon sin cargarlo.
    partnerSale: {
      amount: order.financials.partnerSale
        ? String(order.financials.partnerSale.total.amount)
        : "",
      // La suya si ya la tiene; si no, el default del formulario.
      currency: order.financials.partnerSale?.total.currency ?? "USD",
      // El `?? null` en cadena no sobra: las ventas guardadas antes del desglose
      // no traen la clave, y `OrderListView` se construye sin parsear.
      costBreakdown: mapPartnerSaleCostBreakdown(order),
      discount: {
        amount: order.financials.partnerSale?.discount?.amount?.amount
          ? String(order.financials.partnerSale.discount.amount.amount)
          : "",
        concept: order.financials.partnerSale?.discount?.concept ?? "",
      },
    },
    package: {
      boxId: order.package.boxId,
      ownership: order.package.ownership,
      packageType: "",
      length: String(order.package.dimensions.length),
      width: String(order.package.dimensions.width),
      height: String(order.package.dimensions.height),
      dimensionUnit: order.package.dimensions.unit,
      // Una orden de socio creada sin pesar guarda cero, y acá cero significa
      // "sin pesar": mostrarlo haría creer que la balanza dio cero y dejaría el
      // aéreo cotizando contra un peso que nadie midió.
      weight:
        order.package.weight.value > 0
          ? String(order.package.weight.value)
          : "",
      weightUnit: order.package.weight.unit,
    },
  };
}
