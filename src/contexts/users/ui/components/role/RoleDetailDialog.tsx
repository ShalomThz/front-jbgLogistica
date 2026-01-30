import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type RoleStatus = "ACTIVE" | "INACTIVE";
export interface Role { id: string; name: string; description: string; users: number; permissions: number; status: RoleStatus; createdAt: Date; }

const STATUS_LABELS: Record<RoleStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<RoleStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { role: Role | null; open: boolean; onClose: () => void; }

export const RoleDetailDialog = ({ role, open, onClose }: Props) => {
  if (!role) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{role.name}</span><Badge variant={STATUS_VARIANT[role.status]}>{STATUS_LABELS[role.status]}</Badge></DialogTitle>
          <DialogDescription>Rol {role.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Rol</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={role.name} /><DetailRow label="Descripción" value={role.description} /><DetailRow label="Estado" value={STATUS_LABELS[role.status]} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Asignación</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Usuarios" value={String(role.users)} /><DetailRow label="Permisos" value={String(role.permissions)} /><DetailRow label="Fecha creación" value={role.createdAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
