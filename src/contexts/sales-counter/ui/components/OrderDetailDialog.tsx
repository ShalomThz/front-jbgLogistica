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
import type { ShipmentOrder, ShipmentOrderStatus } from "../../domain/entities/ShipmentOrder";

const STATUS_LABELS: Record<ShipmentOrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
};

const STATUS_VARIANT: Record<ShipmentOrderStatus, "secondary" | "default" | "outline"> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
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
  order: ShipmentOrder | null;
  open: boolean;
  onClose: () => void;
}

export const OrderDetailDialog = ({ order, open, onClose }: OrderDetailDialogProps) => {
  if (!order) return null;

  const { customer, destination, financials, references } = order;

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
          <DialogDescription>
            Creada el {order.createdAt.toLocaleDateString("es-MX")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Cliente</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Nombre" value={customer.name} />
              <DetailRow label="Teléfono" value={customer.phone} />
              <DetailRow label="Email" value={customer.email ?? "—"} />
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Destino</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Calle" value={destination.street} />
              <DetailRow label="Colonia" value={destination.colony} />
              <DetailRow label="Ciudad" value={`${destination.city}, ${destination.state}`} />
              <DetailRow label="C.P." value={destination.zipCode} />
              <DetailRow label="País" value={destination.country} />
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
              {financials.paidAt && (
                <DetailRow label="Fecha de pago" value={financials.paidAt.toLocaleDateString("es-MX")} />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Referencias</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Factura partner" value={references.partnerInvoiceNumber ?? "—"} />
              <DetailRow label="Factura oficial" value={references.officialInvoiceNumber ?? "—"} />
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
