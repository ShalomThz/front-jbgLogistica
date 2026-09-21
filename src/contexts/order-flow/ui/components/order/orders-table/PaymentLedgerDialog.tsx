import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { useState } from "react";
import { BadgeDollarSign, Plus, Trash2 } from "lucide-react";
import {
  PAYMENT_STATUS_SURFACE,
  resolveBilledBalance,
  resolvePaymentStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import { AddPaymentDialog } from "./AddPaymentDialog";
import type { OrderListView } from "@contexts/sales/domain/schemas/order/OrderListViewSchemas";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { PaymentLedgerPanel } from "./PaymentLedgerPanel";

interface Props {
  open: boolean;
  onClose: () => void;
  order: OrderListView;
  onAddPayment: (data: AddPaymentRequest) => Promise<void>;
  onRemovePayment: (paymentId: string) => Promise<void>;
  onClearPayments: () => Promise<void>;
  isSaving: boolean;
}

export const PaymentLedgerDialog = ({
  open,
  onClose,
  order,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  isSaving,
}: Props) => {
  const status = resolvePaymentStatus(order.financials);
  const surface = PAYMENT_STATUS_SURFACE[status];

  const [confirmingClear, setConfirmingClear] = useState(false);
  const [adding, setAdding] = useState(false);

  const balance = resolveBilledBalance(order.financials);
  // La de facturación; USD mientras la orden no tenga tarifa, que es el default
  // de los formularios.
  const billedCurrency = order.financials.totalBilled?.currency ?? "USD";

  const hasAnyPayment =
    status !== "UNPAID" || order.financials.payments.length > 0;
  // Un cobro de Clover no se borra desde acá: lo confirmó la pasarela.
  const hasCloverPayment = order.financials.payments.some(
    (payment) => payment.externalReference?.provider === "CLOVER",
  );

  const handleClearPayments = async () => {
    await onClearPayments();
    setConfirmingClear(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-3xl">
        <DialogHeader className="shrink-0 border-b p-6">
          {/* "Pagos de la orden" no decía a quién. En una orden de socio hay dos
              libros —éste y el del agente con su cliente—, y sin el nombre se
              confundían. */}
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${surface.iconBg}`}
            >
              <BadgeDollarSign className={`size-4 ${surface.accent}`} />
            </span>
            Pagos a JBG
          </DialogTitle>
          <DialogDescription>
            {order.type === "PARTNER"
              ? "Lo que el agente le paga a JBG por esta orden. No es lo que su cliente le paga a él."
              : "Lo que el cliente le paga a JBG por esta orden."}{" "}
            El estado se actualiza automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <PaymentLedgerPanel
            order={order}
            onRemovePayment={onRemovePayment}
            isSaving={isSaving}
          />
        </div>

        {/* Las dos acciones que cierran la interacción, juntas: borrar el libro
            a la izquierda —separada, porque es destructiva— y agregar el abono a
            la derecha con el resto. */}
        <DialogFooter className="shrink-0 gap-2 border-t p-6 sm:justify-between">
          <div>
            {hasAnyPayment &&
              !hasCloverPayment &&
              (confirmingClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    ¿Borrar todos los abonos?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isSaving}
                    onClick={handleClearPayments}
                  >
                    Sí, no pagado
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSaving}
                    onClick={() => setConfirmingClear(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  disabled={isSaving}
                  onClick={() => setConfirmingClear(true)}
                >
                  <Trash2 className="size-4" />
                  Marcar como no pagado
                </Button>
              ))}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Cerrar
            </Button>
            <Button disabled={isSaving} onClick={() => setAdding(true)}>
              <Plus className="size-4" />
              Agregar pago
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Encima del libro, no dentro: registrar es otra tarea que consultar. */}
      <AddPaymentDialog
        open={adding}
        onClose={() => setAdding(false)}
        title="Agregar pago a JBG"
        description={
          order.type === "PARTNER"
            ? "Un abono del agente a JBG por esta orden."
            : "Un abono del cliente a JBG por esta orden."
        }
        defaultCurrency={billedCurrency}
        // Una sola: la de facturación. `AddPaymentForm` ofrecía MXN/USD/EUR, y
        // un abono en otra moneda se convierte con la tasa del día en que se
        // deriva el estado, así que el saldo de una orden ya saldada se despega
        // de cero cuando el cambio se mueve.
        currencies={[billedCurrency]}
        onAdd={onAddPayment}
        isSaving={isSaving}
        settlePending={balance?.pending}
      />
    </Dialog>
  );
};
