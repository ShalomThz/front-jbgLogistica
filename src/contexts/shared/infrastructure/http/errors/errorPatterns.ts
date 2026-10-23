/**
 * Interim: maps English prose from the backend to known error codes.
 * Remove entries as the backend migrates to structured { code, message } responses.
 */
export const messageFallbacks: Array<{ pattern: RegExp; code: string }> = [
  { pattern: /email.*already.*(taken|in use)|already.*(taken|in use).*email/i, code: "EMAIL_ALREADY_TAKEN" },
  { pattern: /phone.*already.*(taken|in use)|already.*(taken|in use).*phone/i, code: "PHONE_ALREADY_TAKEN" },
  { pattern: /order.*same partner order number.*already exists/i, code: "ORDER_DUPLICATE_PARTNER_NUMBER" },
  { pattern: /order.*same references.*already exists/i, code: "ORDER_DUPLICATE_REFERENCES" },
  // Antes del comodín `/already exists/` de abajo, que lo leería como una caja.
  { pattern: /an order with this id already exists/i, code: "ORDER_ID_CONFLICT" },
  { pattern: /box with same dimensions already exists/i, code: "BOX_DIMENSIONS_ALREADY_EXIST" },
  { pattern: /already exists/i, code: "BOX_NAME_ALREADY_EXISTS" },
  { pattern: /box not found/i, code: "BOX_NOT_FOUND" },
  { pattern: /package not found/i, code: "PACKAGE_NOT_FOUND" },
  { pattern: /carrier did not answer the label request/i, code: "CARRIER_NO_ANSWER" },
  { pattern: /while the carrier is creating its label|carrier is still creating the label/i, code: "LABEL_IN_CREATION" },
  { pattern: /cannot cancel a shipment that is already/i, code: "SHIPMENT_FINISHED" },
  { pattern: /cannot edit the package, addresses or pickup mode: the shipment already has a label/i, code: "LABEL_DATA_LOCKED" },
  // Antes del genérico de modo de recolección, que también lo atraparía.
  { pattern: /pickup mode: the shipment is already on a driver route/i, code: "PICKUP_MODE_ON_ROUTE" },
  // La caja ya está con el remitente, pero el paquete puede seguir sin recolectar.
  { pattern: /cannot remove the empty box request: the box was already delivered/i, code: "EMPTY_BOX_ALREADY_DELIVERED" },
  { pattern: /cannot change the pickup mode|cannot remove the (empty box|home pickup) request/i, code: "PICKUP_MODE_LOCKED" },
  { pattern: /payment from the partner's customer is required/i, code: "EMPTY_BOX_DOWN_PAYMENT_REQUIRED" },
  { pattern: /payment against a cancelled order/i, code: "ORDER_CANCELLED_PAYMENT" },
  { pattern: /payment with this id was already recorded with different data/i, code: "PAYMENT_ID_CONFLICT" },
  { pattern: /unauthorized|forbidden/i, code: "UNAUTHORIZED" },
];
