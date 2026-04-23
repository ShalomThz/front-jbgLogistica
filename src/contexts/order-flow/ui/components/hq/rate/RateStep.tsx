import { useFormContext, useWatch } from "react-hook-form";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import type { ShipmentPrimitives } from "@contexts/shipping/domain/schemas/shipment/Shipment";
import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import { RateTable } from "./RateTable";
import { AdditionalCostsCard } from "./AdditionalCostsCard";
import { SignatureCard } from "../../shared/SignatureCard";
import { PartnerBreakdownCard } from "./PartnerBreakdownCard";
import { ShipmentSummaryCard } from "./ShipmentSummaryCard";
import { OrderTotalCard } from "./OrderTotalCard";
import { TariffLoadingBanner } from "./TariffLoadingBanner";
import { TariffErrorBanner } from "./TariffErrorBanner";
import { JBGFallbackBanner } from "./JBGFallbackBanner";
import { JBGHintBanner } from "./JBGHintBanner";
import { OrderSuccessView } from "../../order/OrderSuccessView";

const JBG_RATE_ID = "JBG_RATE";

interface RateStepProps {
  rates: RatePrimitives[];
  isLoadingRates: boolean;
  ratesError: string | null;
  onRefetch: () => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  fulfilledShipment: ShipmentPrimitives | null;
  onFinish: () => void;
  onCreateBlank?: () => void;
  onCreateSameClient?: () => void;
  partnerPrice?: MoneyPrimitives | null;
  partnerCostBreakdown?: CostBreakdownPrimitives;
  markAsPaid: boolean;
  onMarkAsPaidChange: (value: boolean) => void;
  tariff: MoneyPrimitives | null;
  isLoadingTariff: boolean;
  tariffError: string | null;
  tariffZoneId: string;
  tariffDestinationCountry: string;
  tariffBoxId: string;
  onTariffCreated?: () => void;
}

export function RateStep({
  rates,
  isLoadingRates,
  ratesError,
  onRefetch,
  onSubmit,
  onBack,
  isSubmitting,
  fulfilledShipment,
  onFinish,
  onCreateBlank,
  onCreateSameClient,
  partnerPrice,
  partnerCostBreakdown,
  markAsPaid,
  onMarkAsPaidChange,
  tariff,
  isLoadingTariff,
  tariffError,
  tariffZoneId,
  tariffDestinationCountry,
  tariffBoxId,
  onTariffCreated,
}: RateStepProps) {
  const { setValue } = useFormContext<HQOrderFormValues>();
  const selectedRate = useWatch<HQOrderFormValues, "shippingService.selectedRate">({ name: "shippingService.selectedRate" });

  const handleRateSelection = (rate: RatePrimitives) => {
    setValue("shippingService.selectedRate", rate);
  };

  if (fulfilledShipment) {
    return (
      <OrderSuccessView
        shipment={fulfilledShipment}
        onFinish={onFinish}
        onCreateBlank={onCreateBlank}
        onCreateSameClient={onCreateSameClient}
      />
    );
  }

  const hasTariff = !!tariff;
  const skydropxRates = rates.filter((r) => r.id !== JBG_RATE_ID);
  const hasSkydropxRates = skydropxRates.length > 0;
  const showTariffLoading = isLoadingTariff;
  const showTariffError = !isLoadingTariff && (tariffError || !hasTariff);
  const showJBGFallback = !showTariffLoading && !showTariffError && !isLoadingRates && !ratesError && !hasSkydropxRates && rates.length > 0;
  const showRateTable = !showTariffLoading && !showTariffError && (hasSkydropxRates || isLoadingRates || !!ratesError);
  const showJBGHint = showRateTable && hasSkydropxRates;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {showTariffLoading && <TariffLoadingBanner />}
        {showTariffError && (
          <TariffErrorBanner
            zoneId={tariffZoneId}
            destinationCountry={tariffDestinationCountry}
            boxId={tariffBoxId}
            onCreated={onTariffCreated}
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

        <AdditionalCostsCard />
        {selectedRate && <SignatureCard />}
      </div>

      <div className="space-y-4">
        {partnerPrice && (
          <PartnerBreakdownCard
            partnerPrice={partnerPrice}
            costBreakdown={partnerCostBreakdown}
          />
        )}
        <ShipmentSummaryCard onEdit={onBack} />
        <OrderTotalCard
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          markAsPaid={markAsPaid}
          onMarkAsPaidChange={onMarkAsPaidChange}
          disabled={!hasTariff}
        />
      </div>
    </div>
  );
}
