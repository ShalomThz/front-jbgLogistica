import { z } from "zod";
import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { countryCodeSchema } from "@contexts/pricing/domain/schemas/tariff/CountryCode";

// Una zona es el territorio donde se recoge la caja. País y estado son
// etiquetas de agrupación para el catálogo, no una clave: un estado se divide
// en varias zonas ("Zona Centro", "Zona Norte"), así que no identifican una.
export const zoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Zone name is required"),
  description: z.string(),
  // Con `default` a propósito: las zonas viajan embebidas en las vistas de
  // usuario, tienda y tarifa, y ésas son fotos tomadas cuando se proyectaron.
  // Ser estricto acá haría que una foto vieja tumbe la pantalla —incluso el
  // login— en vez de mostrarse incompleta.
  country: countryCodeSchema.nullish().transform((v) => v ?? "MX"),
  state: z
    .string()
    .nullish()
    .transform((v) => v ?? ""),
  ...aggregateRootSchema.shape,
});

export type ZonePrimitives = z.infer<typeof zoneSchema>;

// El alta sí los exige: el default es para leer, no para crear.
export const createZoneRequestSchema = zoneSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    country: countryCodeSchema,
    state: z.string().min(1, "El estado es obligatorio"),
  });

export type CreateZoneRequestPrimitives = z.infer<typeof createZoneRequestSchema>;
