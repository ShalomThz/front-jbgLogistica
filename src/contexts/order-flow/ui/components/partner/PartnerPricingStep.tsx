import {
  Card,
  CardContent,
} from "@contexts/shared/shadcn";
import { AlertTriangle } from "lucide-react";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { PartnerAdditionalCostsCard } from "./PartnerAdditionalCostsCard";
import { PartnerTariffCard } from "./PartnerTariffCard";
import { PartnerOrderSummaryCard } from "./PartnerOrderSummaryCard";
import { PartnerTotalCard } from "./PartnerTotalCard";
import { SignatureCard } from "../rate/SignatureCard";

interface PartnerPricingStepProps {
  tariffPrice: MoneyPrimitives | null;
  isLoadingPrice: boolean;
  tariffError: string | null;
  refetchPrice: () => void;
}

export function PartnerPricingStep({ tariffPrice, isLoadingPrice, tariffError, refetchPrice }: PartnerPricingStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {tariffError && (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="flex items-start gap-3 pt-6">
              <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  No se encontró tarifa para esta orden
                </p>
                <p className="text-sm text-muted-foreground">
                  Comunícate con JBG para que se asigne una tarifa a esta zona y destino antes de continuar.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <PartnerAdditionalCostsCard />
        <SignatureCard collapsible={false} />
      </div>

      <div className="space-y-4">
        <PartnerTariffCard
          tariffPrice={tariffPrice}
          isLoading={isLoadingPrice}
          error={tariffError}
          onRefetch={refetchPrice}
        />
        <PartnerOrderSummaryCard />
        <PartnerTotalCard tariffPrice={tariffPrice} />
      </div>
    </div>
  );
}
