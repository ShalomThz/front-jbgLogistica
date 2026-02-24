import type z from "zod";
import { tariffSchema } from "./Tariff";
import { zoneSchema } from "@contexts/pricing/domain/schemas/zone/Zone";
import { boxSchema } from "@contexts/inventory/domain/schemas/box/Box";

export const tariffListViewSchema = tariffSchema
  .omit({ originZoneId: true, boxId: true })
  .extend({ zone: zoneSchema, box: boxSchema });

export type TariffListViewPrimitives = z.infer<typeof tariffListViewSchema>;
