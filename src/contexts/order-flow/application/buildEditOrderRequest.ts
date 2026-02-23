import { editOrderRequestSchema } from "@contexts/sales/application/order/EditOrderRequest";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";
import { buildPackagePayload } from "./buildPackagePayload";

export const buildEditOrderRequest = (formValues: NewOrderFormValues) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  return editOrderRequestSchema.parse({
    references: {
      orderNumber: formValues.orderData.orderNumber || null,
      partnerOrderNumber: formValues.orderData.partnerOrderNumber || null,
    },
    package: buildPackagePayload(formValues.package),
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
  });
};
