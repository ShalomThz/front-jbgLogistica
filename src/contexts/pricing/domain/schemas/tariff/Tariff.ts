import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { moneySchema } from "@contexts/shared/domain/schemas/Money";

// La escalera de las paqueterías (FedEx, UPS, DHL). Va junto al modo de
// transporte, no en su lugar: el modo dice por dónde viaja la caja y el peldaño
// qué tan rápido dentro de ese modo.
export const serviceLevels = ["ECONOMY", "STANDARD", "EXPRESS", "PRIORITY"] as const;

// PUBLIC es lo que la tienda JBG le cobra al público; PARTNER lo que le cobra a
// una tienda socia, más barato para que el socio tenga margen.
export const priceTypes = ["PUBLIC", "PARTNER"] as const;

// Por dónde viaja la caja. Es el mismo vocabulario que el envío: la tarifa le
// pone precio al modo con el que después se despacha.
export const shippingModes = ["GROUND", "AIR", "SEA"] as const;

export type ServiceLevel = (typeof serviceLevels)[number];
export type PriceType = (typeof priceTypes)[number];
export type ShippingMode = (typeof shippingModes)[number];

export const SERVICE_LEVEL_LABELS: Record<ServiceLevel, string> = {
  ECONOMY: "Económico",
  STANDARD: "Estándar",
  EXPRESS: "Express",
  PRIORITY: "Prioritario",
};

/**
 * Un color por servicio, en escala de lo económico a lo prioritario. Sirve para
 * reconocer la columna sin leer el encabezado, así que tiene que ser el mismo
 * en la tabla, en el selector y en el diálogo de precios.
 */
export const SERVICE_LEVEL_COLORS: Record<ServiceLevel, string> = {
  ECONOMY:
    "bg-slate-100 text-slate-700 dark:bg-slate-400/15 dark:text-slate-300",
  STANDARD: "bg-sky-100 text-sky-700 dark:bg-sky-400/15 dark:text-sky-300",
  EXPRESS:
    "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300",
  PRIORITY:
    "bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300",
};

/** El punto de color suelto, para donde no cabe el chip entero. */
export const SERVICE_LEVEL_DOTS: Record<ServiceLevel, string> = {
  ECONOMY: "bg-slate-400",
  STANDARD: "bg-sky-500",
  EXPRESS: "bg-amber-500",
  PRIORITY: "bg-violet-500",
};

export const SHIPPING_MODE_LABELS: Record<ShippingMode, string> = {
  GROUND: "Terrestre",
  AIR: "Aéreo",
  SEA: "Marítimo",
};

export const PRICE_TYPE_LABELS: Record<PriceType, string> = {
  PUBLIC: "Público",
  PARTNER: "Socio",
};

// Una fila por precio: el peldaño es dato y no esquema, así que un tercero
// (socio premium, corporativo) no obliga a migrar nada.
export const tariffSchema = z.object({
  id: z.string(),
  zoneId: z.string(),
  // El destino sí mueve el precio: mandar a Guatemala no cuesta lo mismo que
  // a Nicaragua. Sale del destinatario, no de una elección de quien cobra.
  destinationCountry: z
    .string()
    .nullish()
    .transform((v) => v ?? "MX"),
  boxId: z.string(),
  serviceLevel: z.enum(serviceLevels),
  // Las tarifas anteriores al campo se leen como terrestre.
  shippingMode: z
    .enum(shippingModes)
    .nullish()
    .transform((v) => v ?? "GROUND"),
  priceType: z.enum(priceTypes),
  price: moneySchema,
  ...aggregateRootSchema.shape,
});

export type TariffPrimitives = z.infer<typeof tariffSchema>;

// CREATE TARIFF USE CASE
export const createTariffRequestSchema = tariffSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateTariffRequestPrimitives = z.infer<typeof createTariffRequestSchema>;
