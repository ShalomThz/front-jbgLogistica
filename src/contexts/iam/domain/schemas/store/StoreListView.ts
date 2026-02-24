import type { z } from "zod";
import { storeSchema } from "./Store";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";

export const storeListViewSchema = storeSchema
  .omit({ zoneId: true })
  .extend({ zone: zoneSchema });

export type StoreListViewPrimitives = z.infer<typeof storeListViewSchema>;
