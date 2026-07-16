import { useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { BadgeDollarSign } from "lucide-react";
import type { PaymentMethod } from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
};

/** Selección de pago en los flujos de creación: se captura en la UI y se
 * envía al backend una vez creada la orden. */
export interface PaymentSelection {
  markAsPaid: boolean;
  method: PaymentMethod | null;
  concept: string | null;
}

export const UNPAID_SELECTION: PaymentSelection = {
  markAsPaid: false,
  method: null,
  concept: null,
};

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (method: PaymentMethod, concept: string | null) => Promise<void>;
}

export const OrderPaymentDialog = ({ open, onClose, onConfirm }: Props) => {
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [concept, setConcept] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setMethod("");
    setConcept("");
    onClose();
  };

  const handleConfirm = async () => {
    if (!method) return;
    setIsSaving(true);
    try {
      await onConfirm(method, concept.trim() || null);
      handleClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeDollarSign className="size-5 text-green-600" />
            Registrar pago
          </DialogTitle>
          <DialogDescription>
            Indica cómo se pagó la orden antes de marcarla como pagada.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-method">Método de pago</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as PaymentMethod)}
            >
              <SelectTrigger id="payment-method" className="w-full">
                <SelectValue placeholder="Selecciona un método" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="payment-concept">Concepto (opcional)</Label>
            <Input
              id="payment-concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="p. ej. referencia de la transferencia"
              maxLength={200}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!method || isSaving}>
            {isSaving ? "Guardando…" : "Confirmar pago"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
