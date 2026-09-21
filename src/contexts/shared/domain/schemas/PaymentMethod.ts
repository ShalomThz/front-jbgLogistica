export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "CC",
  "ZELLE",
  "BBVA",
  "PAGO_MEX",
  "CLOVER",
  "PENDING",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/**
 * Los que puede usar el socio para registrar lo que le pagó su cliente.
 *
 * Solo los tres instrumentos. La lista de arriba mezcla instrumentos (efectivo,
 * tarjeta, transferencia), bancos y servicios (BBVA, Pago Mex, Zelle) y el
 * procesador de JBG (Clover), y nada de eso describe cómo le pagó el cliente al
 * socio: un depósito por Zelle o por BBVA es una transferencia.
 *
 * Espeja `PARTNER_SALE_PAYMENT_METHODS` del backend, que es quien la valida.
 */
export const PARTNER_SALE_PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
] as const satisfies readonly PaymentMethod[];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CC: "C.C",
  ZELLE: "Zelle",
  BBVA: "BBVA",
  PAGO_MEX: "Pago Mex",
  CLOVER: "Clover",
  PENDING: "Pendiente",
};
