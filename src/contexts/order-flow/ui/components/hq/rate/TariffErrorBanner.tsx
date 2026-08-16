import { AlertTriangle } from "lucide-react";
import { CreateTariffButton } from "@contexts/pricing/ui/components/tariff/CreateTariffButton";
import type { ServiceLevel } from "@contexts/pricing/domain/schemas/tariff/Tariff";

interface TariffErrorBannerProps {
  zoneId: string;
  boxId: string;
  serviceLevel: ServiceLevel | undefined;
}

export function TariffErrorBanner({ zoneId, boxId, serviceLevel }: TariffErrorBannerProps) {
  const canCreate = !!zoneId && !!boxId && !!serviceLevel;

  return (
    <div className="flex items-start gap-3 rounded-md border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
      <AlertTriangle className="size-5 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-3">
        <div className="space-y-1">
          <div className="font-medium">No se encontr\u00f3 tarifa para esta zona</div>
          <div className="text-xs">
            Revisa la configuraci\u00f3n de tarifas, o escribe el precio a mano.
          </div>
        </div>
        {canCreate && (
          <CreateTariffButton
            zoneId={zoneId}
            boxId={boxId}
            serviceLevel={serviceLevel}
            variant="outline"
          />
        )}
      </div>
    </div>
  );
}
