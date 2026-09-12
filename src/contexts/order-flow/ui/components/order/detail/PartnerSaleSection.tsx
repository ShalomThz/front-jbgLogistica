import type { OrderFinancialsPrimitives } from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";
import { PAYMENT_METHOD_LABELS } from "@contexts/shared/domain/schemas/PaymentMethod";
import {
  PAYMENT_STATUS_BADGE_CLASS,
  PAYMENT_STATUS_SURFACE,
  resolveLedgerStatus,
} from "@contexts/shared/domain/schemas/PaymentStatus";
import { Badge, Button } from "@contexts/shared/shadcn";
import { ChevronDown, Store } from "lucide-react";
import { useState } from "react";
import { useOrders } from "@contexts/sales/infrastructure/hooks/orders/userOrders";
import { partnerSaleBilled } from "@contexts/sales/domain/schemas/value-objects/OrderFinancials";
import { PartnerSaleLedgerDialog } from "./PartnerSaleLedgerDialog";

const COST_FIELDS = [
  "insurance",
  "tools",
  "additionalCost",
  "wrap",
  "tape",
] as const;

const COST_LABELS: Record<(typeof COST_FIELDS)[number], string> = {
  insurance: "Seguro",
  tools: "Herramientas",
  additionalCost: "Costo adicional",
  wrap: "Embalaje",
  tape: "Cinta",
};

interface PartnerSaleSectionProps {
  orderId: string;
  partnerSale: NonNullable<OrderFinancialsPrimitives["partnerSale"]>;
  /** La tienda que cobró. Es de quién es esta plata. */
  storeName?: string;
  /** El cliente del agente: el remitente, que es quien llevó el paquete. */
  clientName?: string;
  /** Quien no puede editar la orden ve el saldo pero no lo mueve: es la misma
   * política que protege las rutas (`orderPolicies.edit`). */
  canEdit?: boolean;
}

/**
 * El libro del socio con su cliente: cuánto le cobró y cuánto le pagó.
 *
 * Vive fuera de `OrderFinancialSection` a propósito. Aquélla está en la pestaña
 * "Financiero JBG", que solo aparece con la orden completada, con envío y con
 * `CAN_VIEW_ORDER_FINANCIALS` — y una orden de socio nace en
 * `PENDING_HQ_PROCESS` sin envío, con un agente que no tiene ese permiso. Este
 * bloque quedaría escondido justo para quien es, así que tiene pestaña propia.
 *
 * Todo en cielo, que es el color del agente en el resto del detalle; el de JBG
 * es esmeralda. El botón del saldo abre el libro editable, igual que el control
 * de pagos de JBG abre el suyo.
 */
