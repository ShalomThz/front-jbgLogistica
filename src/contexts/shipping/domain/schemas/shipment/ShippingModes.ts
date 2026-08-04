/** Cómo viaja el paquete. Se elige junto con la paquetería en el paso de
 * cotización; los envíos previos a la función se leen como GROUND. */
export const shippingModes = ["GROUND", "AIR", "SEA"] as const;

export type ShippingMode = (typeof shippingModes)[number];

export const SHIPPING_MODE_LABELS: Record<ShippingMode, string> = {
  GROUND: "Terrestre",
  AIR: "Aéreo",
  SEA: "Marítimo",
};
