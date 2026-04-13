import { Calendar, Clock, IdCard, Mail, Pencil, Store, User } from "lucide-react";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import type { DriverStatus } from "../../../domain/schemas/driver/Driver";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";

const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Disponible",
  ON_ROUTE: "En ruta",
  OFF_DUTY: "Fuera de servicio",
};

const STATUS_VARIANT: Record<DriverStatus, "default" | "secondary" | "outline"> = {
  AVAILABLE: "default",
  ON_ROUTE: "secondary",
  OFF_DUTY: "outline",
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof User;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

const formatDateTime = (date: string) =>
  new Date(date).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

interface Props {
  driver: DriverListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (driver: DriverListViewPrimitives) => void;
}

export const DriverDetailDialog = ({ driver, open, onClose, onEdit }: Props) => {
  if (!driver) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="size-5" />
              {driver.user.name}
            </span>
            <Badge variant={STATUS_VARIANT[driver.status]}>
              {STATUS_LABELS[driver.status]}
            </Badge>
          </DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            <Mail className="size-3.5" />
            {driver.user.email}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información</h4>
            <div className="rounded-md border p-3 space-y-3">
              <DetailRow icon={User} label="Nombre" value={driver.user.name} />
              <DetailRow icon={Mail} label="Email" value={driver.user.email} />
              <DetailRow icon={IdCard} label="Licencia" value={driver.licenseNumber} />
              <DetailRow icon={Store} label="Tienda" value={driver.user.store.name} />
              <DetailRow
                icon={Badge as typeof User}
                label="Estado cuenta"
                value={driver.user.isActive ? "Activo" : "Inactivo"}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-3">
              <DetailRow icon={Calendar} label="Creado" value={formatDateTime(driver.createdAt)} />
              <DetailRow icon={Clock} label="Actualizado" value={formatDateTime(driver.updatedAt)} />
            </div>
          </div>
        </div>

        {onEdit && (
          <DialogFooter>
            <Button size="sm" onClick={() => onEdit(driver)}>
              <Pencil className="mr-1.5 size-4" />
              Editar
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
