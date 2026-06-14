import { httpClient } from "@contexts/shared/infrastructure/http/httpClient";
import {
  skydropxProConsignmentNoteSchema,
  skydropxProPackagingSchema,
  type SkydropxProConsignmentNote,
  type SkydropxProPackaging,
} from "@contexts/order-flow/domain/schemas/skydropx/SkydropxProCatalog";
import { z } from "zod";

const paginationMetaSchema = z.object({
  current_page: z.number(),
  next_page: z.number().nullish(),
  prev_page: z.number().nullish(),
  total_pages: z.number(),
  total_count: z.number(),
});

const packagingsResponseSchema = z.object({
  data: z.array(skydropxProPackagingSchema),
  meta: paginationMetaSchema,
});

const consignmentNotesResponseSchema = z.object({
  data: z.array(skydropxProConsignmentNoteSchema),
  meta: paginationMetaSchema,
});

export type SkydropxProPackagingsPage = z.infer<typeof packagingsResponseSchema>;
export type SkydropxProConsignmentNotesPage = z.infer<
  typeof consignmentNotesResponseSchema
>;

function buildQuery(params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      query.set(key, String(value));
    }
  }
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const skydropxProRepository = {
  getPackagings: async (params: {
    search?: string;
    code?: string;
    page?: number;
  } = {}): Promise<SkydropxProPackagingsPage> => {
    const data = await httpClient<unknown>(
      `/skydropx/pro/packagings${buildQuery({
        name: params.search,
        code: params.code,
        page: params.page,
      })}`,
    );
    return packagingsResponseSchema.parse(data);
  },

  getConsignmentNotes: async (params: {
    search?: string;
    code?: string;
    page?: number;
  } = {}): Promise<SkydropxProConsignmentNotesPage> => {
    const data = await httpClient<unknown>(
      `/skydropx/pro/consignment_notes${buildQuery({
        description: params.search,
        consignment_note: params.code,
        page: params.page,
      })}`,
    );
    return consignmentNotesResponseSchema.parse(data);
  },
};

export type { SkydropxProPackaging, SkydropxProConsignmentNote };
