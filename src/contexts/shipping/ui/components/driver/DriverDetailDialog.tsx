import { Pencil, Trash2, User } from "lucide-react";
import {
  Badge,
  Separator,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@/shared/shadcn";
import type { DriverPrimitives, DriverStatus } from "../../../domain";

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="col-span-2 text-sm">{value}</span>
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
  driver: DriverPrimitives | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (driver: DriverPrimitives) => void;
  onDelete?: (driver: DriverPrimitives) => void;
}

export const DriverDetailDialog = ({ driver, open, onClose, onEdit, onDelete }: Props) => {
  if (!driver) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg pt-8">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <User className="size-5" />
              Conductor {driver.id}
            </span>
            <Badge variant={STATUS_VARIANT[driver.status]}>{STATUS_LABELS[driver.status]}</Badge>
          </DialogTitle>
          <DialogDescription>Registrado el {formatDateTime(driver.createdAt)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Información</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="ID" value={driver.id} />
              <DetailRow label="Usuario ID" value={driver.userId} />
              <DetailRow label="Licencia" value={driver.licenseNumber} />
              <DetailRow label="Estado" value={STATUS_LABELS[driver.status]} />
            </div>
          </div>
          <Separator />
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Auditoría</h4>
            <div className="rounded-md border p-3 space-y-1">
              <DetailRow label="Creado" value={formatDateTime(driver.createdAt)} />
              <DetailRow label="Actualizado" value={formatDateTime(driver.updatedAt)} />
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <DialogFooter>
            {onDelete && (
              <Button variant="outline" size="sm" onClick={() => onDelete(driver)}>
                <Trash2 className="mr-1.5 size-4" />
                Eliminar
              </Button>
            )}
            {onEdit && (
              <Button size="sm" onClick={() => onEdit(driver)}>
                <Pencil className="mr-1.5 size-4" />
                Editar
              </Button>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
