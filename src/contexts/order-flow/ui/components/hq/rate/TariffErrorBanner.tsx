import { AlertTriangle } from "lucide-react";
import { CreateTariffButton } from "@contexts/pricing/ui/components/tariff/CreateTariffButton";

interface TariffErrorBannerProps {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
  /** Default currency for the inline-created tariff (the order's costs
   * currency), so the tariff doesn't require an FX conversion. */
  priceCurrency?: string;
}

export function TariffErrorBanner({ zoneId, destinationCountry, boxId, priceCurrency }: TariffErrorBannerProps) {
  const canCreate = !!zoneId && !!destinationCountry && !!boxId;

  return (
    <div className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="size-5 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <div className="font-medium">No se encontró tarifa para esta zona</div>
          <div className="text-xs">Revisa la configuración de tarifas antes de continuar.</div>
        </div>
        {canCreate && (
          <CreateTariffButton
            zoneId={zoneId}
            destinationCountry={destinationCountry}
            boxId={boxId}
            priceCurrency={priceCurrency}
            variant="outline"
          />
        )}
      </div>
    </div>
  );
}
