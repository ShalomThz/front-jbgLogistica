import { editOrderRequestSchema } from "@contexts/sales/application/order/EditOrderRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
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

// El anticipo viaja en la moneda de la tarifa, igual que en la creación.
// Monto vacío/0 → null (limpiar); sin tarifa disponible → undefined (sin cambio).
export const buildAdvancePayload = (
  advanceAmount: string,
  tariff?: MoneyPrimitives | null,
): MoneyPrimitives | null | undefined => {
  const amount = parseFloat(advanceAmount);
  if (!(amount > 0)) return null;
  return tariff ? { amount, currency: tariff.currency } : undefined;
};

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
    advance: buildAdvancePayload(formValues.advanceAmount, formValues.shippingService.tariff),
    discount: buildDiscountPayload(formValues.shippingService.discount),
  });
};

export const buildPartnerEditOrderRequest = (
  formValues: PartnerOrderFormValues,
  storeId?: string,
  tariff?: MoneyPrimitives | null,
) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return editOrderRequestSchema.parse({
    storeId,
    references: {
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    emptyBoxDelivery: formValues.emptyBoxDelivery,
    homePickup: formValues.homePickup,
    advance: buildAdvancePayload(formValues.advanceAmount, tariff),
    customerSignature: formValues.customerSignature,
  });
};
