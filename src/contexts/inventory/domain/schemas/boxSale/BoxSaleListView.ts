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
    // Identidad de la tienda, no la tienda entera: es lo único que manda el
    // backend y lo único que se lee (`store.name` en tabla, detalle y export;
    // `store.id` para filtrar).
    store: storeSchema.pick({ id: true, name: true }),
    soldBy: userRefSchema.nullable(),
  });

export type BoxSaleListViewItemPrimitives = z.infer<
  typeof boxSaleListViewItemSchema
>;
export type BoxSaleListViewPrimitives = z.infer<typeof boxSaleListViewSchema>;
