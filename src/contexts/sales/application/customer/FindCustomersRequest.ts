import { customerListViewSchema } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";
import type z from "zod";

export const findCustomersRequestSchema = createCriteriaSchema(customerListViewSchema);

export type FindCustomersRequest = z.infer<typeof findCustomersRequestSchema>;
