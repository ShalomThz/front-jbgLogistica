import { createCustomerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import type z from "zod";

export const createCustomerRequestSchema = createCustomerSchema;

export type CreateCustomerRequest = z.infer<typeof createCustomerRequestSchema>;
