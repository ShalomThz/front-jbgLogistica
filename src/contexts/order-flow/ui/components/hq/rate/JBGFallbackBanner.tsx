import jbgLogo from "@/assets/carriers/jbg.png";

export function JBGFallbackBanner() {
  return (
    <div className="flex items-center gap-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <img src={jbgLogo} alt="JBG Logistics" className="size-12 shrink-0 object-contain rounded" />
      <div className="space-y-1">
        <div className="font-medium">Esta orden la trabajará JBG Logistics</div>
        <div className="text-xs text-amber-800">No hay opciones disponibles de Skydropx para este envío.</div>
      </div>
    </div>
  );
}
