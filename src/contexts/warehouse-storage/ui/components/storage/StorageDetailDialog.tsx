import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type StorageStatus = "AVAILABLE" | "RESERVED" | "DISPATCHED";
export interface StorageItem { id: string; code: string; product: string; quantity: number; location: string; status: StorageStatus; updatedAt: Date; }

const STATUS_LABELS: Record<StorageStatus, string> = { AVAILABLE: "Disponible", RESERVED: "Reservado", DISPATCHED: "Despachado" };
const STATUS_VARIANT: Record<StorageStatus, "default" | "secondary" | "outline"> = { AVAILABLE: "default", RESERVED: "secondary", DISPATCHED: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { item: StorageItem | null; open: boolean; onClose: () => void; }

export const StorageDetailDialog = ({ item, open, onClose }: Props) => {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{item.code}</span><Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABELS[item.status]}</Badge></DialogTitle>
          <DialogDescription>Actualizado el {item.updatedAt.toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Producto</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Código" value={item.code} /><DetailRow label="Producto" value={item.product} /><DetailRow label="Cantidad" value={String(item.quantity)} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Ubicación</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Ubicación" value={item.location} /><DetailRow label="Estado" value={STATUS_LABELS[item.status]} /><DetailRow label="Actualización" value={item.updatedAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
