import type z from "zod";
import { tariffListViewSchema } from "@contexts/pricing/domain/schemas/tariff/TariffListView";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findTariffsRequestSchema = createCriteriaSchema(tariffListViewSchema);

export type FindTariffsRequestPrimitives = z.infer<typeof findTariffsRequestSchema>;
