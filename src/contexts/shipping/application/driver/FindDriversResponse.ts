import { z } from "zod";
import { driverListViewSchema } from "../../domain/schemas/driver/DriverListView";
import { paginationSchema } from "@contexts/shared/domain/schemas/Pagination";

export const findDriversResponseSchema = z.object({
  data: z.array(driverListViewSchema),
  pagination: paginationSchema,
});

export type FindDriversResponse = z.infer<typeof findDriversResponseSchema>;
