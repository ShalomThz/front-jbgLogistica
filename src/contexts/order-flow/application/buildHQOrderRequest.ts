import { createHQOrderSchema } from "@contexts/sales/application/order/CreateHQOrderRequest";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

export const buildHQOrderRequest = (formValues: NewOrderFormValues, storeId: string) => {
  const { save: saveOriginCustomer, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: saveDestinationCustomer, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return createHQOrderSchema.parse({
    storeId,
    references: {
      orderNumber: formValues.orderData.orderNumber || null,
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    package: buildPackagePayload(formValues.package),
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    saveOriginCustomer,
    saveDestinationCustomer,
  });
};
