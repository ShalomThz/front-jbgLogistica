import { z } from "zod";
import { userSchema } from "./User";

const userFields = userSchema.keyof();

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

const userFilterSchema = z.object({
  field: userFields,
  filterOperator: z.enum(filterOperators),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.union([z.string(), z.number(), z.boolean()])),
  ]),
});

export const findUsersRequestSchema = z.object({
  filters: z.array(userFilterSchema).default([]),
  order: z
    .object({
      field: userFields,
      direction: z.enum(orderDirections),
    })
    .optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().nonnegative().default(0),
});

export type FindUsersRequestPrimitives = z.infer<
  typeof findUsersRequestSchema
>;
