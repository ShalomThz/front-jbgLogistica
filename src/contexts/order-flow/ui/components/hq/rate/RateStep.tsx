import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import type { HQSkydropxAddressItemResponse } from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import { useFormContext, useWatch } from "react-hook-form";
import { ZoneSelector } from "../../shared/ZoneSelector";
import { JBGFallbackBanner } from "./JBGFallbackBanner";
import { JBGHintBanner } from "./JBGHintBanner";
import { PartnerBreakdownCard } from "./PartnerBreakdownCard";
import { RateTable } from "./RateTable";
import { ShipmentSummaryCard } from "./ShipmentSummaryCard";
import { TariffErrorBanner } from "./TariffErrorBanner";
import { TariffLoadingBanner } from "./TariffLoadingBanner";
import { WarehouseAddressSelector } from "./WarehouseAddressSelector";

const JBG_RATE_ID = "JBG_RATE";

interface RateStepProps {
  rates: RatePrimitives[];
  isLoadingRates: boolean;
  ratesError: string | null;
  onRefetch: () => void;
  onBack: () => void;
  partnerPrice?: MoneyPrimitives | null;
  partnerCostBreakdown?: CostBreakdownPrimitives;
  tariff: MoneyPrimitives | null;
  isLoadingTariff: boolean;
  tariffError: string | null;
  tariffZoneId: string;
  tariffDestinationCountry: string;
  tariffBoxId: string;
  /** Presente solo si el usuario tiene permiso para cambiar la zona. */
  onZoneChange?: (zoneId: string) => void;
  onTariffCreated?: () => void;
  warehouseAddresses: HQSkydropxAddressItemResponse[];
  selectedWarehouseAddress: HQSkydropxAddressItemResponse | null;
  onWarehouseAddressChange: (address: HQSkydropxAddressItemResponse) => void;
  isLoadingAddresses: boolean;
}

export function RateStep({
  rates,
  isLoadingRates,
  ratesError,
  onRefetch,
  onBack,
  partnerPrice,
  partnerCostBreakdown,
  tariff,
  isLoadingTariff,
  tariffError,
  tariffZoneId,
  tariffDestinationCountry,
  tariffBoxId,
  onZoneChange,
  warehouseAddresses,
  selectedWarehouseAddress,
  onWarehouseAddressChange,
  isLoadingAddresses,
}: RateStepProps) {
  const { setValue } = useFormContext<HQOrderFormValues>();
  const selectedRate = useWatch<HQOrderFormValues, "shippingService.selectedRate">({ name: "shippingService.selectedRate" });
  const costsCurrency = useWatch<HQOrderFormValues, "shippingService.costBreakdownCurrency">({ name: "shippingService.costBreakdownCurrency" });

  const handleRateSelection = (rate: RatePrimitives) => {
    setValue("shippingService.selectedRate", rate);
  };

  const hasTariff = !!tariff;
  const skydropxRates = rates.filter((r) => r.id !== JBG_RATE_ID);
  const hasSkydropxRates = skydropxRates.length > 0;
  const showTariffLoading = isLoadingTariff;
  const showTariffError = !isLoadingTariff && (tariffError || !hasTariff);
  const showJBGFallback = !showTariffLoading && !showTariffError && !isLoadingRates && !ratesError && !hasSkydropxRates && rates.length > 0;
  const showRateTable = !showTariffLoading && !showTariffError && (hasSkydropxRates || isLoadingRates || !!ratesError);
  const showJBGHint = showRateTable && hasSkydropxRates;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6 flex-1 min-h-0 overflow-auto p-2">
      <div className="lg:col-span-2 space-y-4">
        <WarehouseAddressSelector
          addresses={warehouseAddresses}
          selectedAddress={selectedWarehouseAddress}
          onSelect={onWarehouseAddressChange}
          isLoading={isLoadingAddresses}
        />
        {onZoneChange && (
          <ZoneSelector zoneId={tariffZoneId || undefined} onZoneChange={onZoneChange} />
        )}
        {showTariffLoading && <TariffLoadingBanner />}
        {showTariffError && (
          <TariffErrorBanner
            zoneId={tariffZoneId}
            destinationCountry={tariffDestinationCountry}
            boxId={tariffBoxId}
            priceCurrency={costsCurrency}
          />
        )}
        {showJBGFallback && <JBGFallbackBanner />}
        {showJBGHint && <JBGHintBanner />}
        {showRateTable && (
          <RateTable
            rates={rates}
            isLoading={isLoadingRates}
            error={ratesError}
            selectedRateId={selectedRate?.id ?? null}
            onSelect={handleRateSelection}
            onRefetch={onRefetch}
            onClearSelection={() => setValue("shippingService.selectedRate", null)}
          />
        )}
      </div>

      <div className="space-y-4 lg:sticky lg:top-0">
        {partnerPrice && (
          <PartnerBreakdownCard
            partnerPrice={partnerPrice}
            costBreakdown={partnerCostBreakdown}
          />
        )}
        <ShipmentSummaryCard onEdit={onBack} />
      </div>
    </div>
  );
}
