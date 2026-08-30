import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@contexts/shared/shadcn";
import {
  ArrowRight,
  FilePlus2,
  FileText,
  MapPin,
  Package,
  Printer,
  Store,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import cajaSonriendo from "@/assets/cajaFondoTransparenteJBG.png";
import jbgLogo from "@/assets/carriers/jbg.png";
import { useOrder } from "@contexts/sales/infrastructure/hooks/orders/useOrder";
import {
  canInvoice,
  canInvoicePartner,
  downloadInvoice,
  printInvoice,
  type InvoiceVariant,
} from "@contexts/sales/ui/invoices/invoiceActions";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";

const money = (value: MoneyPrimitives | null | undefined) =>
  value ? `$${value.amount.toFixed(2)} ${value.currency}` : "—";

interface PartnerOrderSuccessViewProps {
  orderId?: string;
  /** `CAN_VIEW_ORDER_FINANCIALS`. El agente no lo tiene y no ve lo de JBG. */
  canViewFinancials: boolean;
  onCreateBlank: () => void;
  onCreateSameClient: () => void;
  onFinish: () => void;
  /** La etiqueta de anticipo, solo en caja vacía o recolección a domicilio. */
  children?: React.ReactNode;
}

/**
 * El cierre de una orden de socio.
 *
 * Antes era un cartel verde y tres botones: no decía qué se había creado ni
 * dejaba imprimir la factura que el agente le entrega a su cliente, que es
 * justo lo que necesita en ese momento y lo obligaba a ir al listado a
 * buscarla.
 *
 * No reutiliza `OrderSuccessView` de HQ porque aquélla se arma alrededor del
 * envío y su guía, y una orden de socio nace sin envío: queda en
 * `PENDING_HQ_PROCESS` hasta que JBG la procesa.
 */
export function PartnerOrderSuccessView({
  orderId,
  canViewFinancials,
  onCreateBlank,
  onCreateSameClient,
  onFinish,
  children,
}: PartnerOrderSuccessViewProps) {
  const { data: order } = useOrder(orderId);
  const [isBusy, setIsBusy] = useState(false);
  /** Abierto al llegar: es el aviso de que la orden se creó. */
  const [showSuccessDialog, setShowSuccessDialog] = useState(true);

  const partnerSale = order?.financials.partnerSale ?? null;
  const paid = (partnerSale?.payments ?? []).reduce(
    (sum, payment) => sum + payment.amount.amount,
    0,
  );
  const balance = partnerSale
    ? Math.max(0, partnerSale.total.amount - paid)
    : 0;

  const withBusy = async (action: () => Promise<void>) => {
    setIsBusy(true);
    try {
      await action();
    } finally {
      setIsBusy(false);
    }
  };

  const invoice = (variant: InvoiceVariant, print: boolean) => () =>
    withBusy(() =>
      order
        ? print
          ? printInvoice(order, variant)
          : downloadInvoice(order, variant)
        : Promise.resolve(),
    );

  return (
    <div className="space-y-6">
      {/* El aviso es un modal, como en HQ: se celebra una vez y se cierra, en
          vez de ocupar el alto de la pantalla encima del resumen que el agente
          vino a mirar. */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="border-green-200 bg-green-50 sm:max-w-md dark:border-green-800 dark:bg-green-950/30">
          <DialogHeader className="items-center text-center">
            <img
              src={cajaSonriendo}
              alt=""
              aria-hidden="true"
              className="animate-caja-feliz size-32 object-contain"
            />
            <DialogTitle className="text-xl text-green-700 dark:text-green-400">
              Orden creada exitosamente
            </DialogTitle>
            <DialogDescription className="text-green-600/80 dark:text-green-400/70">
              Queda pendiente de procesamiento en JBG
            </DialogDescription>
          </DialogHeader>
          <Button
            className="mt-2 bg-green-600 hover:bg-green-700"
            onClick={() => setShowSuccessDialog(false)}
          >
            Ver resumen
          </Button>
        </DialogContent>
      </Dialog>

      {/* Los folios quedan en la página: son lo que el agente copia o dicta, y
          adentro del modal se irían al cerrarlo. */}
      {order && (
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="mr-1 text-lg font-semibold">Orden creada</h2>
          <Badge variant="secondary" className="font-mono">
            {order.references.orderNumber ?? order.id.slice(0, 8)}
          </Badge>
          {order.references.partnerOrderNumber && (
            <Badge variant="outline" className="font-mono">
              Tu folio: {order.references.partnerOrderNumber}
            </Badge>
          )}
        </div>
      )}

      {/* Dos columnas como el cierre de HQ, con `items-start` para que la más
          corta no se estire. Izquierda la plata —lo que se le paga a JBG y lo
          que se le cobra al cliente, para leerlos uno debajo del otro—, derecha
          el envío y lo accionable. */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="space-y-6">
          {canViewFinancials && order && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <img
                    src={jbgLogo}
                    alt="JBG"
                    className="size-5 shrink-0 rounded object-contain"
                  />
                  Precio del servicio JBG
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa</span>
                  <span>{money(order.financials.tariff)}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span>{money(order.financials.totalBilled)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {partnerSale && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Store className="size-3.5" />
                  {order?.store.name}
                </div>
                <CardTitle className="text-base">Cobro a tu cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">
                    {money(partnerSale.total)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pagado</span>
                  <span>
                    ${paid.toFixed(2)} {partnerSale.total.currency}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-base font-bold">
                  <span>Saldo</span>
                  <span
                    className={
                      balance > 0 ? "text-destructive" : "text-green-600"
                    }
                  >
                    ${balance.toFixed(2)} {partnerSale.total.currency}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          {order && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0 text-sm">
                <div className="flex items-start gap-2">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span className="truncate font-medium">
                      {order.origin.name}
                    </span>
                    <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">
                      {order.destination.name}
                    </span>
                    <span className="text-muted-foreground">
                      · {order.destination.address.city},{" "}
                      {order.destination.address.country}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="size-4 shrink-0" />
                  {order.package.dimensions.length} ×{" "}
                  {order.package.dimensions.width} ×{" "}
                  {order.package.dimensions.height}{" "}
                  {order.package.dimensions.unit}
                  {order.package.weight?.value
                    ? ` · ${order.package.weight.value} ${order.package.weight.unit}`
                    : ""}
                </div>
              </CardContent>
            </Card>
          )}

          {children}

          {order && (canInvoice(order) || canInvoicePartner(order)) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Facturas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {/* La del agente primero y en botón primario: es la que le entrega
                a su cliente ahora mismo. */}
                {canInvoicePartner(order) && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      className="gap-2"
                      disabled={isBusy}
                      onClick={invoice("partner", false)}
                    >
                      <FileText className="size-4" />
                      Factura para tu cliente
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isBusy}
                      onClick={invoice("partner", true)}
                    >
                      <Printer className="size-4" />
                      Imprimir
                    </Button>
                  </div>
                )}
                {canViewFinancials && canInvoice(order) && (
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isBusy}
                      onClick={invoice("jbg", false)}
                    >
                      <FileText className="size-4" />
                      Factura de JBG
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2"
                      disabled={isBusy}
                      onClick={invoice("jbg", true)}
                    >
                      <Printer className="size-4" />
                      Imprimir
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2" onClick={onCreateBlank}>
            <FilePlus2 className="size-4" />
            Nueva orden en blanco
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={onCreateSameClient}
          >
            <UserPlus className="size-4" />
            Nueva orden del mismo cliente
          </Button>
        </div>
        <Button className="ml-auto" onClick={onFinish}>
          Ir a órdenes
        </Button>
      </div>
    </div>
  );
}
