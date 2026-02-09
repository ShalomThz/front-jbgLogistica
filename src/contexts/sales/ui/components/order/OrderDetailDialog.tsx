import { Pencil } from "lucide-react";
import {
  Badge,
  Button,
  Separator,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/shared/shadcn";
import type { ShipmentOrderPrimitives, ShipmentOrderStatus } from "../../../domain";

const STATUS_LABELS: Record<ShipmentOrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

const STATUS_VARIANT: Record<ShipmentOrderStatus, "secondary" | "default" | "outline" | "destructive"> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}

interface OrderDetailDialogProps {
  order: ShipmentOrderPrimitives | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailDialog = ({ order, open, onClose }: OrderDetailDialogProps) => {
  if (!order) return null;

  const { origin, destination, financials, references } = order;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Orden {order.id}</span>
            <Badge variant={STATUS_VARIANT[order.status]}>
              {STATUS_LABELS[order.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription>Tienda {order.storeId}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Origen</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={origin.name} />
              <DetailRow label="Empresa" value={origin.company || "—"} />
              <DetailRow label="Teléfono" value={origin.phone} />
              <DetailRow label="Email" value={origin.email || "—"} />
              <DetailRow label="Dirección" value={origin.address.address1} />
              {origin.address.address2 && <DetailRow label="Dirección 2" value={origin.address.address2} />}
              <DetailRow label="Ciudad" value={`${origin.address.city}, ${origin.address.province}`} />
              <DetailRow label="C.P." value={origin.address.zip} />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Destino</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={destination.name} />
              <DetailRow label="Empresa" value={destination.company || "—"} />
              <DetailRow label="Teléfono" value={destination.phone} />
              <DetailRow label="Email" value={destination.email || "—"} />
              <DetailRow label="Dirección" value={destination.address.address1} />
              {destination.address.address2 && <DetailRow label="Dirección 2" value={destination.address.address2} />}
              <DetailRow label="Ciudad" value={`${destination.address.city}, ${destination.address.province}`} />
              <DetailRow label="C.P." value={destination.address.zip} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Paquete</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Caja" value={order.package.boxName || "—"} />
              <DetailRow label="Dimensiones" value={`${order.package.dimensions.length}×${order.package.dimensions.width}×${order.package.dimensions.height} ${order.package.dimensions.unit}`} />
              <DetailRow label="Peso mercancía" value={`${order.package.goodsWeight} ${order.package.weightUnit}`} />
              <DetailRow label="Propiedad" value={order.package.ownership} />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Financiero</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow
                label="Total"
                value={`$${financials.totalPrice.amount.toFixed(2)} ${financials.totalPrice.currency}`}
              />
              <DetailRow label="Pagado" value={financials.isPaid ? "Sí" : "No"} />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Referencias</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Factura partner" value={references.partnerInvoice ?? "—"} />
              <DetailRow label="Factura oficial" value={references.officialInvoice ?? "—"} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => { /* TODO: navigate to edit */ }}>
            <Pencil className="size-4" />
            Editar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
