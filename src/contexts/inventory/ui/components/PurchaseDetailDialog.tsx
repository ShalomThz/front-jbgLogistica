import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type PurchaseStatus = "PENDING" | "RECEIVED" | "CANCELLED";
export interface Purchase { id: string; supplier: string; total: number; items: number; status: PurchaseStatus; createdAt: Date; }

const STATUS_LABELS: Record<PurchaseStatus, string> = { PENDING: "Pendiente", RECEIVED: "Recibida", CANCELLED: "Cancelada" };
const STATUS_VARIANT: Record<PurchaseStatus, "outline" | "default" | "secondary"> = { PENDING: "outline", RECEIVED: "default", CANCELLED: "secondary" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { purchase: Purchase | null; open: boolean; onClose: () => void; }

export const PurchaseDetailDialog = ({ purchase, open, onClose }: Props) => {
  if (!purchase) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{purchase.id}</span><Badge variant={STATUS_VARIANT[purchase.status]}>{STATUS_LABELS[purchase.status]}</Badge></DialogTitle>
          <DialogDescription>Fecha: {purchase.createdAt.toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Compra</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="# Compra" value={purchase.id} /><DetailRow label="Proveedor" value={purchase.supplier} /><DetailRow label="Items" value={String(purchase.items)} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Financiero</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Total" value={`$${purchase.total.toFixed(2)}`} /><DetailRow label="Estado" value={STATUS_LABELS[purchase.status]} /><DetailRow label="Fecha" value={purchase.createdAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
