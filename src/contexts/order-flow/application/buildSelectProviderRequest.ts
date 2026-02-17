import type { ShippingServiceState } from "../domain/schemas/NewOrderForm";
import type { CarrierType } from "@contexts/shipping/domain/schemas/value-objects/Carrier";

const JBG_SERVICE_NAME = "JBG Logistics";

const resolveCarrierType = (serviceName: string): CarrierType =>
  serviceName === JBG_SERVICE_NAME ? "INTERNAL_FLEET" : "THIRD_PARTY";

export const buildSelectProviderRequest = (shipmentId: string, shippingService: ShippingServiceState) => {
  const rate = shippingService.selectedRate!;

  return {
    shipmentId,
    provider: { type: resolveCarrierType(rate.serviceName), providerName: rate.serviceName },
    rate,
    finalPrice: rate.price,
    costBreakdown: {
      insurance: rate.insuranceFee,
      tools: null,
      additionalCost: null,
      wrap: null,
      tape: null,
    },
  };
};
