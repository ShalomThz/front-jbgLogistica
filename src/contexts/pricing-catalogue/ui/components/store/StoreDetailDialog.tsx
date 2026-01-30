import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type StoreStatus = "OPEN" | "CLOSED" | "MAINTENANCE";
export interface Store { id: string; name: string; address: string; phone: string; manager: string; status: StoreStatus; createdAt: Date; }

const STATUS_LABELS: Record<StoreStatus, string> = { OPEN: "Abierta", CLOSED: "Cerrada", MAINTENANCE: "Mantenimiento" };
const STATUS_VARIANT: Record<StoreStatus, "default" | "outline" | "secondary"> = { OPEN: "default", CLOSED: "outline", MAINTENANCE: "secondary" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { store: Store | null; open: boolean; onClose: () => void; }

export const StoreDetailDialog = ({ store, open, onClose }: Props) => {
  if (!store) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{store.name}</span><Badge variant={STATUS_VARIANT[store.status]}>{STATUS_LABELS[store.status]}</Badge></DialogTitle>
          <DialogDescription>Tienda {store.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Tienda</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={store.name} /><DetailRow label="Dirección" value={store.address} /><DetailRow label="Teléfono" value={store.phone} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Administración</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Encargado" value={store.manager} /><DetailRow label="Estado" value={STATUS_LABELS[store.status]} /><DetailRow label="Fecha apertura" value={store.createdAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
