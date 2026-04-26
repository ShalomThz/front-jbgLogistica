import type { FindPackagesResponsePrimitives } from "@/contexts/warehouse/application/FindPackagesResponse";
import { findPackagesResponseSchema } from "@/contexts/warehouse/application/FindPackagesResponse";
import type {
  CreatePackageRequest,
  PackageListViewPrimitives,
  UpdatePackageRequest,
  WarehousePackage,
} from "@/contexts/warehouse/domain/WarehousePackageSchema";
import { packageListViewSchema, warehousePackageSchema } from "@/contexts/warehouse/domain/WarehousePackageSchema";
import type {
  CreatePackageGroupRequest,
  EditPackageGroupRequest,
  PackageGroupPrimitives,
} from "@/contexts/warehouse/domain/PackageGroupSchema";
import { packageGroupSchema } from "@/contexts/warehouse/domain/PackageGroupSchema";
import { httpClient, httpClientBlob } from "@contexts/shared/infrastructure/http";

export const packageRepository = {
  find: async (
    request: { filters?: unknown[]; limit?: number; offset?: number, order?: { field: string, direction: "ASC" | "DESC" } } = {},
  ): Promise<FindPackagesResponsePrimitives> => {
    const data = await httpClient<unknown>("/package/find", {
      method: "POST",
      body: JSON.stringify({ filters: [], ...request }),
    });
    const d = findPackagesResponseSchema.safeParse(data);

    if (d.success) {
      return d.data;
    }

    console.error("Error parsing find packages response:", d.error);
    return d.data as unknown as FindPackagesResponsePrimitives;
  },

  getById: async (id: string): Promise<PackageListViewPrimitives> => {
    const data = await httpClient<unknown>(`/package/${id}`);
    return packageListViewSchema.parse(data);
  },

  create: async (pkg: CreatePackageRequest): Promise<WarehousePackage> => {
    const data = await httpClient<unknown>("/package", {
      method: "POST",
      body: JSON.stringify(pkg),
    });
    return warehousePackageSchema.parse(data);
  },

  update: async (id: string, pkg: UpdatePackageRequest): Promise<WarehousePackage> => {
    const data = await httpClient<unknown>(`/package/${id}`, {
      method: "PUT",
      body: JSON.stringify(pkg),
    });
    return warehousePackageSchema.parse(data);
  },

  createPackageGroup: async (payload: CreatePackageGroupRequest): Promise<PackageGroupPrimitives> => {
    const data = await httpClient<unknown>("/package-group", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return packageGroupSchema.parse(data);
  },

  editPackageGroup: async (
    packageGroupId: string,
    payload: EditPackageGroupRequest,
  ): Promise<PackageGroupPrimitives> => {
    const data = await httpClient<unknown>(`/package-group/${packageGroupId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return packageGroupSchema.parse(data);
  },

  delete: async (id: string): Promise<void> => {
    await httpClient<unknown>(`/package/${id}`, {
      method: "DELETE",
    });
  },

  getReceipt: async (id: string): Promise<Blob> => {
    return httpClientBlob(`/package/${id}/receipt`);
  },
};
