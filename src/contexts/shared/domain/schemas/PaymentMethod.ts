export const PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "CC",
  "ZELLE",
  "BBVA",
  "PAGO_MEX",
  "PENDING",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Efectivo",
  CARD: "Tarjeta",
  TRANSFER: "Transferencia",
  CC: "C.C",
  ZELLE: "Zelle",
  BBVA: "BBVA",
  PAGO_MEX: "Pago Mex",
  PENDING: "Pendiente",
};
