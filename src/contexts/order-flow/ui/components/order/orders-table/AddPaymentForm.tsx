import { useState } from "react";
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@contexts/shared/shadcn";
import { Plus, Wallet } from "lucide-react";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@contexts/shared/domain/schemas/PaymentMethod";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";


interface Props {
  /** Moneda preseleccionada (la de facturación / tarifa). */
  defaultCurrency: string;
  onAdd: (data: AddPaymentRequest) => Promise<void>;
  isSaving: boolean;
  /** Si se pasa un saldo pendiente > 0, muestra "Liquidar saldo" que precarga
   * el monto. El libro lo usa; el inline HQ lo omite. */
  settlePending?: number | null;
  /** Los métodos a ofrecer. El libro del socio manda una lista corta: la de JBG
   * mezcla instrumentos, bancos y su propio procesador, y nada de eso describe
   * cómo le pagó el cliente al socio. */
  methods?: readonly PaymentMethod[];
  /** Las monedas a ofrecer. **Obligatoria a propósito**: un abono se concilia
   * contra `totalBilled`, que se calcula en la moneda de la tarifa, así que
   * quien monta este formulario tiene que decir cuál es. Antes tenía un default
   * de MXN/USD/EUR y bastaba con olvidarlo para volver a ofrecer monedas que
   * dejan el saldo sin cerrar. */
  currencies: readonly string[];
}

/** Formulario de alta de un abono: monto + moneda + método + concepto. */
export const AddPaymentForm = ({
  defaultCurrency,
  onAdd,
  isSaving,
  settlePending,
  methods = PAYMENT_METHODS,
  currencies,
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

  const numericAmount = Number(amount);
  const hasAmount = Boolean(amount) && numericAmount > 0;
  const canSubmit = hasAmount && Boolean(method);

  return (
    <div className="space-y-3">
      {/* Atajo del saldo. Antes era un "Liquidar saldo" en 12px arriba a la
          derecha, sin decir cuánto: había que buscar la cifra en el resumen para
          saber qué iba a precargar. */}
      {settlePending != null && settlePending > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-auto w-full justify-center border-dashed py-2 text-xs font-normal"
          onClick={() => {
            setAmount(settlePending.toFixed(2));
            setCurrency(defaultCurrency);
          }}
        >
          <Wallet className="size-3.5 opacity-60" />
          Liquidar saldo ·{" "}
          <span className="font-semibold tabular-nums">
            ${settlePending.toFixed(2)} {defaultCurrency}
          </span>
        </Button>
      )}

      {/* Con etiqueta cada campo: el placeholder desaparece al escribir, y
          después no había forma de saber qué era cada casilla. */}
      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Monto
        </Label>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              className="pl-7 text-base font-semibold tabular-nums"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Método
        </Label>
        <Select
          value={method}
          onValueChange={(v) => setMethod(v as PaymentMethod)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Cómo se pagó" />
          </SelectTrigger>
          <SelectContent>
            {methods.map((m) => (
              <SelectItem key={m} value={m}>
                {PAYMENT_METHOD_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Concepto <span className="normal-case opacity-60">· opcional</span>
        </Label>
        <Input
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          placeholder="Referencia, nota…"
          maxLength={200}
        />
      </div>

      <Button
        type="button"
        className="w-full"
        disabled={isSaving || !canSubmit}
        onClick={handleAdd}
      >
        <Plus className="size-4" />
        {isSaving ? "Guardando…" : "Agregar abono"}
      </Button>

      {/* Por qué está deshabilitado. Sin esto el botón gris no dice qué falta y
          se prueba a ciegas. */}
      {!canSubmit && !isSaving && (
        <p className="text-center text-xs text-muted-foreground">
          {!hasAmount ? "Escribe un monto" : "Elige el método de pago"}
        </p>
      )}
    </div>
  );
};
