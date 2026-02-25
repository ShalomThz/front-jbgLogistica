import type { ShippingServiceState } from "../domain/schemas/NewOrderForm";
import type { CarrierType } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const JBG_SERVICE_NAME = "JBG Logistics";

const resolveCarrierType = (serviceName: string): CarrierType =>
  serviceName === JBG_SERVICE_NAME ? "INTERNAL_FLEET" : "THIRD_PARTY";

const parseMoney = (amount: string, currency: string): MoneyPrimitives | null => {
  const parsed = parseFloat(amount);
  return parsed > 0 ? { amount: parsed, currency } : null;
};

export const buildSelectProviderRequest = (shipmentId: string, shippingService: ShippingServiceState) => {
  const rate = shippingService.selectedRate!;
  const cb = shippingService.costBreakdown;
  const isJBG = rate.serviceName === JBG_SERVICE_NAME;
  const currency = isJBG ? shippingService.currency : rate.price.currency;

  return {
    shipmentId,
    provider: { type: resolveCarrierType(rate.serviceName), providerName: rate.serviceName },
    rate,
    finalPrice: { ...rate.price, currency },
    costBreakdown: {
      insurance: parseMoney(cb.insurance, currency),
      tools: parseMoney(cb.tools, currency),
      additionalCost: parseMoney(cb.additionalCost, currency),
      wrap: parseMoney(cb.wrap, currency),
      tape: parseMoney(cb.tape, currency),
    },
  };
};
