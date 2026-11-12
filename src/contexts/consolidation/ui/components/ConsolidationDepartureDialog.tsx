import { useState } from "react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  departureFromInput,
  departureToInput,
} from "@contexts/consolidation/domain/departureDate";
import { DepartureDatePicker } from "@contexts/consolidation/ui/components/DepartureDatePicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folio: string;
  initialValue: string | null;
  onSave: (plannedDepartureAt: string | null) => Promise<unknown>;
  isSaving: boolean;
}

/**
 * Cambia la salida planeada del consolidado. El día vive en estado propio
 * mientras el modal está abierto; se monta con `key`, así que cada apertura
 * arranca del valor guardado. El cambio queda en el historial (lo escribe el
 * back).
 */
export const ConsolidationDepartureDialog = ({
  open,
  onOpenChange,
  folio,
  initialValue,
  onSave,
  isSaving,
}: Props) => {
  const [value, setValue] = useState(departureToInput(initialValue));
  const unchanged = value === departureToInput(initialValue);

  const handleSave = async () => {
    try {
      await onSave(departureFromInput(value));
      toast.success("Fecha de salida actualizada");
      onOpenChange(false);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initialValue ? "Cambiar fecha de salida" : "Agregar fecha de salida"}</DialogTitle>
          <DialogDescription>
            Consolidado <span className="font-mono font-medium text-foreground">{folio}</span>
          </DialogDescription>
        </DialogHeader>

        <DepartureDatePicker value={value} onChange={setValue} />

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={unchanged || isSaving}>
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
