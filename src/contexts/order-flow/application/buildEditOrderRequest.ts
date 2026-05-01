import { editOrderRequestSchema } from "@contexts/sales/application/order/EditOrderRequest";
import type { HQOrderFormValues } from "../domain/schemas/HQOrderForm";
import type { PartnerOrderFormValues } from "../domain/schemas/PartnerOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

const buildDiscountPayload = (discount: HQOrderFormValues["shippingService"]["discount"]) => {
  const amount = parseFloat(discount.amount);
  if (!amount || amount <= 0) return undefined;
  return {
    amount: { amount, currency: discount.currency },
    concept: discount.concept.trim() || null,
  };
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
    pickupAtAddress: formValues.pickupAtAddress,
    customerSignature: formValues.customerSignature,
    discount: buildDiscountPayload(formValues.shippingService.discount),
  });
};

export const buildPartnerEditOrderRequest = (formValues: PartnerOrderFormValues, storeId?: string) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return editOrderRequestSchema.parse({
    storeId,
    references: {
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    pickupAtAddress: formValues.pickupAtAddress,
    customerSignature: formValues.customerSignature,
  });
};
