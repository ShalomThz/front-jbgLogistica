import { createPartnerOrderSchema } from "@contexts/sales/application/order/CreatePartnerOrderRequest";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

export const buildPartnerOrderRequest = (formValues: NewOrderFormValues, storeId: string) => {
  const { save: saveOriginCustomer, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: saveDestinationCustomer, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return createPartnerOrderSchema.parse({
    storeId,
    partnerOrderNumber: formValues.orderData.partnerOrderNumber,
    package: buildPackagePayload(formValues.package),
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    saveOriginCustomer,
    saveDestinationCustomer,
  });
};
