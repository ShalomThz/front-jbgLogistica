import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@contexts/shared/shadcn";
import { BadgeDollarSign } from "lucide-react";
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
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg flex max-h-[85vh] flex-col gap-0 p-0">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="size-5 text-green-600" />
            Pagos de la orden
          </DialogTitle>
          <DialogDescription>
            Registra abonos parciales. El estado se actualiza automáticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <PaymentLedgerPanel
            order={order}
            onAddPayment={onAddPayment}
            onRemovePayment={onRemovePayment}
            onClearPayments={onClearPayments}
            isSaving={isSaving}
          />
        </div>

        <DialogFooter className="shrink-0 border-t p-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
