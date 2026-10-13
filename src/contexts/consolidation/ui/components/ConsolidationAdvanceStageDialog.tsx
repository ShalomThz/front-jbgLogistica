import { useState } from "react";
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
  STAGE_LABELS,
  nextStage,
  type ConsolidationStage,
} from "@contexts/consolidation/domain/schemas/consolidation/ConsolidationStages";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface Props {
  current: ConsolidationStage;
  onAdvance: () => Promise<unknown>;
  isAdvancing: boolean;
  disabled?: boolean;
}

/**
 * Confirma avanzar a la siguiente etapa. No hay elección de etapa como en
 * `ShipmentEventDialog`: el recorrido es lineal, así que lo único que se
 * decide es si ya se cumplió lo necesario para avanzar.
 */
export const ConsolidationAdvanceStageDialog = ({
  current,
  onAdvance,
  isAdvancing,
  disabled,
}: Props) => {
  const [open, setOpen] = useState(false);
  const next = nextStage(current);

  if (!next) return null;

  const handleConfirm = async () => {
    try {
      await onAdvance();
      toast.success(`Consolidado avanzado a "${STAGE_LABELS[next]}"`);
      setOpen(false);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <>
      <Button
        type="button"
        size="sm"
        className="gap-1.5"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        <ArrowRight className="size-3.5" />
        Avanzar a {STAGE_LABELS[next]}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Avanzar etapa del consolidado</DialogTitle>
            <DialogDescription>
              Pasa de <strong>{STAGE_LABELS[current]}</strong> a{" "}
              <strong>{STAGE_LABELS[next]}</strong>. El recorrido es lineal: no
              se puede regresar a una etapa anterior.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isAdvancing}
            >
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={isAdvancing}>
              {isAdvancing ? "Avanzando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
