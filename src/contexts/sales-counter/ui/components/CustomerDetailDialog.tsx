import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

type CustomerStatus = "ACTIVE" | "INACTIVE";
interface Customer { id: string; name: string; phone: string; email: string; totalOrders: number; status: CustomerStatus; createdAt: Date; }

const STATUS_LABELS: Record<CustomerStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<CustomerStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { customer: Customer | null; open: boolean; onClose: () => void; }

export const CustomerDetailDialog = ({ customer, open, onClose }: Props) => {
  if (!customer) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{customer.name}</span><Badge variant={STATUS_VARIANT[customer.status]}>{STATUS_LABELS[customer.status]}</Badge></DialogTitle>
          <DialogDescription>Cliente desde {customer.createdAt.toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Datos personales</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={customer.name} /><DetailRow label="Teléfono" value={customer.phone} /><DetailRow label="Email" value={customer.email} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Actividad</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Total órdenes" value={String(customer.totalOrders)} /><DetailRow label="Estado" value={STATUS_LABELS[customer.status]} /><DetailRow label="Fecha registro" value={customer.createdAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export type { Customer, CustomerStatus };
