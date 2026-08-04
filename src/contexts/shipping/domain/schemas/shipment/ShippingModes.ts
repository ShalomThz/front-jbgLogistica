/** Cómo viaja el paquete. Se elige junto con la paquetería en el paso de
 * cotización; los envíos previos a la función se leen como GROUND. */
export const shippingModes = ["GROUND", "AIR", "SEA"] as const;

export const SHIPPING_MODE_LABELS: Record<
  (typeof shippingModes)[number],
  string
> = {
  GROUND: "Terrestre",
  AIR: "Aéreo",
  SEA: "Marítimo",
};
