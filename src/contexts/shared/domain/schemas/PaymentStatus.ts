export const PAYMENT_STATUSES = ["UNPAID", "PARTIALLY_PAID", "PAID"] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  UNPAID: "No pagado",
  PARTIALLY_PAID: "Parcial",
  PAID: "Pagado",
};

/**
 * Estilo para badges (outline) — tabla, detalle, resumen.
 *
 * ## La regla de color del sistema
 *
 * Un color, un significado, en toda la pantalla:
 *
 * - **ámbar** falta una acción. Significa lo mismo acá que en la barra de
 *   avance: algo espera que alguien se ocupe.
 * - **verde** cerrado bien. Lo usa el recorrido al entregar y el pago al
 *   saldarse. Cuando los dos están en verde, la orden está cerrada de las dos
 *   puntas — es redundancia que confirma, no dos señales peleando.
 * - **rojo** solo para lo que se cortó: devuelta, cancelada.
 * - **gris** nada que reportar.
 * - **azul** es de la marca (`--primary`) y del tránsito; nunca del dinero.
 *
 * De ahí la decisión que sorprende: **"No pagado" es ámbar, no rojo.** Casi toda
 * orden nace sin pagar; pintarlas rojas es fatiga de alarma y le saca al rojo el
 * único significado que lo hace útil. Falta plata es una acción pendiente, no
 * una rotura. "Parcial" y "No pagado" comparten el ámbar porque significan lo
 * mismo —falta plata— y los distingue la palabra, no el color.
 *
 * Los tonos salen de los tokens `--status-*` y no de literales de Tailwind: los
 * `*-500` andan en chroma 0.19–0.22 y le competían de igual a igual al azul de
 * la marca (0.25). Los tokens están por debajo a propósito, y separan el tono de
 * relleno del de texto, que necesitan luminosidades distintas.
 */
export const PAYMENT_STATUS_BADGE_CLASS: Record<PaymentStatus, string> = {
  PAID: "bg-status-done-soft text-status-done-fg border-status-done/40",
  PARTIALLY_PAID:
    "bg-status-attention-soft text-status-attention-fg border-status-attention/40",
  UNPAID:
    "bg-status-attention-soft text-status-attention-fg border-status-attention/40",
};

/**
 * Estilo para superficies grandes: encabezados de card y paneles de abono.
 *
 * Misma regla que los badges —ver arriba— para que un cambio de paleta no deje
 * al badge diciendo una cosa y a la card de la misma orden diciendo otra.
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
    card: "border-status-done/30 bg-gradient-to-br from-status-done-soft to-transparent",
    accent: "text-status-done-fg",
    iconBg: "bg-status-done-soft",
  },
  PARTIALLY_PAID: {
    card: "border-status-attention/30 bg-gradient-to-br from-status-attention-soft to-transparent",
    accent: "text-status-attention-fg",
    iconBg: "bg-status-attention-soft",
  },
  UNPAID: {
    card: "border-status-attention/30 bg-gradient-to-br from-status-attention-soft to-transparent",
    accent: "text-status-attention-fg",
    iconBg: "bg-status-attention-soft",
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
  PAID: "bg-status-done-soft text-status-done-fg border-status-done/40 hover:bg-status-done/20",
  PARTIALLY_PAID:
    "bg-status-attention-soft text-status-attention-fg border-status-attention/40 hover:bg-status-attention/20",
  UNPAID:
    "bg-status-attention-soft text-status-attention-fg border-status-attention/40 hover:bg-status-attention/20",
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
