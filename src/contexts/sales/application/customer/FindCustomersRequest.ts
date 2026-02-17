import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findCustomersRequestSchema = createCriteriaSchema(customerSchema);

export type FindCustomersRequest = z.infer<typeof findCustomersRequestSchema>;
