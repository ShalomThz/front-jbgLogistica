import { z } from "zod";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { userRefSchema } from "@contexts/iam/domain/schemas/user/User";
import { boxSchema } from "@contexts/inventory/domain/schemas/box/Box";
import {
  boxSaleItemSchema,
  boxSaleSchema,
} from "@contexts/inventory/domain/schemas/boxSale/BoxSale";

export const boxSaleListViewItemSchema = boxSaleItemSchema.extend({
  box: boxSchema.omit({ price: true }).nullable(),
});

export const boxSaleListViewSchema = boxSaleSchema
  .omit({ items: true, storeId: true, soldBy: true })
  .extend({
    items: z.array(boxSaleListViewItemSchema).min(1),
    store: storeSchema,
    soldBy: userRefSchema.nullable(),
  });

export type BoxSaleListViewItemPrimitives = z.infer<
  typeof boxSaleListViewItemSchema
>;
export type BoxSaleListViewPrimitives = z.infer<typeof boxSaleListViewSchema>;
