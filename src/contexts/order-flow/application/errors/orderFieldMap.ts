import type { FieldPath } from "react-hook-form";
import type { NewOrderFormValues } from "../../domain/schemas/NewOrderForm";

export type OrderErrorTarget = {
  field: FieldPath<NewOrderFormValues>;
  step?: string;
};

export const orderFieldMap: Record<string, OrderErrorTarget> = {
  ORDER_DUPLICATE_REFERENCES: {
    field: "orderData.orderNumber",
    step: "contact",
  },
  ORDER_DUPLICATE_PARTNER_NUMBER: {
    field: "orderData.partnerOrderNumber",
    step: "contact",
  },
};
