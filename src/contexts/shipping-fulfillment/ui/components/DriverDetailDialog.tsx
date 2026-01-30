import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type DriverStatus = "AVAILABLE" | "ON_ROUTE" | "OFF_DUTY";
export interface Driver { id: string; name: string; phone: string; vehicle: string; license: string; status: DriverStatus; hiredAt: Date; }

const STATUS_LABELS: Record<DriverStatus, string> = { AVAILABLE: "Disponible", ON_ROUTE: "En ruta", OFF_DUTY: "Fuera de servicio" };
const STATUS_VARIANT: Record<DriverStatus, "default" | "secondary" | "outline"> = { AVAILABLE: "default", ON_ROUTE: "secondary", OFF_DUTY: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { driver: Driver | null; open: boolean; onClose: () => void; }

export const DriverDetailDialog = ({ driver, open, onClose }: Props) => {
  if (!driver) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{driver.name}</span><Badge variant={STATUS_VARIANT[driver.status]}>{STATUS_LABELS[driver.status]}</Badge></DialogTitle>
          <DialogDescription>Conductor desde {driver.hiredAt.toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Datos personales</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={driver.name} /><DetailRow label="Teléfono" value={driver.phone} /><DetailRow label="Licencia" value={driver.license} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Vehículo</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Vehículo" value={driver.vehicle} /><DetailRow label="Estado" value={STATUS_LABELS[driver.status]} /><DetailRow label="Fecha ingreso" value={driver.hiredAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
