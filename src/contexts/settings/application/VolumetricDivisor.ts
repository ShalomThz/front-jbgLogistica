import z from "zod";

/**
 * El divisor volumétrico, con su escala al lado. Espeja al del back.
 *
 * 166 in³/lb y 6000 cm³/kg son **el mismo divisor**; 166 y 5000 no lo son. Sin
 * la escala, quien lo configura escribe el número que le dio su paquetería y el
 * sistema lo lee en la otra, con un 20% de diferencia en el cobro.
 */
export const volumetricDivisorSchema = z.object({
  value: z.number().positive("El divisor debe ser mayor que cero"),
  basis: z.enum(["in3/lb", "cm3/kg"]),
});

export type VolumetricDivisor = z.infer<typeof volumetricDivisorSchema>;

export const saveVolumetricDivisorSchema = z.object({
  volumetricDivisor: volumetricDivisorSchema,
});

export type SaveVolumetricDivisorRequest = z.infer<
  typeof saveVolumetricDivisorSchema
>;

/** Los dos divisores de uso corriente, para que la pantalla no pida un número
 * al aire. El aéreo/express es 166 in³/lb; el terrestre, 139. */
export const VOLUMETRIC_DIVISOR_PRESETS: {
  label: string;
  divisor: VolumetricDivisor;
}[] = [
  { label: "Aéreo / express", divisor: { value: 166, basis: "in3/lb" } },
  { label: "Terrestre", divisor: { value: 139, basis: "in3/lb" } },
];

export const VOLUMETRIC_BASIS_LABELS: Record<
  VolumetricDivisor["basis"],
  string
> = {
  "in3/lb": "pulgadas³ por libra",
  "cm3/kg": "centímetros³ por kilo",
};
