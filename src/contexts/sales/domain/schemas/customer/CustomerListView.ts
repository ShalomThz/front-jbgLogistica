import { z } from "zod";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { customerSchema } from "./Customer";

export const customerListViewSchema = customerSchema
  .omit({ registeredByStoreId: true, userId: true })
  .extend({
    store: storeSchema,
    user: z.object({ id: z.string() }).passthrough().nullable().default(null),
  });

export type CustomerListViewPrimitives = z.infer<typeof customerListViewSchema>;
