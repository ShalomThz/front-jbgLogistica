import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@contexts/shared/shadcn";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import jbgLogo from "@/assets/carriers/jbg.png";
import { useExchangeRate } from "@contexts/shared/infrastructure/hooks/useExchangeRate";
import { useBilledTotal } from "@contexts/order-flow/ui/hooks/shared/useBilledTotal";
import type { PartnerOrderFormValues } from "@contexts/order-flow/domain/schemas/NewOrderForm";
import { PendingPaymentControl } from "@contexts/order-flow/ui/components/order/orders-table/PendingPaymentControl";
import type { AddPaymentRequest } from "@contexts/sales/application/order/AddPaymentRequest";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const COST_BREAKDOWN_FIELDS = ["insurance", "tools", "additionalCost", "wrap", "tape"] as const;

const COST_LABELS: Record<string, string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerTotalCardProps {
  tariffPrice: MoneyPrimitives | null;
  /** Corrige la tarifa desde la misma línea del desglose. */
  onTariffChange: (value: MoneyPrimitives) => void;
  /** El monto no salió de la tabla. Sin esto, un precio tarifado y uno escrito
   * a mano se ven idénticos. */
  isManualTariff: boolean;
  orderId?: string;
  pendingPayments: AddPaymentRequest[];
  onAddPayment: (data: AddPaymentRequest) => void;
  onRemovePayment: (index: number) => void;
  onClearPayments: () => void;
  /** `CAN_VIEW_ORDER_FINANCIALS`. Sin esto no se muestran los abonos a JBG. */
  canViewFinancials: boolean;
}

