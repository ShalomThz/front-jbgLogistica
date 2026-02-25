import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { dimensionsSchema } from "@contexts/shared/domain/schemas/Dimensions";
import { weightSchema } from "@contexts/shared/domain/schemas/Weight";
import { customerSchema } from "@contexts/sales/domain/schemas/customer/Customer";
import { userSchema } from "@contexts/iam/domain/schemas/user/User";
import { storeSchema } from "@contexts/iam/domain/schemas/store/Store";
import { z } from "zod";

export const warehousePackageStatuses = [
  "WAREHOUSE",
  "SHIPPED",
  "DELIVERED",
  "REPACKED",
  "AUTHORIZED",
] as const;

export const providerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const packageListViewSchema = z.object({
  id: z.string(),
  provider: providerSummarySchema,
  user: userSchema,
  customer: customerSchema,
  store: storeSchema,
  boxId: z.string(),
  dimensions: dimensionsSchema,
  officialInvoice: z.string(),
  providerDeliveryPerson: z.string(),
  weight: weightSchema,
  status: z.enum(warehousePackageStatuses),
  ...aggregateRootSchema.shape,
});

export type WarehousePackageStatus = z.infer<typeof packageListViewSchema.shape.status>;
export type PackageListViewPrimitives = z.infer<typeof packageListViewSchema>;
export type ProviderSummaryPrimitives = z.infer<typeof providerSummarySchema>;

// Keep legacy alias so nothing else breaks
export type WarehousePackagePrimitives = PackageListViewPrimitives;

export const createPackageRequestSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  storeId: z.string().min(1, "Tienda requerida"),
  providerName: z.string().min(1, "Proveedor requerido"),
  boxId: z.string().min(1, "Caja requerida"),
  dimensions: dimensionsSchema,
  officialInvoice: z.string().min(1, "Factura requerida"),
  providerDeliveryPerson: z.string().min(1, "Repartidor requerido"),
  weight: weightSchema,
});

export type CreatePackageRequest = z.infer<typeof createPackageRequestSchema>;

export const updatePackageRequestSchema = z.object({
  providerName: z.string().min(1).optional(),
  boxId: z.string().optional(),
  dimensions: dimensionsSchema.optional(),
  officialInvoice: z.string().optional(),
  providerDeliveryPerson: z.string().optional(),
  weight: weightSchema.optional(),
  status: z.enum(warehousePackageStatuses).optional(),
});

export type UpdatePackageRequest = z.infer<typeof updatePackageRequestSchema>;


export const warehousePackageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  customerId: z.string(),
  storeId: z.string(),
  providerId: z.string(),
  boxId: z.string(),
  dimensions: dimensionsSchema,
  officialInvoice: z.string(),
  providerDeliveryPerson: z
    .string()
    .min(1, "Repartidor del proveedor es requerido"),
  weight: weightSchema,
  status: z.enum(warehousePackageStatuses),
  ...aggregateRootSchema.shape,
});

export type WarehousePackage = z.infer<typeof warehousePackageSchema>;