import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import { Store, X } from "lucide-react";
import { toast } from "sonner";
import { AddPaymentForm } from "@contexts/order-flow/ui/components/order/orders-table/AddPaymentForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import {
  partnerSaleBilled,
  type OrderFinancialsPrimitives,
} from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";
import {
  PARTNER_SALE_PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@contexts/shared/domain/schemas/PaymentMethod";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import {
  PAYMENT_STATUS_SURFACE,
  resolveLedgerStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";

interface Props {
  open: boolean;
  onClose: () => void;
  partnerSale: NonNullable<OrderFinancialsPrimitives["partnerSale"]>;
  storeName?: string;
  /** El remitente: es quien llevó el paquete a la tienda, o sea el cliente del
   * agente y quien paga estos abonos. */
  clientName?: string;
  onAddPayment: (data: AddPaymentRequest) => Promise<void>;
  onRemovePayment: (paymentId: string) => Promise<void>;
  isSaving: boolean;
}

/**
 * El libro del socio con su cliente, editable.
 *
 * Espeja a `PaymentLedgerDialog`, que hace lo mismo para los abonos a JBG: un
 * diálogo con el resumen, la lista y el alta. Lo que cambia es de qué libro sale
 * y qué se le permite cargar — acá solo los tres instrumentos y la moneda de la
 * venta, porque el value object del backend rechaza cualquier otra cosa.
 */
export const PartnerSaleLedgerDialog = ({
  open,
  onClose,
  partnerSale,
  storeName,
  clientName,
  onAddPayment,
  onRemovePayment,
  isSaving,
}: Props) => {
  const payments = partnerSale.payments ?? [];
  const paid = payments.reduce((sum, p) => sum + p.amount.amount, 0);
  const billed = partnerSaleBilled(partnerSale);

  const balance = Math.max(0, billed - paid);
  const currency = partnerSale.total.currency;

  const handleAdd = async (data: AddPaymentRequest) => {
    try {
      await onAddPayment(data);
      toast.success("Abono registrado");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const handleRemove = async (paymentId: string) => {
    try {
      await onRemovePayment(paymentId);
      toast.success("Abono eliminado");
    } catch (error) {
      toast.error(parseApiError(error));
    }
  };

  const money = (amount: number, code = currency) =>
    `$${amount.toFixed(2)} ${code}`;

  // Este libro no guarda `paymentStatus`: se deriva de lo cobrado y lo pagado,
  // igual que en `PartnerSaleSection`.
  const surface = PAYMENT_STATUS_SURFACE[resolveLedgerStatus(billed, paid)];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b p-6">
          <DialogTitle className="flex items-center gap-2">
            <span
              className={`flex size-8 items-center justify-center rounded-lg ${surface.iconBg}`}
            >
              <Store className={`size-4 ${surface.accent}`} />
            </span>
            Abonos de tu cliente
          </DialogTitle>
          <DialogDescription>
            {["Abonos de la orden", clientName, storeName]
              .filter(Boolean)
              .join(" · ")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="space-y-1.5 rounded-lg border p-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total</span>
              <span>{money(billed)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pagado</span>
              <span>{money(paid)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-base font-bold">
              <span>Saldo</span>
              <span className={balance > 0 ? "text-destructive" : "text-green-600"}>
                {money(balance)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Abonos registrados</p>
            {payments.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Todavía no cargaste ninguno.
              </p>
            )}
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="font-medium">
                    {money(payment.amount.amount, payment.amount.currency)}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[payment.method] ?? payment.method}
                    {payment.concept ? ` · ${payment.concept}` : ""}
                    {payment.date
                      ? ` · ${new Date(payment.date).toLocaleDateString("es-MX")}`
                      : ""}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                  aria-label="Quitar abono"
                  disabled={isSaving}
                  onClick={() => handleRemove(payment.id)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Registrar abono</p>
            <AddPaymentForm
              defaultCurrency={currency}
              onAdd={handleAdd}
              isSaving={isSaving}
              settlePending={balance > 0 ? balance : null}
              // La lista corta y solo la moneda de la venta: el value object
              // del backend rechaza cualquier otra, y sin esto el error
              // aparecería después y sin explicar dónde.
              methods={PARTNER_SALE_PAYMENT_METHODS}
              currencies={[currency]}
            />
          </div>
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
