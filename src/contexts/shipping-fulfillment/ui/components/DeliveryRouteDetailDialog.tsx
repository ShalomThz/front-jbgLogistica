import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type RouteStatus = "ACTIVE" | "INACTIVE";
export interface DeliveryRoute { id: string; name: string; zone: string; stops: number; driver: string; status: RouteStatus; updatedAt: Date; }

const STATUS_LABELS: Record<RouteStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<RouteStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { route: DeliveryRoute | null; open: boolean; onClose: () => void; }

export const DeliveryRouteDetailDialog = ({ route, open, onClose }: Props) => {
  if (!route) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{route.name}</span><Badge variant={STATUS_VARIANT[route.status]}>{STATUS_LABELS[route.status]}</Badge></DialogTitle>
          <DialogDescription>Ruta {route.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Ruta</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={route.name} /><DetailRow label="Zona" value={route.zone} /><DetailRow label="Paradas" value={String(route.stops)} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Asignación</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Conductor" value={route.driver} /><DetailRow label="Estado" value={STATUS_LABELS[route.status]} /><DetailRow label="Actualización" value={route.updatedAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
