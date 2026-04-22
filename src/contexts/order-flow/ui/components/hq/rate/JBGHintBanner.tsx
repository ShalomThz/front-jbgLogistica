import jbgLogo from "@/assets/carriers/jbg.png";

export function JBGHintBanner() {
  return (
    <div className="flex items-center gap-3 rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
      <img src={jbgLogo} alt="JBG Logistics" className="size-8 shrink-0 object-contain rounded" />
      <span>Si no seleccionas una opción, esta orden se trabajará con <strong>JBG Logistics</strong>.</span>
    </div>
  );
}
