import { createPartnerOrderSchema } from "@contexts/sales/application/order/CreatePartnerOrderRequest";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type {
  ServiceLevel,
  ShippingMode,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";
import type { PartnerOrderFormValues } from "../domain/schemas/NewOrderForm";

const parseMoney = (amount: string, currency: string): MoneyPrimitives | null => {
  const parsed = parseFloat(amount);
  return parsed > 0 ? { amount: parsed, currency } : null;
};

export const buildPartnerOrderRequest = (
  formValues: PartnerOrderFormValues,
  storeId: string,
  tariff: MoneyPrimitives,
  /** Abonos cobrados al crear → se siembran en el libro de la orden. */
  payments: AddPaymentRequest[] = [],
  /** Insumos de la sugerencia: el servidor cotiza con esto para poder medir el
   * desvío contra el precio que finalmente se cobra. El renglón de la tarifa es
   * (zona, país destino, caja, servicio, modo, tipo). */
  serviceLevel?: ServiceLevel,
  shippingMode?: ShippingMode,
  destinationCountry?: string,
  /** Lo que el cliente del socio ya le pagó a él. Va dentro de `partnerSale`
   * porque cuelga de ese monto, no de la orden. */
  partnerSalePayments: AddPaymentRequest[] = [],
) => {
  const { save: _, address: senderAddress, ...senderContact } = formValues.sender;
  const { save: __, address: recipientAddress, ...recipientContact } = formValues.recipient;

  const pkg = formValues.package;
  const cb = formValues.shippingService.costBreakdown;
  const currency = formValues.shippingService.costBreakdownCurrency;

  const costBreakdown = {
    insurance: parseMoney(cb.insurance, currency),
    tools: parseMoney(cb.tools, currency),
    additionalCost: parseMoney(cb.additionalCost, currency),
    wrap: parseMoney(cb.wrap, currency),
    tape: parseMoney(cb.tape, currency),
  };

  const hasCosts = Object.values(costBreakdown).some((v) => v !== null);

  const partnerSaleTotal = parseMoney(formValues.partnerSale, tariff.currency);

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
    tariff,
    // En la moneda de la tarifa, que es la que muestra el campo. `parseMoney`
    // devuelve null si está vacío o en cero: ahí la orden queda sin factura de
    // socio, que es distinto de tener una en cero.
    partnerSale: partnerSaleTotal
      ? {
          total: partnerSaleTotal,
          payments: partnerSalePayments.map((payment) => ({
            amount: payment.amount,
            method: payment.method,
            concept: payment.concept ?? null,
          })),
        }
      : null,
    ...(serviceLevel && { serviceLevel }),
    ...(shippingMode && { shippingMode }),
    ...(destinationCountry && { destinationCountry }),
    ...(hasCosts && { costBreakdown }),
    emptyBoxDelivery: formValues.emptyBoxDelivery,
    homePickup: formValues.homePickup,
    payments,
    customerSignature: formValues.customerSignature ?? null,
  });
};
