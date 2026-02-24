import type { z } from "zod";
import { storeListViewSchema } from "@contexts/iam/domain/schemas/store/StoreListView";
import { createCriteriaSchema } from "@contexts/shared/domain/services/CreateCriteriaSchema";

export const findStoresRequestSchema = createCriteriaSchema(storeListViewSchema);

export type FindStoresRequestPrimitives = z.infer<
  typeof findStoresRequestSchema
>;
