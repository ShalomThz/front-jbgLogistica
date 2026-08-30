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

export const buildPartnerEditOrderRequest = (
  formValues: PartnerOrderFormValues,
  storeId?: string,
) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  // Solo el total: el libro de abonos del socio se mueve por sus propias rutas,
  // y mandarlo acá lo pisaría con lo que tenga el formulario abierto. Vacío o
  // cero borra la venta, que es lo que significa dejar el campo sin nada.
  const partnerSaleAmount = parseFloat(formValues.partnerSale);
  const partnerSaleTotal =
    Number.isFinite(partnerSaleAmount) && partnerSaleAmount > 0
      ? {
          amount: partnerSaleAmount,
          currency: formValues.shippingService.currency,
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
  });
};
