import { z } from "zod";
import { DEFAULT_LINEAR_FEET_DIVISOR } from "@contexts/consolidation/domain/calculateLinearFeet";

const positiveNumber = (message: string) =>
  z.string().refine((v) => Number(v) > 0, message);

const selectedOrderSchema = z.object({
  orderId: z.string(),
  displayLabel: z.string().optional(),
  linearFeet: z.number().positive("Captura cuántos pies lineales ocupa"),
  section: z.string(),
});

/** Formulario del wizard "Nuevo consolidado". Los números se capturan como
 * texto (como en los formularios de órdenes) y se convierten al crear. */
export const newConsolidationFormSchema = z.object({
  folio: z.string().trim().min(1, "El folio es requerido"),
  origin: z.string().trim().min(1, "El origen es requerido"),
  destination: z.string().trim().min(1, "El destino es requerido"),
  // Día de salida planeada (`YYYY-MM-DD`); vacío = sin fecha todavía.
  plannedDepartureAt: z.string(),
  trailerId: z.string().min(1, "Elige un tráiler"),
  // Vacío = sin conductor asignado.
  driverId: z.string(),
  capacityLinearFeet: positiveNumber("La capacidad debe ser mayor a 0"),
  linearFeetDivisor: positiveNumber("El divisor debe ser mayor a 0"),
  orders: z.array(selectedOrderSchema),
});

export type NewConsolidationFormValues = z.infer<typeof newConsolidationFormSchema>;

export const newConsolidationDefaultValues: NewConsolidationFormValues = {
  folio: "",
  origin: "",
  destination: "",
  plannedDepartureAt: "",
  trailerId: "",
  driverId: "",
  capacityLinearFeet: "53",
  linearFeetDivisor: String(DEFAULT_LINEAR_FEET_DIVISOR),
  orders: [],
};

/** Campos que valida cada paso antes de avanzar. */
export const NEW_CONSOLIDATION_STEP_FIELDS = {
  datos: [
    "folio",
    "origin",
    "destination",
    "plannedDepartureAt",
    "trailerId",
    "driverId",
    "capacityLinearFeet",
    "linearFeetDivisor",
  ],
  ordenes: ["orders"],
} as const satisfies Record<string, readonly (keyof NewConsolidationFormValues)[]>;
