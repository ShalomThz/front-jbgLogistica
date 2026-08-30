import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@contexts/shared/shadcn";
import { HelpCircle, Store } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import { PendingPaymentControl } from "@contexts/order-flow/ui/components/order/orders-table/PendingPaymentControl";
import { PartnerOrderSummaryCard } from "./PartnerOrderSummaryCard";
import { SignatureCard } from "../../shared/SignatureCard";

interface PartnerPricingStepProps {
  /** La moneda del precio que se le cobra al socio: el cobro a su cliente se
   * captura en la misma para que los dos números se lean juntos. */
  currency: string;
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
  currency,
  storeName,
  partnerSalePayments,
  onAddPartnerSalePayment,
  onRemovePartnerSalePayment,
  onClearPartnerSalePayments,
  orderId,
}: PartnerPricingStepProps) {
  const { control, register } = useFormContext<PartnerOrderFormValues>();
  const partnerSale = useWatch<PartnerOrderFormValues, "partnerSale">({
    control,
    name: "partnerSale",
  });

  const total = parseFloat(partnerSale) || null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
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
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="h-10 pl-6 pr-14 text-lg font-bold"
                {...register("partnerSale")}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {currency}
              </span>
            </div>

            {/* Abonar solo tiene sentido contra un monto ya definido. */}
            {total !== null && total > 0 && (
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
