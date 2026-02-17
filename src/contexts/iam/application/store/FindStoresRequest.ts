import { z } from "zod";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";

const storeFields = storeSchema.keyof();

const filterOperators = [
  "EQUALS",
  "NOT_EQUALS",
  "GREATER_THAN",
  "LESS_THAN",
  "GREATER_THAN_OR_EQUALS",
  "LESS_THAN_OR_EQUALS",
  "BETWEEN",
  "LIKE",
  "IN",
  "NOT_IN",
] as const;

const orderDirections = ["ASC", "DESC"] as const;

const storeFilterSchema = z.object({
  field: storeFields,
  filterOperator: z.enum(filterOperators),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
});

export const findStoresRequestSchema = z.object({
  filters: z.array(storeFilterSchema).default([]),
  order: z
    .object({
      field: storeFields,
      direction: z.enum(orderDirections),
    })
    .optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type FindStoresRequestPrimitives = z.infer<
  typeof findStoresRequestSchema
>;
