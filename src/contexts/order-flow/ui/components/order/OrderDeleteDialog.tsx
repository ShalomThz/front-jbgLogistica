import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@contexts/shared/shadcn";
import { TriangleAlert } from "lucide-react";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import { resolvePaymentStatus } from "@contexts/shared/domain/schemas/PaymentStatus";

interface Props {
  order: OrderListView | null;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

/** Lo que conviene saber antes de borrar. Solo avisa: el back no rechaza la
 * eliminación por ninguna de estas razones, y quien tiene el permiso decide. */
const deletionWarnings = (order: OrderListView): string[] => {
  const { payments } = order.financials;
  const warnings: string[] = [];

  const hasCloverPayment = payments.some(
    (payment) => payment.externalReference?.provider === "CLOVER",
  );
  if (hasCloverPayment) {
    warnings.push(
      "Tiene un cobro con tarjeta confirmado por Clover. Eliminarla no devuelve ese dinero.",
    );
  }

  if (payments.length > 0) {
    warnings.push(
      payments.length === 1
        ? "Tiene 1 abono registrado, que se pierde con la orden."
        : `Tiene ${payments.length} abonos registrados, que se pierden con la orden.`,
    );
  } else if (resolvePaymentStatus(order.financials) !== "UNPAID") {
    // Pagada por el flujo viejo de pago único, que no deja abonos en el libro.
    warnings.push("Está marcada como pagada.");
  }

  if (order.shipment?.status === "DELIVERED") {
    warnings.push("El envío ya fue entregado.");
  }

  return warnings;
};

export const OrderDeleteDialog = ({
  order,
  open,
  onClose,
  onConfirm,
  isLoading,
}: Props) => {
  if (!order) return null;
  const warnings = deletionWarnings(order);
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Eliminar orden</DialogTitle>
          <DialogDescription>
            ¿Eliminar la orden de "{order.destination.name}"? Esta acción no se puede deshacer.
          </DialogDescription>
        </DialogHeader>
        {warnings.length > 0 && (
          <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200">
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <ul className="space-y-1">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
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
