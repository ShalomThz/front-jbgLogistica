import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  skydropxCatalogItemSchema,
  type SkydropxCatalogItem,
} from "./SkydropxLegacyCatalog";
import { z } from "zod";

const catalogResponseSchema = z.object({
  data: z.array(skydropxCatalogItemSchema),
});

export const skydropxLegacyRepository = {
  getCategories: async (): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      "/skydropx/legacy/data?type=category",
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },

  getSubcategories: async (
    categoryId: string,
  ): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      `/skydropx/legacy/data?type=subcategory&id=${categoryId}`,
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },

  getClasses: async (
    subcategoryId: string,
  ): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      `/skydropx/legacy/data?type=class&id=${subcategoryId}`,
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },

  getPackagings: async (): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      "/skydropx/legacy/data?type=packagings",
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },
};
