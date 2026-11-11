import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { TriangleAlert } from "lucide-react";
import type { TrailerListItem } from "@contexts/consolidation/domain/schemas/trailer/Trailer";

interface Props {
  /** Tráiler por confirmar; `null` cierra el modal. */
  trailer: TrailerListItem | null;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación al elegir un tráiler que ya va en otro consolidado sin
 * conciliar. No está prohibido (decisión de negocio), pero un mismo tráiler
 * en dos embarques abiertos casi siempre es un error de captura.
 */
export const TrailerInUseDialog = ({ trailer, onConfirm, onCancel }: Props) => {
  const folios = trailer?.openInFolios ?? [];
  const plural = folios.length !== 1;

  return (
    <Dialog open={trailer !== null} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-status-attention-fg" />
            Tráiler ya asignado
          </DialogTitle>
          <DialogDescription>
            El tráiler{" "}
            <span className="font-mono font-medium text-foreground">
              {trailer?.unitNumber}
            </span>{" "}
            ya está en {plural ? `${folios.length} consolidados` : "un consolidado"} sin
            conciliar. ¿Quieres usarlo también en este?
          </DialogDescription>
        </DialogHeader>

        <ul className="divide-y rounded-md border text-sm">
          {folios.map((folio) => (
            <li key={folio} className="px-3 py-2 font-mono">
              {folio}
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Elegir otro
          </Button>
          <Button onClick={onConfirm}>Usar de todos modos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
