import { createPartnerOrderSchema } from "@contexts/sales/application/order/CreatePartnerOrderRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { NewOrderFormValues } from "../domain/schemas/NewOrderForm";

const parseMoney = (amount: string, currency: string): MoneyPrimitives | null => {
  const parsed = parseFloat(amount);
  return parsed > 0 ? { amount: parsed, currency } : null;
};

export const buildPartnerOrderRequest = (formValues: NewOrderFormValues, storeId: string) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  const pkg = formValues.package;
  const cb = formValues.shippingService.costBreakdown;
  const currency = formValues.shippingService.currency;

  const costBreakdown = {
    insurance: parseMoney(cb.insurance, currency),
    tools: parseMoney(cb.tools, currency),
    additionalCost: parseMoney(cb.additionalCost, currency),
    wrap: parseMoney(cb.wrap, currency),
    tape: parseMoney(cb.tape, currency),
  };

  const hasCosts = Object.values(costBreakdown).some((v) => v !== null);

  return createPartnerOrderSchema.parse({
    storeId,
    partnerOrderNumber: formValues.orderData.partnerOrderNumber,
    package: {
      boxId: pkg.boxId,
      ownership: pkg.ownership,
      dimensions: {
        length: parseFloat(pkg.length) || 0,
        width: parseFloat(pkg.width) || 0,
        height: parseFloat(pkg.height) || 0,
        unit: pkg.dimensionUnit,
      },
    },
    origin: { ...senderContact, address: senderAddress },
    destination: { ...recipientContact, address: recipientAddress },
    ...(hasCosts && { costBreakdown }),
  });
};
