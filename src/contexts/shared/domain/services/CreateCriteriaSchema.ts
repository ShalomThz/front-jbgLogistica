import z from "zod";

const filterOperators = [
  "=",
  "!=",
  ">",
  "<",
  ">=",
  "<=",
  "LIKE",
  "NOT_LIKE",
  "STARTS_WITH",
  "ENDS_WITH",
  "IN",
  "NOT IN",
  "ARRAY_CONTAINS",
  "ARRAY_CONTAINS_ANY",
  "ARRAY_CONTAINS_ALL",
  "ARRAY_NOT_CONTAINS",
  "ARRAY_IS_EMPTY",
  "ARRAY_IS_NOT_EMPTY",
  "IS_NULL",
  "IS_NOT_NULL",
  "IS_EMPTY",
  "IS_NOT_EMPTY",
  "EXISTS",
  "BEFORE",
  "AFTER",
  "BETWEEN",
  "IS_TODAY",
  "IN_LAST_DAYS",
  "IN_NEXT_DAYS",
  "BETWEEN_NUMBERS",
] as const;

const filterOperatorSchema = z.enum(filterOperators);

const directions = ["ASC", "DESC"] as const;

export function createCriteriaSchema<T extends z.ZodRawShape>(
  schema: z.ZodObject<T>,
) {
  const filterSchema = z.object({
    field: z.string(),
    filterOperator: filterOperatorSchema,
    value: z.unknown(),
  });

  const topLevelFields = Object.keys(schema.shape) as [string, ...string[]];

  const filterOrderSchema = z.object({
    field: z.enum(topLevelFields),
    direction: z.enum(directions),
  });

  return z.object({
    filters: z.array(filterSchema).default([]),
    order: filterOrderSchema.optional(),
    limit: z.number().optional(),
    offset: z.number().optional(),
  });
}
