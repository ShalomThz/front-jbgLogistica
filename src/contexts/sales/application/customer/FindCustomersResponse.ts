import { customerListViewResponseSchema } from "@contexts/sales/application/customer/CustomerResponse";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findCustomersResponseSchema = z.object({
  data: z.array(customerListViewResponseSchema),
  pagination: paginationSchema,
});

export type FindCustomersResponsePrimitives = z.infer<typeof findCustomersResponseSchema>;
