import { editOrderRequestSchema } from "@contexts/sales/application/order/EditOrderRequest";
import type { HQOrderFormValues } from "../domain/schemas/HQOrderForm";
import type { PartnerOrderFormValues } from "../domain/schemas/PartnerOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

export const buildDiscountPayload = (discount: HQOrderFormValues["shippingService"]["discount"]) => {
  const amount = parseFloat(discount.amount);
  if (!amount || amount <= 0) return undefined;
  return {
    amount: { amount, currency: discount.currency },
    concept: discount.concept.trim() || null,
  };
};

// El anticipo ya no se edita aquí: los abonos de una orden existente se
// gestionan desde el libro de pagos (PaymentLedgerDialog).

export const buildEditOrderRequest = (formValues: HQOrderFormValues, storeId?: string) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return editOrderRequestSchema.parse({
    storeId,
    references: {
      orderNumber: formValues.orderData.orderNumber || null,
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    package: buildPackagePayload(formValues.package),
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    customerSignature: formValues.customerSignature,
    discount: buildDiscountPayload(formValues.shippingService.discount),
  });
};

/** Los extras que el socio le suma a su cliente, en la moneda de la venta.
 * Vacío o cero es `null`: el renglón no existe, no vale cero. */
const buildPartnerSaleCostBreakdown = (formValues: PartnerOrderFormValues) => {
  const { currency, costBreakdown } = formValues.partnerSale;
  const parse = (raw: string) => {
    const amount = parseFloat(raw);
    return Number.isFinite(amount) && amount > 0 ? { amount, currency } : null;
  };

  return {
    insurance: parse(costBreakdown.insurance),
    tools: parse(costBreakdown.tools),
    additionalCost: parse(costBreakdown.additionalCost),
    wrap: parse(costBreakdown.wrap),
    tape: parse(costBreakdown.tape),
  };
};

export const buildPartnerEditOrderRequest = (
  formValues: PartnerOrderFormValues,
  storeId?: string,
) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  // Solo el total: el libro de abonos del socio se mueve por sus propias rutas,
  // y mandarlo acá lo pisaría con lo que tenga el formulario abierto. Vacío o
  // cero borra la venta, que es lo que significa dejar el campo sin nada.
  const partnerSaleAmount = parseFloat(formValues.partnerSale.amount);
  const partnerSaleTotal =
    Number.isFinite(partnerSaleAmount) && partnerSaleAmount > 0
      ? {
          amount: partnerSaleAmount,
          // La suya, no la de visualización del total de JBG: eran dos cosas
          // distintas y usar aquélla acá dejaba el total en una moneda y los
          // abonos en otra, que es lo que trababa el guardado.
          currency: formValues.partnerSale.currency,
        }
      : null;

  return editOrderRequestSchema.parse({
    storeId,
    references: {
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    emptyBoxDelivery: formValues.emptyBoxDelivery,
    homePickup: formValues.homePickup,
    customerSignature: formValues.customerSignature,
    partnerSaleTotal,
    // Se manda solo si la venta sigue viva: con `partnerSaleTotal: null` el
    // dominio la borra entera, y el desglose se va con ella.
    partnerSaleCostBreakdown: partnerSaleTotal
      ? buildPartnerSaleCostBreakdown(formValues)
      : undefined,
    partnerSaleDiscount: partnerSaleTotal
      ? {
          amount: (() => {
            const amount = parseFloat(formValues.partnerSale.discount.amount);
            return Number.isFinite(amount) && amount > 0
              ? { amount, currency: formValues.partnerSale.currency }
              : null;
          })(),
          concept: formValues.partnerSale.discount.concept.trim() || null,
        }
      : undefined,
  });
};
