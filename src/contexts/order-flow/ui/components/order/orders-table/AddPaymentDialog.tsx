import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { Plus } from "lucide-react";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { PaymentMethod } from "@contexts/shared/domain/schemas/PaymentMethod";
import { PageLoader } from "@contexts/shared/ui/components/PageLoader";
import { AddPaymentForm } from "./AddPaymentForm";

interface Props {
  open: boolean;
  onClose: () => void;
  /** A quién se le paga. El libro de JBG y el del socio con su cliente son dos
   * cosas distintas, y este diálogo se abre desde los dos. */
  title: string;
  description?: string;
  defaultCurrency: string;
  onAdd: (data: AddPaymentRequest) => Promise<void>;
  isSaving: boolean;
  settlePending?: number | null;
  methods?: readonly PaymentMethod[];
  /** Obligatoria, como en `AddPaymentForm`: la moneda del abono la manda la de
   * facturación, no la elige quien carga. */
  currencies: readonly string[];
}

/**
 * El alta de un abono, en su propio diálogo.
 *
 * Vive fuera del libro a propósito: registrar un abono es una tarea aparte de
 * consultarlo. Con el formulario embebido, el modal del libro cargaba a la vez
 * el resumen, la lista, cuatro campos y dos botones, y no se distinguía lo que
 * se mira de lo que se hace.
 *
 * Se cierra solo al guardar. Si el alta falla, queda abierto con lo tecleado:
 * el error lo muestra quien pasa `onAdd`, y cerrar acá borraría los datos justo
 * cuando hay que corregirlos.
 */
export const AddPaymentDialog = ({
  open,
  onClose,
  title,
  description,
  defaultCurrency,
  onAdd,
  isSaving,
  settlePending,
  methods,
  currencies,
}: Props) => {
  const handleAdd = async (data: AddPaymentRequest) => {
    await onAdd(data);
    onClose();
  };

  return (
    // Mientras guarda no se cierra: el `await` todavía no terminó, y dejarlo
    // cerrar haría que `onClose` corra sobre un diálogo ya cerrado.
    <Dialog open={open} onOpenChange={(v) => !v && !isSaving && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-muted">
              <Plus className="size-4" />
            </span>
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        {/* El loader va **encima** y no en lugar del formulario: reemplazarlo lo
            desmontaría, y si el alta falla volvería vacío justo cuando hay que
            corregir lo que se escribió. */}
        <div className="relative">
          {isSaving && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/80 backdrop-blur-[1px]">
              <PageLoader text="Guardando abono…" />
            </div>
          )}

          <AddPaymentForm
            defaultCurrency={defaultCurrency}
            onAdd={handleAdd}
            isSaving={isSaving}
            settlePending={settlePending}
            methods={methods}
            currencies={currencies}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
