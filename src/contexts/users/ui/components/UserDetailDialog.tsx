import { Badge, Separator, Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/shadcn";

export type UserStatus = "ACTIVE" | "INACTIVE";
export interface User { id: string; name: string; email: string; role: string; store: string; status: UserStatus; createdAt: Date; }

const STATUS_LABELS: Record<UserStatus, string> = { ACTIVE: "Activo", INACTIVE: "Inactivo" };
const STATUS_VARIANT: Record<UserStatus, "default" | "outline"> = { ACTIVE: "default", INACTIVE: "outline" };

function DetailRow({ label, value }: { label: string; value: string }) {
  return (<div className="grid grid-cols-3 gap-2"><span className="text-sm text-muted-foreground">{label}</span><span className="col-span-2 text-sm">{value}</span></div>);
}

interface Props { user: User | null; open: boolean; onClose: () => void; }

export const UserDetailDialog = ({ user, open, onClose }: Props) => {
  if (!user) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between"><span>{user.name}</span><Badge variant={STATUS_VARIANT[user.status]}>{STATUS_LABELS[user.status]}</Badge></DialogTitle>
          <DialogDescription>Usuario desde {user.createdAt.toLocaleDateString("es-MX")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><h4 className="text-sm font-semibold">Datos personales</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Nombre" value={user.name} /><DetailRow label="Email" value={user.email} /><DetailRow label="Estado" value={STATUS_LABELS[user.status]} /></div></div>
          <Separator />
          <div className="space-y-2"><h4 className="text-sm font-semibold">Acceso</h4><div className="rounded-md border p-3 space-y-1"><DetailRow label="Rol" value={user.role} /><DetailRow label="Tienda" value={user.store} /><DetailRow label="Fecha registro" value={user.createdAt.toLocaleDateString("es-MX")} /></div></div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
