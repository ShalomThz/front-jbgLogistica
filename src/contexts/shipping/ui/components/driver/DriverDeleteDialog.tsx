import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Button,
} from "@contexts/shared/shadcn";
import type { DriverListViewPrimitives } from "../../../domain/schemas/driver/DriverListView";

interface Props {
  driver: DriverListViewPrimitives | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const DriverDeleteDialog = ({ driver, open, onClose, onConfirm, isLoading }: Props) => {
  if (!driver) return null;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar conductor</DialogTitle>
          <DialogDescription>
            ¿Eliminar al conductor{" "}
            <span className="font-medium">{driver.user.name}</span> con licencia{" "}
            <span className="font-medium">{driver.licenseNumber}</span>? Se ocultará de la lista de
            conductores y se bloqueará su acceso a la app de conductores, pero seguirá apareciendo en
            las rutas ya asignadas. Puedes reactivarlo después editando su perfil.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "Eliminando..." : "Eliminar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
