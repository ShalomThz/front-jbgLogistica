import { AlertTriangle } from "lucide-react";
import { CreateTariffButton } from "@contexts/pricing/ui/components/tariff/CreateTariffButton";

interface TariffErrorBannerProps {
  zoneId: string;
  destinationCountry: string;
  boxId: string;
  onCreated?: () => void;
}

export function TariffErrorBanner({ zoneId, destinationCountry, boxId, onCreated }: TariffErrorBannerProps) {
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
            onCreated={onCreated}
            variant="outline"
          />
        )}
      </div>
    </div>
  );
}
