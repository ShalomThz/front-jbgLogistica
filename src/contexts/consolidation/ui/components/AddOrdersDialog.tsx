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
import type {
  AddOrdersToConsolidationRequest,
  AddOrdersToConsolidationResponse,
} from "@contexts/consolidation/domain/schemas/consolidation/Consolidation";
import { OrderPicker, type SelectedOrder } from "@contexts/consolidation/ui/components/OrderPicker";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  capacityLinearFeet: number;
  usedLinearFeet: number;
  linearFeetDivisor: number;
  addOrders: (request: AddOrdersToConsolidationRequest) => Promise<AddOrdersToConsolidationResponse>;
  isAddingOrders: boolean;
}

/**
 * Agregar órdenes a un consolidado ya creado. Tres capas (header / contenido
 * / footer): sólo el contenido scrollea, header y footer quedan fijos. En
 * móvil ocupa toda la pantalla; desde `sm` es un modal centrado lo bastante
 * ancho para que el picker muestre lista y seleccionadas lado a lado.
 *
 * La selección vive aquí y sobrevive a cerrar/abrir — sólo se limpia al
 * agregar con éxito.
 */
export const AddOrdersDialog = ({
  open,
  onOpenChange,
  capacityLinearFeet,
  usedLinearFeet,
  linearFeetDivisor,
  addOrders,
  isAddingOrders,
}: Props) => {
  const [selection, setSelection] = useState<SelectedOrder[]>([]);

  const hasInvalidSelection = selection.some((o) => !o.linearFeet || o.linearFeet <= 0);

  const handleSubmit = async () => {
    try {
      const result = await addOrders({
        orders: selection.map((o) => ({
          orderId: o.orderId,
          linearFeet: o.linearFeet,
          section: o.section || null,
        })),
      });
      toast.success(
        result.capacityWarning
          ? "Órdenes agregadas — el consolidado quedó por encima de su capacidad declarada"
          : "Órdenes agregadas al consolidado",
      );
      onOpenChange(false);
      setSelection([]);
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `flex flex-col` en vez del `grid` del primitivo y `gap-0 p-0` para
          que cada capa ponga su propio espaciado. */}
      <DialogContent className="flex h-dvh max-w-full flex-col gap-0 rounded-none p-0 sm:h-[85dvh] sm:max-w-[calc(100%-2rem)] sm:rounded-lg lg:max-w-5xl">
        <DialogHeader className="border-b px-4 py-4 pr-12 text-left sm:px-6">
          <DialogTitle>Agregar órdenes</DialogTitle>
          <DialogDescription>
            Elige las órdenes que suben a este consolidado y captura los pies lineales que
            ocupan.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 px-4 py-4 sm:px-6">
          <OrderPicker
            selected={selection}
            onChange={setSelection}
            capacityLinearFeet={capacityLinearFeet}
            usedLinearFeet={usedLinearFeet}
            linearFeetDivisor={linearFeetDivisor}
            compact
          />
        </div>

        <DialogFooter className="border-t px-4 py-3 sm:px-6 sm:py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={selection.length === 0 || hasInvalidSelection || isAddingOrders}
            onClick={handleSubmit}
          >
            {isAddingOrders ? "Agregando..." : `Agregar (${selection.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
