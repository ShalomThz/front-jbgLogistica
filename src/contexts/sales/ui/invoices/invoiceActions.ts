import { toast } from "sonner";
import type { MoneyPrimitives } from "@contexts/shared/domain/schemas/Money";
import { parseApiError } from "@contexts/shared/infrastructure/http/errors";
import { orderRepository } from "@contexts/sales/infrastructure/services/orders/orderRepository";

/**
 * Single source of truth for downloading/printing an order's invoice. The PDF
 * is generated on demand by the backend (`GET /invoice/:orderId/pdf`), so every
 * call reflects the order's current state.
 */

/** The slice of the order these actions need. */
export interface InvoiceOrderContext {
  id: string;
  references: { orderNumber: string | null };
  financials: {
    tariff: MoneyPrimitives | null;
    totalBilled: MoneyPrimitives | null;
  };
}

/** Message id so repeated failures collapse into one toast. */
const TOAST_ID = "invoice";

/** El object URL se libera con retraso: el navegador puede seguir leyéndolo
 * mientras inicia la descarga o mientras la ventana de impresión carga el PDF. */
const REVOKE_DELAY_MS = 60_000;

/** The invoice is built from the order's pricing: without a number, a tariff
 * and a billed total the backend refuses to generate it. */
export const canInvoice = (order: InvoiceOrderContext): boolean =>
  Boolean(
    order.references.orderNumber &&
      order.financials.tariff &&
      order.financials.totalBilled,
  );

const invoiceFilename = (order: InvoiceOrderContext): string =>
  `factura-${order.references.orderNumber ?? order.id}.pdf`;

const fetchInvoice = async (
  order: InvoiceOrderContext,
): Promise<{ url: string; cleanup: () => void }> => {
  const blob = await orderRepository.getInvoicePdf(order.id);
  const url = URL.createObjectURL(blob);
  return { url, cleanup: () => URL.revokeObjectURL(url) };
};

/** Downloads the invoice as `factura-<número de orden>.pdf`. */
export const downloadInvoice = async (
  order: InvoiceOrderContext,
): Promise<void> => {
  try {
    const { url, cleanup } = await fetchInvoice(order);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = invoiceFilename(order);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(cleanup, REVOKE_DELAY_MS);
  } catch (error) {
    toast.error(parseApiError(error), { id: TOAST_ID });
  }
};

/**
 * Abre la factura en una pestaña nueva y lanza el diálogo de impresión.
 *
 * La ventana se abre **antes** de pedir el PDF: generar la factura tarda más
 * que la activación transitoria del click, y un `window.open` posterior lo
 * bloquearía el navegador (devolviendo `null` y dejando el botón sin efecto).
 */
export const printInvoice = async (
  order: InvoiceOrderContext,
): Promise<void> => {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error(
      "Tu navegador bloqueó la ventana de impresión. Habilita las ventanas emergentes para este sitio.",
      { id: TOAST_ID },
    );
    return;
  }

  try {
    const { url, cleanup } = await fetchInvoice(order);
    printWindow.addEventListener("load", () => printWindow.print());
    printWindow.location.replace(url);
    window.setTimeout(cleanup, REVOKE_DELAY_MS);
  } catch (error) {
    printWindow.close();
    toast.error(parseApiError(error), { id: TOAST_ID });
  }
};
