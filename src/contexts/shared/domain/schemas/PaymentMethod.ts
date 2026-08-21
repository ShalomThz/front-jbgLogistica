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

export const MANUAL_PAYMENT_METHODS = [
  "CASH",
  "CARD",
  "TRANSFER",
  "CC",
  "ZELLE",
  "BBVA",
  "PAGO_MEX",
] as const satisfies readonly PaymentMethod[];

export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

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