export const PartnerSaleSection = ({
  orderId,
  partnerSale,
  storeName,
  clientName,
  canEdit = false,
}: PartnerSaleSectionProps) => {
  const [ledgerOpen, setLedgerOpen] = useState(false);
  const {
    addPartnerSalePayment,
    removePartnerSalePayment,
    isSavingPartnerSalePayment,
  } = useOrders({ enabled: false });

  // Todo va en la moneda de la venta —el value object lo exige—, así que el
  // saldo se resta directo, sin conversión.
  const payments = partnerSale.payments ?? [];
  const billed = partnerSaleBilled(partnerSale);
  const paid = payments.reduce((sum, p) => sum + p.amount.amount, 0);
  const balance = Math.max(0, billed - paid);
  const currency = partnerSale.total.currency;
  const isSettled = balance <= 0;

  // El libro del socio no guarda `paymentStatus` —lo deriva— así que el estado
  // se calcula acá para pintarlo con el mismo semáforo que el de JBG.
  const status = resolveLedgerStatus(billed, paid);
  const surface = PAYMENT_STATUS_SURFACE[status];

  const statusLabel = isSettled
    ? "Saldado"
    : `Saldo $${balance.toFixed(2)} ${currency}`;
  const statusClass = PAYMENT_STATUS_BADGE_CLASS[status];

  const row = (label: string, value: string, strong = false) => (
    <div
      className={`flex justify-between gap-2 text-sm ${strong ? "font-semibold" : ""}`}
    >
      <span className={strong ? "" : "text-muted-foreground"}>{label}</span>
      <span className="shrink-0">{value}</span>
    </div>
  );

  const money = (amount: number) => `$${amount.toFixed(2)} ${currency}`;

  // `flatMap` y no `filter`: con el segundo, TypeScript no puede estrechar el
  // tipo y abajo haría falta un `!` en cada uso.
  const discount = partnerSale.discount?.amount?.amount ?? 0;

  const extras = COST_FIELDS.flatMap((field) => {
    const item = partnerSale.costBreakdown?.[field];
    return item?.amount ? [{ field, amount: item.amount }] : [];
  });

  return (
    <>
      <div className="space-y-4">
        {/* Encabezado: de quién es esta plata y a quién se le cobra. Los dos
            nombres importan — la tienda cobra, el remitente paga— y antes
            estaban apretados en una línea de 12px. */}
        <div
          className={`flex flex-wrap items-start justify-between gap-3 rounded-xl border p-4 ${surface.card}`}
        >
          <div className="space-y-1">
            <h4
              className={`flex items-center gap-2 text-base font-semibold ${surface.accent}`}
            >
              <span
                className={`flex size-8 items-center justify-center rounded-lg ${surface.iconBg}`}
              >
                <Store className={`size-4 ${surface.accent}`} />
              </span>
              Financiero agente
            </h4>
            <p className="text-xs text-muted-foreground">
              Lo que {storeName ? <b>{storeName}</b> : "el agente"} le cobra a{" "}
              {clientName ? <b>{clientName}</b> : "su cliente"}. No cambia lo que
              se le debe a JBG.
            </p>
          </div>

          {/* Botón cuando se puede editar, badge cuando no: el mismo criterio
              que usa `OrderPaymentControl` para el libro de JBG. */}
          {canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className={`flex items-center gap-1.5 ${statusClass}`}
              onClick={() => setLedgerOpen(true)}
            >
              {statusLabel}
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          ) : (
            <Badge variant="outline" className={statusClass}>
              {statusLabel}
            </Badge>
          )}
        </div>

        {/* Las tres cifras que resumen la venta, cada una en su tarjeta: el
            saldo cambia de color según esté saldada o no, que es lo primero
            que se busca al abrir la pestaña. */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Total a cobrar</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {money(billed)}
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {money(paid)}
            </p>
          </div>
          <div className={`rounded-xl border p-4 ${surface.card}`}>
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p
              className={`mt-1 text-2xl font-bold tabular-nums ${surface.accent}`}
            >
              {isSettled ? "Saldado" : money(balance)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* El desglose: el servicio y los extras por separado, que es como se
              lo imprime la factura al cliente del agente. */}
          <div className="overflow-hidden rounded-xl border">
            <div className="border-b bg-muted/40 px-4 py-2.5">
              <h5 className="text-sm font-semibold">Desglose</h5>
            </div>
            <div className="space-y-2 px-4 py-3">
              {row("Servicio", money(partnerSale.total.amount))}

              {extras.map(({ field, amount }) => (
                <div key={field}>{row(COST_LABELS[field], money(amount))}</div>
              ))}

              {discount > 0 && (
                <div className="flex justify-between gap-2 text-sm text-red-600 dark:text-red-400">
                  <span>
                    Descuento
                    {partnerSale.discount?.concept
                      ? ` · ${partnerSale.discount.concept}`
                      : ""}
                  </span>
                  <span className="shrink-0">−{money(discount)}</span>
                </div>
              )}

              {(extras.length > 0 || discount > 0) && (
                <>
                  <div className="border-t pt-2" />
                  {row("Total", money(billed), true)}
                </>
              )}
            </div>
          </div>

          {/* El libro. Vacío se dice, no se deja en blanco: sin esto no se
              distingue "no le pagó nada" de "esto todavía no cargó". */}
          <div className="overflow-hidden rounded-xl border">
            <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-2.5">
              <h5 className="text-sm font-semibold">Abonos de su cliente</h5>
              {payments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {payments.length}
                </Badge>
              )}
            </div>
            <div className="space-y-2 px-4 py-3">
              {payments.length === 0 ? (
                <p className="py-2 text-sm text-muted-foreground">
                  Todavía no registró ningún abono.
                </p>
              ) : (
                payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-start justify-between gap-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate">
                        {PAYMENT_METHOD_LABELS[payment.method] ??
                          payment.method}
                      </p>
                      {payment.concept && (
                        <p className="truncate text-xs text-muted-foreground">
                          {payment.concept}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 tabular-nums">
                      {`$${payment.amount.amount.toFixed(2)} ${payment.amount.currency}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <PartnerSaleLedgerDialog
        open={ledgerOpen}
        onClose={() => setLedgerOpen(false)}
        partnerSale={partnerSale}
        storeName={storeName}
        clientName={clientName}
        onAddPayment={(data) => addPartnerSalePayment(orderId, data)}
        onRemovePayment={(paymentId) =>
          removePartnerSalePayment(orderId, paymentId)
        }
        isSaving={isSavingPartnerSalePayment}
      />
    </>
  );
};
