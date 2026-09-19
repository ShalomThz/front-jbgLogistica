import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { HelpCircle, Store } from "lucide-react";
import { Controller, useFormContext, useWatch } from "react-hook-form";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { PendingPaymentControl } from "@contexts/order-flow/ui/components/order/orders-table/PendingPaymentControl";
import { PARTNER_SALE_PAYMENT_METHODS } from "@contexts/shared/domain/schemas/PaymentMethod";
import { PartnerOrderSummaryCard } from "./PartnerOrderSummaryCard";
import { PartnerSaleCostsCard } from "./PartnerSaleCostsCard";
import { SignatureCard } from "../../shared/SignatureCard";
import { InvoiceNotesCard } from "../../shared/InvoiceNotesCard";

const COST_FIELDS = [
  "insurance",
  "tools",
  "additionalCost",
  "wrap",
  "tape",
] as const;

/** Los mismos cinco renglones que el desglose de JBG, en el mismo orden: así el
 * socio compara lo que le cobran contra lo que cobra sin traducir conceptos. */
const COST_LABELS: Record<(typeof COST_FIELDS)[number], string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerPricingStepProps {
  /** La tienda a nombre de la que se crea la orden. Va en la card porque este
   * cobro es de esa tienda, no de JBG, y es lo que sale en su factura. */
  storeName: string;
  /** Abonos que el cliente del socio ya le pagó **a él**. */
  partnerSalePayments: AddPaymentRequest[];
  onAddPartnerSalePayment: (data: AddPaymentRequest) => void;
  onRemovePartnerSalePayment: (index: number) => void;
  onClearPartnerSalePayments: () => void;
  orderId?: string;
}

/**
 * El paso del agente: lo único que es suyo.
 *
 * Cuánto le cobra a su cliente y cuánto le pagó ese cliente. Nada de lo que él
 * le debe a JBG —tarifa, costos, sus propios abonos— vive acá: eso es el paso de
 * cotización, y mezclarlos era lo que hacía ilegible la pantalla.
 */
