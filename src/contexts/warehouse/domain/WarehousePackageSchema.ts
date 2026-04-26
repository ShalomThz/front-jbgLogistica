import { aggregateRootSchema } from "@contexts/shared/domain/schemas/AggregateRoot";
import { dimensionsSchema } from "@contexts/shared/domain/schemas/Dimensions";
import { weightSchema } from "@contexts/shared/domain/schemas/Weight";
import { z } from "zod";

export const warehousePackageStatuses = [
  "WAREHOUSE",
  "SHIPPED",
  "DELIVERED",
  "REPACKED",
  "AUTHORIZED",
] as const;

// ── Shared sub-schemas ────────────────────────────────────────────────────────

export const packageBoxSchema = z.object({
  boxId: z.string(),
  dimensions: dimensionsSchema,
  weight: weightSchema,
});

export const providerDetailsSchema = z.object({
  providerId: z.string(),
  deliveryPerson: z.string().min(1, "Repartidor es requerido"),
  supplierInvoice: z.string().nullish(),
});

export type PackageBoxPrimitives = z.infer<typeof packageBoxSchema>;
export type ProviderDetailsPrimitives = z.infer<typeof providerDetailsSchema>;

// ── List view (GET /package, GET /package/:id) ────────────────────────────────

const entitySummarySchema = z.object({ id: z.string(), name: z.string() });

export const providerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export const packageListViewSchema = z.object({
  id: z.string(),
  provider: providerSummarySchema,
  user: entitySummarySchema,
  customer: z.object({ id: z.string(), name: z.string(), email: z.string() }),
  store: entitySummarySchema,
  providerDetails: providerDetailsSchema,
  boxes: z.array(packageBoxSchema).min(1),
  groupId: z.string().nullable().optional(),
  officialInvoice: z.string().optional(),
  status: z.enum(warehousePackageStatuses),
  photos: z.array(z.string()).max(4).default([]),
  ...aggregateRootSchema.shape,
});

export type WarehousePackageStatus = z.infer<typeof packageListViewSchema.shape.status>;
export type PackageListViewPrimitives = z.infer<typeof packageListViewSchema>;
export type ProviderSummaryPrimitives = z.infer<typeof providerSummarySchema>;

export type WarehousePackagePrimitives = PackageListViewPrimitives;

// ── Aggregate (POST /package, PUT /package/:id responses) ─────────────────────

export const warehousePackageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  customerId: z.string(),
  storeId: z.string(),
  providerDetails: providerDetailsSchema,
  boxes: z.array(packageBoxSchema).min(1),
  groupId: z.string().nullable().optional(),
  officialInvoice: z.string().optional(),
  status: z.enum(warehousePackageStatuses),
  photos: z.array(z.string()).max(4).default([]),
  ...aggregateRootSchema.shape,
});

export type WarehousePackage = z.infer<typeof warehousePackageSchema>;

// ── Create request ────────────────────────────────────────────────────────────

export const createPackageRequestSchema = z.object({
  customerId: z.string().min(1, "Cliente requerido"),
  storeId: z.string().min(1, "Tienda requerida"),
  providerName: z.string().min(1, "Proveedor requerido"),
  deliveryPerson: z.string().min(1, "Repartidor requerido"),
  supplierInvoice: z.string().optional(),
  boxes: z.array(packageBoxSchema).min(1, "Al menos una caja requerida"),
  officialInvoice: z.string().optional(),
  photos: z.array(z.string()).max(4).default([]),
});

export type CreatePackageRequest = z.infer<typeof createPackageRequestSchema>;

// ── Update request ────────────────────────────────────────────────────────────

export const updatePackageRequestSchema = z.object({
  providerName: z.string().min(1).optional(),
  deliveryPerson: z.string().min(1).optional(),
  supplierInvoice: z.string().nullish(),
  boxes: z.array(packageBoxSchema).min(1).optional(),
  officialInvoice: z.string().optional(),
  status: z.enum(warehousePackageStatuses).optional(),
  customerId: z.string().optional(),
  storeId: z.string().optional(),
  groupId: z.string().nullable().optional(),
  photos: z.array(z.string()).max(4).optional(),
});

export type UpdatePackageRequest = z.infer<typeof updatePackageRequestSchema>;
