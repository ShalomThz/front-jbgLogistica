import {
  Card,
  CardContent,
} from "@contexts/shared/shadcn";
import { AlertTriangle } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { useZones } from "@contexts/pricing/infrastructure/hooks/zones/useZones";
import { PartnerAdditionalCostsCard } from "./PartnerAdditionalCostsCard";
import { PartnerTariffCard } from "./PartnerTariffCard";
import { PartnerOrderSummaryCard } from "./PartnerOrderSummaryCard";
import { PartnerTotalCard } from "./PartnerTotalCard";
import { SignatureCard } from "../../shared/SignatureCard";

interface PartnerPricingStepProps {
  tariffPrice: MoneyPrimitives | null;
  isLoadingPrice: boolean;
  tariffError: string | null;
  refetchPrice: () => void;
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
  /** Orden ya existente (edición): muestra sus abonos ya registrados. */
  orderId?: string;
  /** Zona efectiva usada en la búsqueda de tarifa (override o la de la tienda). */
  zoneId?: string;
}

/** Muestra la combinación exacta sin tarifa para que el vendedor pueda
 * reportarla a JBG sin adivinar (zona + caja + país destino). */
function TariffNotFoundCard({ zoneId }: { zoneId?: string }) {
  const { control } = useFormContext<PartnerOrderFormValues>();
  const packageType = useWatch<PartnerOrderFormValues, "package.packageType">({ control, name: "package.packageType" });
  const destinationCountry = useWatch<PartnerOrderFormValues, "recipient.address.country">({ control, name: "recipient.address.country" });
  const { zones } = useZones();
  const zoneName = zones.find((z) => z.id === zoneId)?.name;

  return (
    <Card className="border-destructive bg-destructive/5">
      <CardContent className="flex items-start gap-3 pt-6">
        <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">
            No se encontró tarifa para esta orden
          </p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span>
              <span className="text-muted-foreground">Zona:</span>{" "}
              <span className="font-medium">{zoneName ?? "—"}</span>
            </span>
            <span>
              <span className="text-muted-foreground">Caja:</span>{" "}
              <span className="font-medium">{packageType || "—"}</span>
            </span>
            <span>
              <span className="text-muted-foreground">País destino:</span>{" "}
              <span className="font-medium">{destinationCountry || "—"}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Comunícate con JBG para que se asigne una tarifa a esta combinación antes de continuar.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function PartnerPricingStep({ tariffPrice, isLoadingPrice, tariffError, refetchPrice, pendingPayments, onAddPayment, onRemovePayment, onClearPayments, orderId, zoneId }: PartnerPricingStepProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        {tariffError && <TariffNotFoundCard zoneId={zoneId} />}

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
        <PartnerTotalCard
          tariffPrice={tariffPrice}
          orderId={orderId}
          pendingPayments={pendingPayments}
          onAddPayment={onAddPayment}
          onRemovePayment={onRemovePayment}
          onClearPayments={onClearPayments}
        />
      </div>
    </div>
  );
}
