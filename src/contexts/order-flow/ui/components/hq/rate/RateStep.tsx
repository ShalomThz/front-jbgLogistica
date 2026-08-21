import type { HQOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { CostBreakdownPrimitives } from "@contexts/sales/domain/schemas/value-objects/CostBreakdown";
import type { HQSkydropxAddressItemResponse } from "@contexts/settings/domain/schemas/HQSkydropxAddressResponse";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { RatePrimitives } from "@contexts/shipping/domain/schemas/value-objects/Rate";
import { Card, CardContent, CardHeader, CardTitle } from "@contexts/shared/shadcn";
import { useFormContext, useWatch } from "react-hook-form";
import { JBGFallbackBanner } from "./JBGFallbackBanner";
import { JBGHintBanner } from "./JBGHintBanner";
import { PartnerBreakdownCard } from "./PartnerBreakdownCard";
import { RateTable } from "./RateTable";
import { ShipmentSummaryCard } from "./ShipmentSummaryCard";
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
  warehouseAddresses,
  selectedWarehouseAddress,
  onWarehouseAddressChange,
  isLoadingAddresses,
}: RateStepProps) {
  const { setValue } = useFormContext<HQOrderFormValues>();
  const selectedRate = useWatch<HQOrderFormValues, "shippingService.selectedRate">({ name: "shippingService.selectedRate" });

  const handleRateSelection = (rate: RatePrimitives) => {
    setValue("shippingService.selectedRate", rate);
  };

  const skydropxRates = rates.filter((r) => r.id !== JBG_RATE_ID);
  const hasSkydropxRates = skydropxRates.length > 0;
  const showJBGFallback =
    !isLoadingRates && !ratesError && !hasSkydropxRates && rates.length > 0;
  const showRateTable = hasSkydropxRates || isLoadingRates || !!ratesError;
  const showJBGHint = showRateTable && hasSkydropxRates;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 lg:items-start gap-6 flex-1 min-h-0 overflow-auto p-2">
      <div className="lg:col-span-2 space-y-4">
        <Card className="shadow-none transition-shadow focus-within:shadow-lg focus-within:shadow-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Datos de cotización</CardTitle>
            <p className="text-sm text-muted-foreground">
              Origen del envío y modo de transporte
            </p>
          </CardHeader>
          <CardContent>
            <WarehouseAddressSelector
              addresses={warehouseAddresses}
              selectedAddress={selectedWarehouseAddress}
              onSelect={onWarehouseAddressChange}
              isLoading={isLoadingAddresses}
            />
          </CardContent>
        </Card>
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
