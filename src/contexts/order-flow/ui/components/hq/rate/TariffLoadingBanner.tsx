import { Loader2 } from "lucide-react";

export function TariffLoadingBanner() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
      <Loader2 className="size-5 shrink-0 animate-spin" />
      <span>Buscando tarifa de la zona...</span>
    </div>
  );
}