export function PartnerPricingStep({
  storeName,
  partnerSalePayments,
  onAddPartnerSalePayment,
  onRemovePartnerSalePayment,
  onClearPartnerSalePayments,
  orderId,
}: PartnerPricingStepProps) {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<PartnerOrderFormValues>();
  // Monto y moneda salen del formulario y no de la tarifa: son del cobro al
  // cliente, y esa moneda es la única con la que se aceptan sus abonos.
  const partnerSale = useWatch<PartnerOrderFormValues, "partnerSale">({
    control,
    name: "partnerSale",
  });

  const currency = partnerSale.currency;

  // Espejo de `PartnerSale` en el back: base + extras es lo que el cliente debe,
  // y es contra ese número que se concilian los abonos. Conciliar contra la base
  // dejaría saldada una venta a la que todavía le faltan los extras.
  const base = parseFloat(partnerSale.amount) || 0;
  const extras = COST_FIELDS.reduce((sum, field) => {
    const value = parseFloat(partnerSale.costBreakdown[field]);
    return sum + (value > 0 ? value : 0);
  }, 0);
  const discount = Math.max(0, parseFloat(partnerSale.discount.amount) || 0);
  // Con piso en cero, igual que el dominio: un descuento mayor que la cuenta no
  // deja un total negativo.
  const total = Math.max(0, base + extras - discount);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Los extras se capturan acá, anchos, y se leen en la card de la
            derecha junto al total: la misma división que el paso de JBG, donde
            `PartnerAdditionalCostsCard` captura y `PartnerTotalCard` resume. */}
        <PartnerSaleCostsCard storeName={storeName} />

        <InvoiceNotesCard />
        <SignatureCard collapsible={false} />
      </div>

      <div className="space-y-4">
        <PartnerOrderSummaryCard />

        {/* Una sola card, espejo del desglose de JBG del paso anterior: el monto
            y lo que ya se cobró de ese monto son la misma cuenta, y tenerlos
            separados obligaba a mirar dos lugares para saber cuánto falta. */}
        <Card>
          <CardHeader className="pb-3">
            {/* La tienda arriba: el espejo del logo de JBG. Allá cobra JBG, acá
                cobra esta tienda. */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Store className="size-3.5" />
              {storeName}
            </div>
            <CardTitle className="flex items-center gap-1.5 text-base">
              Cobro a tu cliente
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <HelpCircle className="size-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  Es el monto que sale en la factura que le entregas a tu
                  cliente, en lugar de la tarifa de JBG. No cambia lo que le
                  pagas a JBG ni tus abonos. Opcional: sin esto la orden se crea
                  igual y solo queda sin factura.
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            {/* Con su propia moneda: el socio puede cobrarle a su cliente en
                una distinta a la que JBG le factura a él, y antes la heredaba
                sin poder cambiarla. La moneda manda sobre toda la card —base,
                extras y abonos—: el dominio no acepta mezcla. */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Servicio *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    aria-invalid={!!errors.partnerSale?.amount}
                    className="h-10 pl-6 text-lg font-bold"
                    {...register("partnerSale.amount")}
                  />
                </div>
                <Controller
                  control={control}
                  name="partnerSale.currency"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="h-10 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MXN">MXN</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              {/* Sin esto el paso se bloquea sin decir por qué: el botón del
                  último paso no distingue "falta algo" de "está guardando". */}
              {errors.partnerSale?.amount && (
                <p className="text-sm text-destructive">
                  {errors.partnerSale.amount.message}
                </p>
              )}
            </div>

            {/* Los extras solo se leen acá: se cargan en la card de la
                izquierda. Igual que el desglose de JBG, se muestran los que
                tienen importe y el resto no ocupa lugar. */}
            {COST_FIELDS.map((field) => {
              const value = parseFloat(partnerSale.costBreakdown[field]);
              if (!value || value <= 0) return null;
              return (
                <div
                  key={field}
                  className="flex justify-between text-sm text-muted-foreground"
                >
                  <span>{COST_LABELS[field]}</span>
                  <span>
                    ${value.toFixed(2)} {currency}
                  </span>
                </div>
              );
            })}

            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-600 dark:text-red-400">
                <span>
                  Descuento
                  {partnerSale.discount.concept
                    ? ` · ${partnerSale.discount.concept}`
                    : ""}
                </span>
                <span>
                  −${discount.toFixed(2)} {currency}
                </span>
              </div>
            )}

            <Separator />

            {/* El total se calcula, no se teclea: si el socio pudiera escribirlo
                aparte, podría no coincidir con la suma y la factura que le
                entrega a su cliente saldría contradiciéndose sola. */}
            <div className="space-y-1 rounded-lg bg-muted/50 p-4">
              <span className="text-sm font-medium text-muted-foreground">
                Total a tu cliente
              </span>
              <div className="text-2xl font-bold text-sky-600">
                ${total.toFixed(2)} {currency}
              </div>
              {(extras > 0 || discount > 0) && (
                <div className="text-xs text-muted-foreground">
                  Servicio ${base.toFixed(2)}
                  {extras > 0 && ` + extras $${extras.toFixed(2)}`}
                  {discount > 0 && ` − descuento $${discount.toFixed(2)}`}
                </div>
              )}
            </div>

            {/* Abonar solo tiene sentido contra un monto ya definido. */}
            {total > 0 && (
              <>
                <Separator />

                <div className="space-y-2">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Abonos de tu cliente</p>
                    <p className="text-xs text-muted-foreground">
                      Lo que ya te pagó a ti. No reduce lo que le debes a JBG.
                    </p>
                  </div>

                  <PendingPaymentControl
                    grandTotal={total}
                    currency={currency}
                    orderId={orderId}
                    // Los tres instrumentos y la moneda de la venta: el value
                    // object del backend rechaza cualquier otra, y sin esto el
                    // error aparecía recién al enviar la orden.
                    methods={PARTNER_SALE_PAYMENT_METHODS}
                    currencies={[currency]}
                    pendingPayments={partnerSalePayments}
                    onAddPayment={onAddPartnerSalePayment}
                    onRemovePayment={onRemovePartnerSalePayment}
                    onClearPayments={onClearPartnerSalePayments}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
