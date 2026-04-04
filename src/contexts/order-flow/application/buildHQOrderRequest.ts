import { createHQOrderSchema } from "@contexts/sales/application/order/CreateHQOrderRequest";
import type { HQOrderFormValues } from "../domain/schemas/NewOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

export const buildHQOrderRequest = (formValues: HQOrderFormValues, storeId: string) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return createHQOrderSchema.parse({
    storeId,
    references: {
      orderNumber: formValues.orderData.orderNumber || null,
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    package: buildPackagePayload(formValues.package),
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    pickupAtAddress: formValues.pickupAtAddress,
    customerSignature: formValues.customerSignature ?? null,
  });
};
