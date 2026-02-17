import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";
import { z } from "zod";

export const findCustomersResponseSchema = z.object({
  data: z.array(customerSchema),
  pagination: paginationSchema,
});

export type FindCustomersResponsePrimitives = z.infer<typeof findCustomersResponseSchema>;
