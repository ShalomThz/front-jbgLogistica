import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  skydropxCatalogItemSchema,
  type SkydropxCatalogItem,
} from "./SkydropxCatalog";
import { z } from "zod";

const catalogResponseSchema = z.object({
  data: z.array(skydropxCatalogItemSchema),
});

export const skydropxRepository = {
  getCategories: async (): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>("/skydropx/data?type=category", {
      method: "POST",
    });
    return catalogResponseSchema.parse(data).data;
  },

  getSubcategories: async (
    categoryId: string,
  ): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      `/skydropx/data?type=subcategory&id=${categoryId}`,
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },

  getClasses: async (
    subcategoryId: string,
  ): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>(
      `/skydropx/data?type=class&id=${subcategoryId}`,
      { method: "POST" },
    );
    return catalogResponseSchema.parse(data).data;
  },

  getPackagings: async (): Promise<SkydropxCatalogItem[]> => {
    const data = await httpClient<unknown>("/skydropx/data?type=packagings", {
      method: "POST",
    });
    return catalogResponseSchema.parse(data).data;
  },
};
