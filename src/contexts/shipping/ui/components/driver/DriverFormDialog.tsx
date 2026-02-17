import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import type { DriverPrimitives, DriverStatus } from "../../../domain/schemas/driver/Driver";

const DRIVER_STATUSES: DriverStatus[] = ["AVAILABLE", "ON_ROUTE", "OFF_DUTY"];

const STATUS_LABELS: Record<DriverStatus, string> = {
  AVAILABLE: "Disponible",
  ON_ROUTE: "En ruta",
  OFF_DUTY: "Fuera de servicio",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: Omit<DriverPrimitives, "id" | "createdAt" | "updatedAt">) => void;
  driver?: DriverPrimitives | null;
}

export const DriverFormDialog = ({ open, onClose, onSave, driver }: Props) => {
  const [userId, setUserId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [status, setStatus] = useState<DriverStatus>("AVAILABLE");

  useEffect(() => {
    if (open) {
      if (driver) {
        setUserId(driver.userId);
        setLicenseNumber(driver.licenseNumber);
        setStatus(driver.status);
      } else {
        setUserId("");
        setLicenseNumber("");
        setStatus("AVAILABLE");
      }
    }
  }, [open, driver]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ userId, licenseNumber, status });
  };

  const isEdit = !!driver;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Conductor" : "Crear Conductor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifica los datos del conductor." : "Ingresa los datos del nuevo conductor."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">ID de Usuario *</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="USR-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="licenseNumber">Número de Licencia *</Label>
            <Input
              id="licenseNumber"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="LIC-A-12345"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as DriverStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Guardar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
