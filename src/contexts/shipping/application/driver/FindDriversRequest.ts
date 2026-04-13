import type { z } from "zod";
import { driverListViewSchema } from "../../domain/schemas/driver/DriverListView";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findDriversRequestSchema = createCriteriaSchema(driverListViewSchema);

export type FindDriversRequest = z.infer<typeof findDriversRequestSchema>;
