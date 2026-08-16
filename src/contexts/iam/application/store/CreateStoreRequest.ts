import { z } from "zod";
import { storeSchema, storeTypes } from "@contexts/iam/domain/schemas/store/Store";

export const createStoreRequestSchema = storeSchema
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    // Sin el `default` de storeSchema: aquél existe para leer documentos
    // anteriores al campo, no para que dar de alta una tienda sin tipo la
    // vuelva socia por omisión.
    type: z.enum(storeTypes),
  });

export type CreateStoreRequestPrimitives = z.infer<typeof createStoreRequestSchema>;
