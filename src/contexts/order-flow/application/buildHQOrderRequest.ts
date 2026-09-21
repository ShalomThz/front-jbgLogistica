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
    customerSignature: formValues.customerSignature ?? null,
    // Vacío es "sin nota", no una nota en blanco: así la factura no imprime un
    // encabezado de comentarios con nada debajo.
    notes: formValues.notes.trim() || null,
  });
};