export function PartnerTotalCard({
  tariffPrice,
  onTariffChange,
  isManualTariff,
  orderId,
  pendingPayments,
  onAddPayment,
  onRemovePayment,
  onClearPayments,
  canViewFinancials,
}: PartnerTotalCardProps) {
  const { control } = useFormContext<PartnerOrderFormValues>();
  const shippingService = useWatch<PartnerOrderFormValues, "shippingService">({ name: "shippingService" });

  const displayCurrency = shippingService.currency;
  const tariffCurrency = tariffPrice?.currency ?? displayCurrency;
  const costsCurrency = shippingService.costBreakdownCurrency;

  const needsTariffConversion = tariffCurrency !== displayCurrency;
  const needsCostsConversion = costsCurrency !== displayCurrency;

  const { exchangeRate: tariffExchange } = useExchangeRate({
    from: tariffCurrency,
    to: displayCurrency,
    enabled: needsTariffConversion,
  });
  const tariffConversionRate = needsTariffConversion ? tariffExchange?.rate ?? null : 1;

  const { exchangeRate: costsExchange } = useExchangeRate({
    from: costsCurrency,
    to: displayCurrency,
    enabled: needsCostsConversion,
  });
  const costsConversionRate = needsCostsConversion ? costsExchange?.rate ?? null : 1;

  const tariffAmount = tariffPrice?.amount ?? 0;
  const costsTotal = COST_BREAKDOWN_FIELDS.reduce((sum, field) => {
    const val = parseFloat(shippingService.costBreakdown[field]);
    return sum + (val > 0 ? val : 0);
  }, 0);

  const convertedTariff = tariffConversionRate !== null ? tariffAmount * tariffConversionRate : null;
  const convertedCosts = costsConversionRate !== null ? costsTotal * costsConversionRate : null;
  const grandTotal = convertedTariff !== null && convertedCosts !== null ? convertedTariff + convertedCosts : null;

  // El libro de abonos se concilia en la MONEDA DE FACTURACIÓN (la de la
  // tarifa), no en la de visualización: el backend calcula totalBilled así, y
  // redondear el saldo en otra moneda antes de convertirlo pierde bastante más
  // que un centavo — por eso liquidar dejaba la orden en parcial.
  //
  // El número grande sigue mostrándose en la moneda elegida; lo que cambia es
  // contra qué se cobra.
  //
  // Sin descuento a propósito: el de JBG no viaja en la orden de socio —ni
  // `buildPartnerOrderRequest` ni `buildPartnerEditOrderRequest` lo mandan—, así
  // que restarlo acá cobraría de menos contra un total calculado sin él.
  const billedTotal = useBilledTotal({
    tariff: tariffPrice,
    costs: costsTotal,
    costsCurrency,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        {/* Con el logo, igual que la tabla de servicios: todo lo de esta card
            —tarifa, costos, total y abonos— es de la relación con JBG. */}
        <CardTitle className="flex items-center gap-2 text-base">
          <img
            src={jbgLogo}
            alt="JBG"
            className="size-6 shrink-0 rounded object-contain"
          />
          Desglose de costos
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Editable en la propia línea del desglose, y no en una card aparte:
              el monto se corrige donde se lee, y el efecto en el total queda dos
              renglones más abajo. El badge dice de dónde salió, porque un precio
              de la tabla y uno escrito a mano se veían idénticos.

              Sin `CAN_VIEW_ORDER_FINANCIALS` el monto se **lee**, no se escribe:
              es lo que JBG le cobra al socio, y el agente elige el servicio pero
              no le pone precio. El badge también sobra ahí — sin poder escribir
              a mano, siempre sale de la tabla. */}
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              Tarifa JBG
              {canViewFinancials && (
                <Badge
                  variant={isManualTariff ? "outline" : "secondary"}
                  className="px-1.5 py-0 text-[10px] font-normal"
                >
                  {isManualTariff ? "A mano" : "De la tabla"}
                </Badge>
              )}
            </span>
            {canViewFinancials ? (
              <div className="relative w-32 shrink-0">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={tariffAmount || ""}
                  onChange={(e) => {
                    const parsed = parseFloat(e.target.value);
                    onTariffChange({
                      amount:
                        Number.isFinite(parsed) && parsed >= 0 ? parsed : 0,
                      currency: tariffCurrency,
                    });
                  }}
                  className="h-8 pl-5 pr-12 text-right text-sm font-semibold"
                  placeholder="0.00"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                  {tariffCurrency}
                </span>
              </div>
            ) : (
              <span className="shrink-0 font-semibold tabular-nums">
                ${tariffAmount.toFixed(2)} {tariffCurrency}
              </span>
            )}
          </div>

          {COST_BREAKDOWN_FIELDS.map((field) => {
            const val = parseFloat(shippingService.costBreakdown[field]);
            if (!val || val <= 0) return null;
            return (
              <div key={field} className="flex justify-between text-sm text-muted-foreground">
                <span>{COST_LABELS[field]}</span>
                <span>${val.toFixed(2)} {costsCurrency}</span>
              </div>
            );
          })}

          <Separator />

          <div className="rounded-lg bg-muted/50 p-4 space-y-1">
            <div className="flex items-center justify-between">
              {/* "Total a cobrar" quedó ambiguo al entrar el cobro al cliente
                  del socio: cobrar, ¿a quién? Éste es el que el socio le paga
                  a JBG. */}
              <span className="text-sm font-medium text-muted-foreground">Total a pagar a JBG</span>
              <Controller
                control={control}
                name="shippingService.currency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-6 w-20 text-xs px-2">
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
            <div className="text-2xl font-bold text-blue-600">
              {grandTotal !== null ? `$${grandTotal.toFixed(2)} ${displayCurrency}` : "Calculando..."}
            </div>
            {(needsTariffConversion || needsCostsConversion) && grandTotal !== null && (
              <div className="text-xs text-muted-foreground space-y-0.5">
                {needsTariffConversion && (
                  <div>Servicio: ${tariffAmount.toFixed(2)} {tariffCurrency}</div>
                )}
                {needsCostsConversion && costsTotal > 0 && (
                  <div>Costos: ${costsTotal.toFixed(2)} {costsCurrency}</div>
                )}
              </div>
            )}
          </div>

          {/* Los abonos a JBG son plata de la relación con JBG: un agente no
              los ve. `SalesAgent` no tiene CAN_VIEW_ORDER_FINANCIALS. */}
          {canViewFinancials && (
            <>
              <Separator />

              <div className="space-y-2">
                {/* Con nombre propio: en esta orden hay dos libros de abonos y
                    sin encabezado el de arriba se leía como "los abonos". */}
                <div className="space-y-0.5">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <img
                      src={jbgLogo}
                      alt="JBG"
                      className="size-4 shrink-0 rounded object-contain"
                    />
                    Tus abonos a JBG
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Lo que ya pagaste de esta orden.
                  </p>
                </div>

                <PendingPaymentControl
                  grandTotal={billedTotal}
                  currency={tariffCurrency}
                  // Solo la de la tarifa: el saldo se concilia contra
                  // `totalBilled`, que el backend calcula en esa moneda.
                  // Ofrecer otra invitaba a cargar un abono que después no
                  // cerraba el saldo.
                  currencies={[tariffCurrency]}
                  // Lo que el socio le paga a JBG.
                  ledger="jbg"
                  orderId={orderId}
                  pendingPayments={pendingPayments}
                  onAddPayment={onAddPayment}
                  onRemovePayment={onRemovePayment}
                  onClearPayments={onClearPayments}
                />
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
