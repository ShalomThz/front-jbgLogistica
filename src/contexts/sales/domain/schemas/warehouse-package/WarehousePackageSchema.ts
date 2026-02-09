import { z } from "zod";
import { aggregateRootSchema } from "@/shared/domain";

export const warehousePackageStatuses = [
  "WAREHOUSE",
  "SHIPPED",
  "DELIVERED",
  "REPACKED",
  "AUTHORIZED",
] as const;

export const warehousePackageSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  storeId: z.string(),
  officialInvoice: z.string(),
  providerId: z.string(),
  providerDeliveryPerson: z.string().min(1, "Repartidor del proveedor es requerido"),
  boxId: z.string(),
  weightInKg: z.number().positive(),
  packer: z.string(),
  status: z.enum(warehousePackageStatuses),
  ...aggregateRootSchema.shape,
});

export type WarehousePackageStatus = z.infer<typeof warehousePackageSchema.shape.status>;
export type WarehousePackagePrimitives = z.infer<typeof warehousePackageSchema>;
