import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { customerSchema } from "./Customer";
import type z from "zod";

export const customerListViewSchema = customerSchema
  .omit({ registeredByStoreId: true })
  .extend({ store: storeSchema });

export type CustomerListViewPrimitives = z.infer<typeof customerListViewSchema>;
