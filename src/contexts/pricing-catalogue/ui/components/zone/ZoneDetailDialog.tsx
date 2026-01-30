import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type ZoneStatus = "ACTIVE" | "INACTIVE";
export interface Zone { id: string; name: string; code: string; states: string; municipalities: number; status: ZoneStatus; updatedAt: Date; }

const STATUS_LABELS: Record<ZoneStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<ZoneStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { zone: Zone | null; open: boolean; onClose: () => void; }

export const ZoneDetailDialog = ({ zone, open, onClose }: Props) => {
  if (!zone) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{zone.name}</span><Badge variant={STATUS_VARIANT[zone.status]}>{STATUS_LABELS[zone.status]}</Badge></DialogTitle>
          <DialogDescription>Código: {zone.code}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Zona</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={zone.name} /><DetailRow label="Código" value={zone.code} /><DetailRow label="Estado" value={STATUS_LABELS[zone.status]} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Cobertura</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Estados" value={zone.states} /><DetailRow label="Municipios" value={String(zone.municipalities)} /><DetailRow label="Actualización" value={zone.updatedAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
