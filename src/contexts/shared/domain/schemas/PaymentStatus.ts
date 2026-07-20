export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "No pagado",
  PARTIALLY_PAID: "Parcial",
  PAID: "Pagado",
};

/** Estilo para badges (outline) — tabla, detalle, resumen. */
export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900",
  UNPAID:
    "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900",
};

/** Estilo para botones interactivos (con hover) — controles de pago. */
export const PAYMENT_STATUS_BUTTON_CLASS: Record<PaymentStatus, string> = {
  PAID: "bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/50 dark:hover:text-green-300",
  PARTIALLY_PAID:
    "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950/50 dark:hover:text-amber-300",
  UNPAID:
    "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:text-red-800 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-300",
};

/** Origen mínimo del estado (financials de la orden). Estructural para no
 * acoplar `shared` con `sales`. */
interface PaymentStatusSource {
  paymentStatus?: PaymentStatus;
  isPaid: boolean;
}

/** Órdenes previas a paymentStatus lo derivan de isPaid. */
export const resolvePaymentStatus = (
  financials: PaymentStatusSource,
): PaymentStatus =>
  financials.paymentStatus ?? (financials.isPaid ? "PAID" : "UNPAID");

interface Amount {
  amount: number;
  currency: string;
}

interface BilledBalanceSource {
  totalBilled: Amount | null;
  payments: { amount: Amount }[];
}

export interface BilledBalance {
  total: number;
  paid: number;
  /** total − pagado. Negativo = pagado de más (a favor). */
  pending: number;
}

/**
 * Pagado y saldo en la moneda de facturación. El front no convierte monedas,
 * así que solo es fiable cuando todos los abonos están en la moneda de
 * `totalBilled`; con monedas mixtas (o sin total) devuelve null y la UI muestra
 * únicamente el estado (que el backend deriva con FX).
 */
export const resolveBilledBalance = (
  financials: BilledBalanceSource,
): BilledBalance | null => {
  const total = financials.totalBilled;
  if (!total) return null;

  const paymentsOk = financials.payments.every(
    (p) => p.amount.currency === total.currency,
  );
  if (!paymentsOk) return null;

  const paid = financials.payments.reduce(
    (sum, p) => sum + p.amount.amount,
    0,
  );

  return { total: total.amount, paid, pending: total.amount - paid };
};
