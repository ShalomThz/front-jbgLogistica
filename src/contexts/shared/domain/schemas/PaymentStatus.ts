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

/**
 * Estilo para superficies grandes: encabezados de card y paneles de abono.
 *
 * Mismo semáforo que los badges. Vive acá y no suelto en cada componente para
 * que un cambio de paleta no deje al badge diciendo verde y a la card de la
 * misma orden diciendo otra cosa.
 *
 * Ojo: cuando el color pasa a significar **estado**, deja de poder significar
 * **de quién es la plata**. Esa distinción la cargan el ícono y el título
 * —`Receipt`/"JBG" contra `Store`/"agente"—, no el color.
 */
export const PAYMENT_STATUS_SURFACE: Record<
  PaymentStatus,
  { card: string; accent: string; iconBg: string }
> = {
  PAID: {
    card: "border-green-200 bg-gradient-to-br from-green-50 to-transparent dark:border-green-900/50 dark:from-green-950/30",
    accent: "text-green-800 dark:text-green-300",
    iconBg: "bg-green-100 dark:bg-green-900/50",
  },
  PARTIALLY_PAID: {
    card: "border-amber-200 bg-gradient-to-br from-amber-50 to-transparent dark:border-amber-900/50 dark:from-amber-950/30",
    accent: "text-amber-800 dark:text-amber-300",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
  },
  UNPAID: {
    card: "border-red-200 bg-gradient-to-br from-red-50 to-transparent dark:border-red-900/50 dark:from-red-950/30",
    accent: "text-red-800 dark:text-red-300",
    iconBg: "bg-red-100 dark:bg-red-900/50",
  },
};

/** Deriva el semáforo de un libro cualquiera a partir de lo cobrado y lo
 * pagado. Sirve para el del socio con su cliente, que no guarda `paymentStatus`
 * —lo deriva— y aun así tiene que pintarse con los mismos colores. */
export const resolveLedgerStatus = (
  billed: number,
  paid: number,
): PaymentStatus => {
  if (toCents(paid) <= 0) return "UNPAID";
  return toCents(paid) >= toCents(billed) ? "PAID" : "PARTIALLY_PAID";
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
/** El dinero se compara y se muestra en centavos: `totalBilled` viene de sumar
 * importes multiplicados por tipos de cambio, así que arrastra residuos de coma
 * flotante (840.6510000000001) y una resta o un `>=` exactos fallan por una
 * fracción de centavo. */
export const toCents = (amount: number): number => Math.round(amount * 100);

export const roundMoney = (amount: number): number => toCents(amount) / 100;

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

  return {
    total: roundMoney(total.amount),
    paid: roundMoney(paid),
    pending: roundMoney(total.amount - paid),
  };
};
