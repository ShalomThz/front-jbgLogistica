import { customerListViewSchema } from "@contexts/sales/domain/schemas/customer/CustomerListView";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findCustomersResponseSchema = z.object({
  data: z.array(customerListViewSchema),
  pagination: paginationSchema,
});

export type FindCustomersResponsePrimitives = z.infer<typeof findCustomersResponseSchema>;
