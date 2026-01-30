import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type TariffStatus = "ACTIVE" | "INACTIVE";
export interface Tariff { id: string; name: string; zone: string; basePrice: number; pricePerKg: number; status: TariffStatus; updatedAt: Date; }

const STATUS_LABELS: Record<TariffStatus, string> = { ACTIVE: "Activa", INACTIVE: "Inactiva" };
const STATUS_VARIANT: Record<TariffStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { tariff: Tariff | null; open: boolean; onClose: () => void; }

export const TariffDetailDialog = ({ tariff, open, onClose }: Props) => {
  if (!tariff) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{tariff.name}</span><Badge variant={STATUS_VARIANT[tariff.status]}>{STATUS_LABELS[tariff.status]}</Badge></DialogTitle>
          <DialogDescription>Tarifa {tariff.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Tarifa</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={tariff.name} /><DetailRow label="Zona" value={tariff.zone} /><DetailRow label="Estado" value={STATUS_LABELS[tariff.status]} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Precios</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Precio base" value={`$${tariff.basePrice.toFixed(2)}`} /><DetailRow label="Precio/Kg" value={`$${tariff.pricePerKg.toFixed(2)}`} /><DetailRow label="Actualización" value={tariff.updatedAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
