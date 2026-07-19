import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Plus } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@contexts/shared/domain/schemas/PaymentMethod";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";

const CURRENCIES = ["MXN", "USD", "EUR"];

interface Props {
  /** Moneda preseleccionada (la de facturación / tarifa). */
  defaultCurrency: string;
  onAdd: (data: AddPaymentRequest) => Promise<void>;
  isSaving: boolean;
  /** Si se pasa un saldo pendiente > 0, muestra "Liquidar saldo" que precarga
   * el monto. El libro lo usa; el inline HQ lo omite. */
  settlePending?: number | null;
}

/** Formulario de alta de un abono: monto + moneda + método + concepto. */
export const AddPaymentForm = ({
  defaultCurrency,
  onAdd,
  isSaving,
  settlePending,
}: Props) => {
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(defaultCurrency);
  const [method, setMethod] = useState<PaymentMethod | "">("");
  const [concept, setConcept] = useState("");

  const handleAdd = async () => {
    const numericAmount = Number(amount);
    if (!method || !numericAmount || numericAmount <= 0) return;
    await onAdd({
      amount: { amount: numericAmount, currency },
      method,
      concept: concept.trim() || null,
    });
    setAmount("");
    setCurrency(defaultCurrency);
    setMethod("");
    setConcept("");
  };

  return (
    <div className="space-y-3">
      {settlePending != null && settlePending > 0 && (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto p-0 text-xs"
            onClick={() => {
              setAmount(settlePending.toFixed(2));
              setCurrency(defaultCurrency);
            }}
          >
            Liquidar saldo
          </Button>
        </div>
      )}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Método de pago" />
        </SelectTrigger>
        <SelectContent>
          {PAYMENT_METHODS.map((m) => (
            <SelectItem key={m} value={m}>
              {PAYMENT_METHOD_LABELS[m]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        value={concept}
        onChange={(e) => setConcept(e.target.value)}
        placeholder="Concepto (opcional)"
        maxLength={200}
      />
      <Button
        type="button"
        className="w-full"
        disabled={isSaving || !method || !amount || Number(amount) <= 0}
        onClick={handleAdd}
      >
        <Plus className="size-4" />
        {isSaving ? "Guardando…" : "Agregar abono"}
      </Button>
    </div>
  );
};
