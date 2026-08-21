import type { HQShippingServiceState } from "../domain/schemas/NewOrderForm";
import { buildDiscountPayload } from "./buildEditOrderRequest";
import type { CarrierType } from "@contexts/shipping/domain/schemas/value-objects/Carrier";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { PickupPoint } from "@contexts/pricing/application/QuotePrice";
import type {
  PriceType,
  ServiceLevel,
} from "@contexts/pricing/domain/schemas/tariff/Tariff";

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
  /** Insumos con los que el servidor recalcula la sugerencia y la contrasta
   * contra el tarifa que se cobra. */
  pricing?: {
    pickup: PickupPoint;
    destinationCountry: string;
    serviceLevel: ServiceLevel;
    priceType: PriceType;
  },
) => {
  const rate = shippingService.selectedRate!;
  const tariff = shippingService.tariff!;
  const cb = shippingService.costBreakdown;
  const costsCurrency = shippingService.costBreakdownCurrency;

  return {
    shipmentId,
    provider: { type: resolveCarrierType(rate.serviceName), providerName: rate.serviceName },
    rate,
    shippingMode: shippingService.shippingMode,
    finalPrice: rate.price,
    tariff,
    ...(pricing && { pricing }),
    costBreakdown: {
      insurance: parseMoney(cb.insurance, costsCurrency),
      tools: parseMoney(cb.tools, costsCurrency),
      additionalCost: parseMoney(cb.additionalCost, costsCurrency),
      wrap: parseMoney(cb.wrap, costsCurrency),
      tape: parseMoney(cb.tape, costsCurrency),
    },
    discount: buildDiscountPayload(shippingService.discount),
  };
};
