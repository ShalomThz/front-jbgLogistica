import { z } from "zod";
import { warehousePackageStatuses } from "@/contexts/warehouse/domain/WarehousePackageSchema";

export const packageGroupSchema = z.object({
    id: z.string(),
    status: z.enum(warehousePackageStatuses),
    invoiceNumber: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export const createPackageGroupRequestSchema = z.object({
    packageIds: z.array(z.string()).min(1),
    invoiceNumber: z.string().optional(),
});

export const editPackageGroupRequestSchema = z.object({
    invoiceNumber: z.string().optional(),
    status: z.enum(warehousePackageStatuses).optional(),
});

export type PackageGroupPrimitives = z.infer<typeof packageGroupSchema>;
export type CreatePackageGroupRequest = z.infer<typeof createPackageGroupRequestSchema>;
export type EditPackageGroupRequest = z.infer<typeof editPackageGroupRequestSchema>;
export type UpdatePackageRequest = {
    groupId?: string | null;
    invoiceNumber?: string;
};