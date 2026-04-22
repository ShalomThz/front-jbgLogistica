import type { HQShippingServiceState } from "../domain/schemas/NewOrderForm";
import type { CarrierType } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const JBG_SERVICE_NAME = "JBG Logistics";

const resolveCarrierType = (serviceName: string): CarrierType =>
  serviceName === JBG_SERVICE_NAME ? "INTERNAL_FLEET" : "THIRD_PARTY";

const parseMoney = (amount: string, currency: string): MoneyPrimitives | null => {
  const parsed = parseFloat(amount);
  return parsed > 0 ? { amount: parsed, currency } : null;
};

export const buildSelectProviderRequest = (
  shipmentId: string,
  shippingService: HQShippingServiceState,
  tariff: MoneyPrimitives,
) => {
  const rate = shippingService.selectedRate!;
  const cb = shippingService.costBreakdown;
  const costsCurrency = shippingService.costBreakdownCurrency;

  return {
    shipmentId,
    provider: { type: resolveCarrierType(rate.serviceName), providerName: rate.serviceName },
    rate,
    finalPrice: rate.price,
    tariff,
    costBreakdown: {
      insurance: parseMoney(cb.insurance, costsCurrency),
      tools: parseMoney(cb.tools, costsCurrency),
      additionalCost: parseMoney(cb.additionalCost, costsCurrency),
      wrap: parseMoney(cb.wrap, costsCurrency),
      tape: parseMoney(cb.tape, costsCurrency),
    },
  };
};
