import type { OrderStatus } from "./Order";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Borrador",
  PENDING_HQ_PROCESS: "Pendiente",
  COMPLETED: "Completada",
  CANCELLED: "Cancelada",
};

export const ORDER_STATUS_VARIANT: Record<
  OrderStatus,
  "secondary" | "default" | "outline" | "destructive"
> = {
  DRAFT: "secondary",
  PENDING_HQ_PROCESS: "outline",
  COMPLETED: "default",
  CANCELLED: "destructive",
};
