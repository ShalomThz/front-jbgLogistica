import { findPackagesResponseSchema } from "@/contexts/warehouse/application/FindPackagesResponse";
import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";
import type {
  CreatePackageGroupRequest,
  EditPackageGroupRequest,
  PackageGroupPrimitives,
} from "@/contexts/warehouse/domain/PackageGroupSchema";
import { packageGroupSchema } from "@/contexts/warehouse/domain/PackageGroupSchema";
import type { PackageListViewPrimitives } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { packageListViewSchema } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { httpClient } from "@contexts/shared/infrastructure/http";

export const customerPackageRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number; order?: { field: string; direction: "ASC" | "DESC" } } = {},
  ): Promise<FindPackagesResponsePrimitives> => {
    const data = await httpClient<unknown>("/customer-warehouse/packages", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    return findPackagesResponseSchema.parse(data);
  },

  createPackageGroup: async (payload: CreatePackageGroupRequest): Promise<PackageGroupPrimitives> => {
    const data = await httpClient<unknown>("/customer-warehouse/package-group", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return packageGroupSchema.parse(data);
  },

  editPackageGroup: async (
    packageGroupId: string,
    payload: EditPackageGroupRequest,
  ): Promise<PackageGroupPrimitives> => {
    const data = await httpClient<unknown>(`/customer-warehouse/package-group/${packageGroupId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return packageGroupSchema.parse(data);
  },

  editPackage: async (
    packageId: string,
    payload: Partial<{
      groupId: string | null;
      invoiceNumber: string;
    }>,
  ): Promise<PackageListViewPrimitives> => {
    const data = await httpClient<unknown>(`/customer-warehouse/package/${packageId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return packageListViewSchema.parse(data);
  },
};
