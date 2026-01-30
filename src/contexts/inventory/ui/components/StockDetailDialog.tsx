import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type StockStatus = "OK" | "LOW" | "OUT_OF_STOCK";
export interface StockItem { id: string; product: string; warehouse: string; quantity: number; minimum: number; status: StockStatus; updatedAt: Date; }

const STATUS_LABELS: Record<StockStatus, string> = { OK: "OK", LOW: "Bajo", OUT_OF_STOCK: "Agotado" };
const STATUS_VARIANT: Record<StockStatus, "default" | "outline" | "secondary"> = { OK: "default", LOW: "outline", OUT_OF_STOCK: "secondary" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { item: StockItem | null; open: boolean; onClose: () => void; }

export const StockDetailDialog = ({ item, open, onClose }: Props) => {
  if (!item) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{item.product}</span><Badge variant={STATUS_VARIANT[item.status]}>{STATUS_LABELS[item.status]}</Badge></DialogTitle>
          <DialogDescription>Almacén: {item.warehouse}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Stock</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Producto" value={item.product} /><DetailRow label="Cantidad" value={String(item.quantity)} /><DetailRow label="Mínimo" value={String(item.minimum)} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Ubicación</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Almacén" value={item.warehouse} /><DetailRow label="Estado" value={STATUS_LABELS[item.status]} /><DetailRow label="Actualización" value={item.updatedAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
