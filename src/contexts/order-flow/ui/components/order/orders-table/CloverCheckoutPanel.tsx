import type { CloverCheckout } from "@contexts/sales/domain/schemas/CloverCheckout";
import { Badge, Button, Input, Label } from "@contexts/shared/shadcn";
import { CheckCircle2, Copy, ExternalLink, Link2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

interface Props {
  outstanding: number;
  checkout: CloverCheckout | null;
  onCreate: (amount: { amount: number; currency: "USD" }) => Promise<unknown>;
  isLoading: boolean;
  error?: string | null;
}

const money = (amount: number) => `$${amount.toFixed(2)} USD`;

export const CloverCheckoutPanel = ({
  outstanding,
  checkout,
  onCreate,
  isLoading,
  error,
}: Props) => {
  const [amount, setAmount] = useState(outstanding.toFixed(2));

  const numericAmount = Number(amount);
  const isValid =
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    Math.round(numericAmount * 100) <= Math.round(outstanding * 100);
  const isActive =
    checkout?.status === "PENDING" &&
    Math.round(checkout.amount.amount * 100) <= Math.round(outstanding * 100);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!isValid) return;
    try {
      await onCreate({ amount: numericAmount, currency: "USD" });
    } catch {
      // The mutation exposes its error through the error prop.
    }
  };

  const copyLink = async () => {
    if (!checkout) return;
    await navigator.clipboard.writeText(checkout.href);
    toast.success("Enlace de Clover copiado");
  };

  return (
    <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-500/30 dark:bg-emerald-500/[0.06]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-medium">
          <Link2 className="size-4 text-emerald-700 dark:text-emerald-400" />
          Cobro con Clover
        </div>
        {checkout?.status === "APPROVED" && (
          <Badge className="bg-emerald-600">
            <CheckCircle2 className="size-3" /> Pagado
          </Badge>
        )}
        {isActive && <Badge variant="outline">Enlace activo</Badge>}
      </div>

      {isActive && checkout ? (
        <div className="space-y-3">
          <div>
            <div className="text-lg font-semibold tabular-nums">
              {money(checkout.amount.amount)}
            </div>
            <p className="text-xs text-muted-foreground">
              Vence {new Date(checkout.expiresAt).toLocaleTimeString()}
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={copyLink}>
              <Copy className="size-4" /> Copiar
            </Button>
            <Button asChild>
              <a href={checkout.href} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Abrir enlace
              </a>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {checkout?.status === "APPROVED" && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">
              Clover confirmó el abono de {money(checkout.amount.amount)}.
              Puedes generar otro enlace por el saldo restante.
            </p>
          )}
          {checkout?.status === "DECLINED" && (
            <p className="text-sm text-destructive">
              Clover no aprobó el intento anterior. Puedes generar otro enlace.
            </p>
          )}
          {checkout?.status === "EXPIRED" && (
            <p className="text-sm text-muted-foreground">
              El enlace anterior expiró. Genera uno nuevo para continuar.
            </p>
          )}
          {checkout?.status === "PENDING" && !isActive && (
            <p className="text-sm text-amber-700 dark:text-amber-300">
              El saldo cambió después de generar el enlace anterior. Genera un
              enlace actualizado antes de compartirlo.
            </p>
          )}
          <form className="space-y-3" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="clover-checkout-amount">
              Monto a cobrar con Clover
            </Label>
            <Input
              id="clover-checkout-amount"
              type="number"
              min="0.01"
              max={outstanding.toFixed(2)}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Saldo máximo disponible: {money(outstanding)}. Clover procesará
              y liquidará el cobro en USD.
            </p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button type="submit" disabled={!isValid || isLoading}>
            <Link2 className="size-4" />
            {isLoading ? "Generando…" : "Generar enlace"}
          </Button>
          </form>
        </div>
      )}
    </section>
  );
};
